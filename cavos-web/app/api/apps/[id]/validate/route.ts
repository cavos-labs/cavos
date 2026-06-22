import { computeAppSalt } from '@/lib/crypto/appSalt';
import { orgUsage, resolveOrgForApp } from '@/lib/billing/limits';
import { NextResponse } from 'next/server';

/**
 * GET /api/apps/[id]/validate
 *
 * Public SDK endpoint. Resolves app_id → org internally (no SDK changes) and
 * reports the org's plan + wallet-count usage. `allowed` is the billing gate.
 *
 * Response (backward-compatible — keeps the legacy fields react reads):
 *   - allowed       — gate result (true if under limit or unlimited plan)
 *   - plan_tier     — 'free' | 'pro' | 'custom'
 *   - current_mau   — ALIAS of wallet_count (legacy react SDKs read this name)
 *   - wallet_count  — wallets under this org, all apps + networks
 *   - wallet_limit  — null = unlimited
 *   - warning       — 'approaching_limit' at ≥80% on a capped plan, else null
 *   - app_salt      — per-app salt for wallet address derivation
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: appId } = await params;
    // network is accepted for backward compat with existing SDK callers; it is
    // not used here because the limit is summed across all networks.
    const url = new URL(request.url);
    void url.searchParams.get('network');

    const orgId = await resolveOrgForApp(appId);
    if (!orgId) {
        return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    const usage = await orgUsage(orgId);

    // Compute per-app salt for wallet address derivation.
    const baseSalt = process.env.CAVOS_BASE_SALT || '0x0';
    const appSalt = computeAppSalt(appId, baseSalt);

    // `allowed` reports the true gate state so SDKs / dashboards can surface an
    // upgrade prompt. The actual 402 block lives in the wallet-creation routes
    // (and respects BILLING_ENFORCE_MODE); validate is read-only.
    const allowed = usage.limit === null || usage.count < usage.limit;

    return NextResponse.json({
        allowed,
        plan_tier: usage.tier,
        current_mau: usage.count,             // legacy alias for wallet_count
        wallet_count: usage.count,
        wallet_limit: usage.limit,
        warning: usage.warning,
        app_salt: appSalt
    });
}
