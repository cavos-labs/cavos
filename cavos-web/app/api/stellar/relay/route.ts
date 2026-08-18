/**
 * Classic-Stellar (`G…`) sponsoring relayer.
 *
 * GET  /api/stellar/relay?network=&app_id=  → { fee_payer, sequence }
 *      fee_payer is THAT org's sponsor G-account, not a shared pot.
 * POST /api/stellar/relay  → validate + co-sign + submit. Reserves and fees
 *      debit that org's available balance only.
 *
 * The relayer is a fee payer + reserve sponsor, never a custodian of user
 * funds. See lib/stellar/relayer.ts for the two gates.
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
import { resolveOrgForApp } from '@/lib/billing/limits';
import { debitStellarGas, hasGas, lockStellarReserves } from '@/lib/stellar/gas';
import {
  ensureTestnetFunded,
  getOrgSponsorSigner,
  loadSponsorAccount,
  numSponsoringOf,
} from '@/lib/stellar/sponsor';
import {
  FEE_BUFFER_STROOPS,
  estimateReservedStroops,
  fetchBaseReserveStroops,
  reservedDeltaStroops,
} from '@/lib/stellar/reserves';
import { recordCavosEvent, resolveEnvironment } from '@/lib/operations/events';
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier';

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

/** GET — this org's sponsor G-account + current sequence. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const n = url.searchParams.get('network') ?? '';
    const appIdParam = url.searchParams.get('app_id') ?? '';
    if (!isSupportedStellarNetwork(n)) {
      return ApiResponse.badRequest('Unsupported Stellar network', { network: n });
    }
    if (!appIdParam) {
      return ApiResponse.badRequest('app_id is required', { required: ['app_id', 'network'] });
    }
    const resolvedApp = await resolveAppIdentifier(appIdParam);
    if (!resolvedApp) return ApiResponse.unauthorized('Invalid App ID');
    const orgId = await resolveOrgForApp(resolvedApp.appId);
    if (!orgId) return ApiResponse.unauthorized('Invalid App ID');

    const { signer } = await getOrgSponsorSigner(orgId, n);
    if (n === 'stellar-testnet') {
      try { await ensureTestnetFunded(signer.publicKey()); } catch (e) {
        console.warn('Stellar relay GET — friendbot failed', e);
      }
    }
    let sequence: string | undefined;
    try {
      sequence = (await horizonServerFor(n).loadAccount(signer.publicKey())).sequenceNumber();
    } catch (e) {
      console.warn('Stellar relay GET — sequence lookup failed', e);
    }
    return ApiResponse.success({
      fee_payer: signer.publicKey(),
      ...(sequence ? { sequence } : {}),
    });
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

    // UUID app identifiers are otherwise resolved to their production
    // environment by default. Pass the caller's environment hint so a
    // development relay request is scoped to the matching app environment.
    const resolvedApp = await resolveAppIdentifier(body.app_id, body.environment);
    if (!resolvedApp) return ApiResponse.unauthorized('Invalid App ID');
    const appId = resolvedApp.appId;
    if (
      body.environment &&
      resolvedApp.environmentKind &&
      body.environment !== resolvedApp.environmentKind
    ) {
      return ApiResponse.badRequest('environment does not belong to app_id');
    }
    const environment = resolvedApp.environmentId
      ? {
          id: resolvedApp.environmentId,
          app_id: appId,
          kind: resolvedApp.environmentKind,
        }
      : await resolveEnvironment(appId, body.environment);
    if (body.environment && !environment) return ApiResponse.badRequest('environment does not belong to app_id');

    const orgId = await resolveOrgForApp(appId);
    if (!orgId) return ApiResponse.unauthorized('Invalid App ID');

    const { signer } = await getOrgSponsorSigner(orgId, body.network);
    if (body.network === 'stellar-testnet') {
      try { await ensureTestnetFunded(signer.publicKey()); } catch (e) {
        console.warn('Stellar relay POST — friendbot failed', e);
      }
    }

    let tx: Transaction | FeeBumpTransaction;
    try {
      tx = parseAnyTransaction(body.transaction, body.network);
    } catch {
      return ApiResponse.badRequest('Invalid transaction encoding');
    }

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
      await recordCavosEvent({ appId, environmentId: environment?.id, eventType: 'relay.rejected', status: 'failed', severity: 'warning', requestId: logger.requestId, network: body.network, errorCode: 'not_eligible', metadata: { reason: check.reason, kind: body.kind } });
      return ApiResponse.badRequest('Transaction not eligible for sponsorship', { reason: check.reason });
    }

    const server = horizonServerFor(body.network);
    const metered = body.network === 'stellar-mainnet';
    const baseReserve = await fetchBaseReserveStroops(server);
    const reserveEstimate = estimateReservedStroops(tx, body.kind, baseReserve);

    if (metered) {
      const need = reserveEstimate + FEE_BUFFER_STROOPS;
      if (!(await hasGas(orgId, need))) {
        logger.warn('Classic relay blocked — org out of gas', { app_id: body.app_id, org_id: orgId, need });
        await recordCavosEvent({ appId, environmentId: environment?.id, eventType: 'sponsorship.rejected', status: 'failed', severity: 'warning', requestId: logger.requestId, network: body.network, errorCode: 'insufficient_gas' });
        return ApiResponse.paymentRequired('insufficient_gas', {
          message: 'Deposit XLM to sponsor transactions.',
        });
      }
    }

    const before = await loadSponsorAccount(body.network, signer.publicKey());
    const sponsoringBefore = numSponsoringOf(before);

    await signer.signTransaction(tx);

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

    if (metered) {
      try {
        const after = await loadSponsorAccount(body.network, signer.publicKey());
        const reserved = reservedDeltaStroops(sponsoringBefore, numSponsoringOf(after), baseReserve);
        if (reserved > 0) {
          const locked = await lockStellarReserves(orgId, reserved);
          if (!locked) {
            logger.warn('Reserve lock failed after submit', { hash, reserved, org_id: orgId });
          }
        }
        if (feeCharged > 0) await debitStellarGas(orgId, feeCharged);
      } catch {
        logger.warn('Gas debit failed (tx already landed)', { hash });
      }
    }
    await recordCavosEvent({ appId, environmentId: environment?.id, eventType: 'relay.submitted', status: 'success', requestId: logger.requestId, network: body.network, txReference: hash, metadata: { kind: body.kind } });
    return ApiResponse.success({ hash, request_id: logger.requestId });
  } catch (error) {
    logger.error('Stellar classic relay POST failed', error);
    return ApiResponse.serverError(error instanceof Error ? error.message : 'relay failed');
  }
}
