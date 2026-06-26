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
import { Transaction } from '@solana/web3.js';
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
    // Surface the real cause (missing TURNKEY_* env, bad address, import failure)
    // — this only reveals config errors, never secrets.
    console.error('Solana relay GET — fee-payer lookup failed', error);
    return ApiResponse.serverError(
      `relayer not configured: ${error instanceof Error ? error.message : String(error)}`,
    );
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

    // Security gate: only co-sign the Cavos device-account flow with the relayer
    // as fee payer. Rejects anything that could move the relayer's lamports.
    const check = validateSponsoredTransaction(tx, signer.publicKey);
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

    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
    });
    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed',
    );

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
