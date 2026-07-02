/**
 * Stellar sponsoring relayer.
 *
 * GET  /api/stellar/relay   → { fee_payer } (the relayer G-account the SDK sets
 *                             as the transaction source before serializing).
 * POST /api/stellar/relay   → validate + sign the envelope + submit a Cavos
 *                             device-account transaction.
 *
 * The relayer is the tx source + fee payer so the user's silent device key
 * (which holds no XLM) gets a gasless experience. It is a fee payer, NOT a
 * custodian — see lib/stellar/relayer.ts for the security model + allowlist.
 */
import { NextResponse } from 'next/server';
import { ApiLogger } from '@/lib/api/logger';
import { ApiResponse } from '@/lib/api/response';
import { ApiMiddleware } from '@/lib/api/middleware';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';
import { rpc } from '@stellar/stellar-sdk';
import {
  isSupportedStellarNetwork,
  parseTransaction,
  serverFor,
  validateSponsoredTransaction,
} from '@/lib/stellar/relayer';
import { getRelayerSigner } from '@/lib/stellar/signer';
import { resolveOrgForApp } from '@/lib/billing/limits';
import { debitStellarGas, hasGas } from '@/lib/stellar/gas';

interface RelayRequest {
  app_id: string;
  network: string;
  /** base64-encoded Soroban transaction: source = relayer, auth already device-signed. */
  transaction: string;
}

/** GET — expose the relayer source/fee-payer G-account so the SDK can build the tx. */
export async function GET(request: Request) {
  try {
    const n = new URL(request.url).searchParams.get('network') ?? '';
    if (!isSupportedStellarNetwork(n)) {
      return ApiResponse.badRequest('Unsupported Stellar network', { network: n });
    }
    const signer = await getRelayerSigner(n);
    return ApiResponse.success({ fee_payer: signer.publicKey() });
  } catch (error) {
    console.error('Stellar relay GET — fee-payer lookup failed', error);
    return ApiResponse.serverError(
      `relayer not configured: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function POST(request: Request) {
  const logger = ApiLogger.createRequestLogger('/api/stellar/relay', 'POST');

  try {
    const ip = clientIp(request);
    const rl = checkRateLimit(`stellar-relay:${ip}`, 30, 60_000);
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
    if (!isSupportedStellarNetwork(body.network)) {
      return ApiResponse.badRequest('Unsupported Stellar network', { network: body.network });
    }

    const { valid } = await ApiMiddleware.verifyAppId(body.app_id, logger);
    if (!valid) return ApiResponse.unauthorized('Invalid App ID');

    const signer = await getRelayerSigner(body.network);

    // Deserialize the assembled, device-authorized transaction.
    let tx;
    try {
      tx = parseTransaction(body.transaction, body.network);
    } catch {
      return ApiResponse.badRequest('Invalid transaction encoding');
    }

    // Security gate: only sign the Cavos device-account flow with the relayer as
    // source. Rejects anything that could move the relayer's own XLM.
    const check = validateSponsoredTransaction(tx, signer.publicKey(), body.network);
    if (!check.ok) {
      logger.warn('Relay rejected', { reason: check.reason, app_id: body.app_id });
      return ApiResponse.badRequest('Transaction not eligible for sponsorship', {
        reason: check.reason,
      });
    }

    // ── Gas gate (mainnet only) ──────────────────────────────────────────────
    // Testnet is FREE — Cavos sponsors all testnet transactions, no balance
    // required. Only mainnet is metered against the org's prepaid XLM balance,
    // and an org out of gas is always blocked (no soak/warn window).
    const metered = body.network === 'stellar-mainnet';
    const orgId = metered ? await resolveOrgForApp(body.app_id) : null;
    if (orgId && !(await hasGas(orgId))) {
      logger.warn('Relay blocked — org out of gas', { app_id: body.app_id, org_id: orgId });
      return ApiResponse.paymentRequired('insufficient_gas', {
        message: 'Deposit XLM to sponsor transactions.',
      });
    }

    // The device signature inside the Soroban auth entry authorizes the action;
    // the relayer signature only pays the fee. Sign the envelope and submit.
    await signer.signTransaction(tx);
    const server = serverFor(body.network);
    const sent = await server.sendTransaction(tx);
    if (sent.status === 'ERROR') {
      logger.warn('Relay submit rejected', { app_id: body.app_id, err: sent.errorResult });
      return ApiResponse.badRequest('Transaction rejected by network', {
        detail: JSON.stringify(sent.errorResult),
      });
    }

    // Poll to confirmation so the caller gets a settled hash.
    const hash = sent.hash;
    for (let i = 0; i < 30; i++) {
      const got = await server.getTransaction(hash);
      if (got.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        // Debit the org by the exact stroops the relayer paid on this tx.
        if (orgId) {
          try {
            const feeStroops = Number(got.resultXdr.feeCharged().toString());
            await debitStellarGas(orgId, feeStroops);
          } catch {
            logger.warn('Gas debit failed (tx already landed)', { hash });
          }
        }
        return ApiResponse.success({ hash });
      }
      if (got.status === rpc.Api.GetTransactionStatus.FAILED) {
        logger.warn('Relay tx failed on-chain', { app_id: body.app_id, hash });
        return ApiResponse.badRequest('Transaction failed on-chain', { hash });
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    // Submitted but not yet confirmed — return the hash so the client can track it.
    return ApiResponse.success({ hash, pending: true });
  } catch (error) {
    logger.error('Stellar relay POST failed', error);
    return ApiResponse.serverError(
      error instanceof Error ? error.message : 'relay failed',
    );
  }
}
