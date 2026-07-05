/**
 * Solana sponsoring relayer.
 *
 * GET  /api/solana/relay            → { fee_payer } (the relayer pubkey the SDK
 *                                      sets as fee payer before serializing).
 * POST /api/solana/relay            → co-sign + submit a Cavos device-account tx.
 *
 * The relayer pays fees/rent so the user's silent device key (which holds no SOL)
 * gets a gasless experience. It is a fee payer, NOT a custodian — see
 * lib/solana/relayer.ts for the security model + instruction whitelist.
 */
import { NextResponse } from 'next/server';
import { Connection, Transaction } from '@solana/web3.js';
import { ApiLogger } from '@/lib/api/logger';
import { ApiResponse } from '@/lib/api/response';
import { ApiMiddleware } from '@/lib/api/middleware';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';
import {
  connectionFor,
  isSupportedSolanaNetwork,
  validateSponsoredTransaction,
} from '@/lib/solana/relayer';
import { getRelayerSigner } from '@/lib/solana/signer';
import { resolveSolanaProgramAllowlist } from '@/lib/solana/programs';
import { resolveOrgForApp } from '@/lib/billing/limits';
import { debitSolanaGas, hasGas, shouldBlockGas } from '@/lib/solana/gas';

interface RelayRequest {
  app_id: string;
  network: string;
  /** base64-encoded legacy Transaction with fee payer = relayer, no signatures. */
  transaction: string;
}

/** GET — expose the relayer fee-payer pubkey (per network) so the SDK can build the tx. */
export async function GET(request: Request) {
  try {
    const n = new URL(request.url).searchParams.get('network') ?? '';
    const network = isSupportedSolanaNetwork(n) ? n : undefined;
    const signer = await getRelayerSigner(network);
    return ApiResponse.success({ fee_payer: signer.publicKey.toBase58() });
  } catch (error) {
    // Surface the real cause (missing relayer secret env, bad key encoding)
    // — this only reveals config errors, never secrets.
    console.error('Solana relay GET — fee-payer lookup failed', error);
    return ApiResponse.serverError(
      `relayer not configured: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Confirm a submitted transaction via HTTP polling of getSignatureStatuses,
 * rebroadcasting the raw tx each tick so a dropped send still lands. Resolves
 * once the signature reaches `confirmed` (or better); throws if the blockhash
 * validity window is exceeded without confirmation. Avoids the websocket
 * signatureSubscribe that connection.confirmTransaction relies on.
 */
async function confirmBySignaturePolling(
  connection: Connection,
  signature: string,
  raw: Buffer | Uint8Array,
  lastValidBlockHeight: number,
): Promise<void> {
  const POLL_MS = 2_000;
  for (;;) {
    const { value } = await connection.getSignatureStatuses([signature]);
    const status = value[0];
    if (status) {
      if (status.err) {
        throw new Error(`transaction failed: ${JSON.stringify(status.err)}`);
      }
      if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
        return;
      }
    }
    // Give up once the blockhash can no longer be included (tx will never land).
    const blockHeight = await connection.getBlockHeight('confirmed');
    if (blockHeight > lastValidBlockHeight) {
      throw new Error('transaction expired (blockhash no longer valid)');
    }
    // Rebroadcast to survive transient RPC drops, then wait before re-polling.
    await connection.sendRawTransaction(raw, { skipPreflight: true }).catch(() => undefined);
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

export async function POST(request: Request) {
  const logger = ApiLogger.createRequestLogger('/api/solana/relay', 'POST');

  try {
    const ip = clientIp(request);
    const rl = checkRateLimit(`solana-relay:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many relay requests. Slow down.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    const body = await ApiMiddleware.parseBody<RelayRequest>(request);
    if (!body?.app_id || !body?.network || !body?.transaction) {
      return ApiResponse.badRequest('Missing required fields', {
        required: ['app_id', 'network', 'transaction'],
      });
    }
    if (!isSupportedSolanaNetwork(body.network)) {
      return ApiResponse.badRequest('Unsupported Solana network', { network: body.network });
    }

    const { valid } = await ApiMiddleware.verifyAppId(body.app_id, logger);
    if (!valid) return ApiResponse.unauthorized('Invalid App ID');

    // Deserialize the unsigned tx.
    let tx: Transaction;
    try {
      tx = Transaction.from(Buffer.from(body.transaction, 'base64'));
    } catch {
      return ApiResponse.badRequest('Invalid transaction encoding');
    }

    const signer = await getRelayerSigner(body.network);

    // Fetch the app's Solana program allowlist so the sponsor gate can permit
    // the CPI targets this app configured (e.g. Jupiter). Falls back to the
    // always-safe set when unset. This is the anti-abuse control for arbitrary
    // execute: it bounds what an app_id holder can have Cavos bank.
    const allowedPrograms = await resolveSolanaProgramAllowlist(body.app_id);

    // Security gate: only co-sign the Cavos device-account flow with the relayer
    // as fee payer. Rejects anything that could move the relayer's lamports, and
    // restricts `execute` CPIs to the app's allowlist (+ the safe set).
    const check = validateSponsoredTransaction(tx, signer.publicKey, allowedPrograms);
    if (!check.ok) {
      logger.warn('Relay rejected', { reason: check.reason, app_id: body.app_id });
      return ApiResponse.badRequest('Transaction not eligible for sponsorship', {
        reason: check.reason,
      });
    }

    // ── Gas gate (mainnet only) ──────────────────────────────────────────────
    // Devnet is FREE — Cavos sponsors all testnet transactions, no balance
    // required (mirrors the Starknet sepolia free pool). Only mainnet is metered
    // against the org's prepaid SOL balance.
    const metered = body.network === 'solana-mainnet';
    const orgId = metered ? await resolveOrgForApp(body.app_id) : null;
    if (orgId) {
      const allowed = await hasGas(orgId);
      if (!allowed) {
        if (shouldBlockGas(allowed)) {
          logger.warn('Relay blocked — org out of gas', { app_id: body.app_id, org_id: orgId });
          return ApiResponse.paymentRequired('insufficient_gas', {
            message: 'Deposit SOL to sponsor transactions.',
          });
        }
        logger.warn('Relay sponsored over empty gas (warn mode)', { app_id: body.app_id, org_id: orgId });
      }
    }

    const connection = connectionFor(body.network);
    // Set a fresh blockhash and sign as fee payer (the only required signature —
    // device-account ixs are authorized by the precompile, not Solana signers).
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = signer.publicKey;
    await signer.signTransaction(tx);

    const raw = tx.serialize();
    const signature = await connection.sendRawTransaction(raw, {
      skipPreflight: false,
    });
    // Confirm by POLLING getSignatureStatuses over HTTP rather than
    // connection.confirmTransaction, which opens a websocket signatureSubscribe.
    // Public RPCs (and serverless runtimes) drop that websocket, so the
    // subscription-based confirm silently waits out the blockhash window (~60s)
    // and throws even though the tx landed. Polling depends only on HTTP and
    // rebroadcasts while we wait, so confirmation lands in a couple of seconds.
    await confirmBySignaturePolling(connection, signature, raw, lastValidBlockHeight);

    // Debit the org by the exact lamports the relayer (fee payer, account index 0)
    // spent on this tx — fee + any rent it funded.
    if (orgId) {
      try {
        const parsed = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });
        const pre = parsed?.meta?.preBalances?.[0];
        const post = parsed?.meta?.postBalances?.[0];
        if (pre != null && post != null && pre > post) {
          await debitSolanaGas(orgId, pre - post);
        }
      } catch (e) {
        logger.warn('Gas debit failed (tx already landed)', { signature });
      }
    }

    logger.info('Relayed Solana tx', { signature, network: body.network, app_id: body.app_id });
    return ApiResponse.success({ signature });
  } catch (error) {
    logger.error('Relay error', error);
    return ApiResponse.serverError('Failed to relay transaction');
  }
}

export async function OPTIONS() {
  return ApiResponse.options();
}
