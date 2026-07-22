/**
 * Classic-Stellar (`G…`) sponsoring relayer.
 *
 * GET  /api/stellar/relay  → { fee_payer } (the relayer G-account the SDK
 *                                    sets as source / fee payer / reserve sponsor).
 * POST /api/stellar/relay  → validate + co-sign + submit a classic-G
 *                                    account transaction. `kind` selects the gate:
 *                                      - "create":   sponsored account creation
 *                                                    (relayer = source + sponsor);
 *                                      - "fee-bump": a control-signed inner tx
 *                                                    wrapped in a relayer fee-bump.
 *
 * The relayer is a fee payer + reserve sponsor, never a custodian — the control
 * key (envelope-encrypted in the account's own data entries) is the sole signer
 * of value-moving transactions. See lib/stellar/relayer.ts for the two gates.
 */
import { NextResponse } from 'next/server';
import { ApiLogger } from '@/lib/api/logger';
import { ApiResponse } from '@/lib/api/response';
import { ApiMiddleware } from '@/lib/api/middleware';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';
import type { FeeBumpTransaction, Transaction } from '@stellar/stellar-sdk';
import {
  horizonServerFor,
  isSupportedStellarNetwork,
  parseAnyTransaction,
  validateClassicCreate,
  validateClassicFeeBump,
  validateSponsoredData,
} from '@/lib/stellar/relayer';
import { getRelayerSigner } from '@/lib/stellar/signer';
import { resolveOrgForApp } from '@/lib/billing/limits';
import { debitStellarGas, hasGas } from '@/lib/stellar/gas';
import { recordCavosEvent, resolveEnvironment } from '@/lib/operations/events';

type RelayKind = 'create' | 'fee-bump' | 'sponsored-data';

interface ClassicRelayRequest {
  app_id: string;
  network: string;
  environment?: 'development' | 'production';
  kind: RelayKind;
  /** base64 tx envelope: a master-signed create / sponsored-data, or a
   *  control-signed fee-bump. */
  transaction: string;
}

/** GET — expose the relayer source/fee-payer/sponsor G-account. */
export async function GET(request: Request) {
  try {
    const n = new URL(request.url).searchParams.get('network') ?? '';
    if (!isSupportedStellarNetwork(n)) {
      return ApiResponse.badRequest('Unsupported Stellar network', { network: n });
    }
    const signer = await getRelayerSigner(n);
    return ApiResponse.success({ fee_payer: signer.publicKey() });
  } catch (error) {
    console.error('Stellar classic relay GET — fee-payer lookup failed', error);
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

    const body = await ApiMiddleware.parseBody<ClassicRelayRequest>(request);
    if (!body?.app_id || !body?.network || !body?.transaction || !body?.kind) {
      return ApiResponse.badRequest('Missing required fields', {
        required: ['app_id', 'network', 'kind', 'transaction'],
      });
    }
    if (!isSupportedStellarNetwork(body.network)) {
      return ApiResponse.badRequest('Unsupported Stellar network', { network: body.network });
    }
    if (body.kind !== 'create' && body.kind !== 'fee-bump' && body.kind !== 'sponsored-data') {
      return ApiResponse.badRequest('Invalid kind', { kind: body.kind });
    }

    const { valid } = await ApiMiddleware.verifyAppId(body.app_id, logger);
    if (!valid) return ApiResponse.unauthorized('Invalid App ID');
    const environment = await resolveEnvironment(body.app_id, body.environment);
    if (body.environment && !environment) return ApiResponse.badRequest('environment does not belong to app_id');

    const signer = await getRelayerSigner(body.network);

    let tx: Transaction | FeeBumpTransaction;
    try {
      tx = parseAnyTransaction(body.transaction, body.network);
    } catch {
      return ApiResponse.badRequest('Invalid transaction encoding');
    }

    // Security gate — pick the validator for the declared kind. A fee-bump must be
    // a FeeBumpTransaction; create + sponsored-data are plain Transactions.
    const isFeeBump = 'innerTransaction' in tx;
    if (body.kind === 'fee-bump' && !isFeeBump) {
      return ApiResponse.badRequest('kind=fee-bump requires a fee-bump transaction');
    }
    if (body.kind !== 'fee-bump' && isFeeBump) {
      return ApiResponse.badRequest(`kind=${body.kind} requires a plain transaction`);
    }
    const check =
      body.kind === 'create'
        ? validateClassicCreate(tx as Transaction, signer.publicKey())
        : body.kind === 'sponsored-data'
          ? validateSponsoredData(tx as Transaction, signer.publicKey())
          : validateClassicFeeBump(tx as FeeBumpTransaction, signer.publicKey());
    if (!check.ok) {
      logger.warn('Classic relay rejected', { reason: check.reason, app_id: body.app_id, kind: body.kind });
      await recordCavosEvent({ appId: body.app_id, environmentId: environment?.id, eventType: 'relay.rejected', status: 'failed', severity: 'warning', requestId: logger.requestId, network: body.network, errorCode: 'not_eligible', metadata: { reason: check.reason, kind: body.kind } });
      return ApiResponse.badRequest('Transaction not eligible for sponsorship', { reason: check.reason });
    }

    // Gas gate (mainnet only) — testnet is free; mainnet meters the org's prepaid
    // XLM balance and blocks an org that is out of gas.
    const metered = body.network === 'stellar-mainnet';
    const orgId = metered ? await resolveOrgForApp(body.app_id) : null;
    if (orgId && !(await hasGas(orgId))) {
      logger.warn('Classic relay blocked — org out of gas', { app_id: body.app_id, org_id: orgId });
      await recordCavosEvent({ appId: body.app_id, environmentId: environment?.id, eventType: 'sponsorship.rejected', status: 'failed', severity: 'warning', requestId: logger.requestId, network: body.network, errorCode: 'insufficient_gas' });
      return ApiResponse.paymentRequired('insufficient_gas', {
        message: 'Deposit XLM to sponsor transactions.',
      });
    }

    // The control signature (create: master; fee-bump: control key) already
    // authorizes the account ops; the relayer signature only pays fees + sponsors.
    await signer.signTransaction(tx);

    const server = horizonServerFor(body.network);
    let hash: string;
    let feeCharged = 0;
    try {
      const res = await server.submitTransaction(tx);
      hash = res.hash;
      feeCharged = Number((res as { fee_charged?: string | number }).fee_charged ?? 0);
    } catch (e) {
      const codes = (e as { response?: { data?: { extras?: { result_codes?: unknown } } } })?.response?.data
        ?.extras?.result_codes;
      logger.warn('Classic relay submit rejected', { app_id: body.app_id, codes });
      return ApiResponse.badRequest('Transaction rejected by network', {
        detail: codes ? JSON.stringify(codes) : String((e as Error)?.message ?? e),
      });
    }

    if (orgId && feeCharged > 0) {
      try {
        await debitStellarGas(orgId, feeCharged);
      } catch {
        logger.warn('Gas debit failed (tx already landed)', { hash });
      }
    }
    await recordCavosEvent({ appId: body.app_id, environmentId: environment?.id, eventType: 'relay.submitted', status: 'success', requestId: logger.requestId, network: body.network, txReference: hash, metadata: { kind: body.kind } });
    return ApiResponse.success({ hash, request_id: logger.requestId });
  } catch (error) {
    logger.error('Stellar classic relay POST failed', error);
    return ApiResponse.serverError(error instanceof Error ? error.message : 'relay failed');
  }
}
