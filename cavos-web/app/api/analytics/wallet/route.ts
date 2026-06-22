import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';
import { canCreateWallet, resolveOrgForApp } from '@/lib/billing/limits';
import { shouldBlock } from '@/lib/billing/enforce';

/**
 * POST /api/analytics/wallet  (used by the frozen @cavos/react SDK)
 *
 * This route upserts the wallet row on the react conflict key `(address, network)`,
 * then historically called the `increment_mau` RPC. That RPC and the tables it fed
 * (app_usage_metrics / active_wallets / usage_metrics) are dead and dropped in
 * Phase E — so the call is removed here and the org's usage is now just
 * `SELECT COUNT(*) FROM wallets` for its apps (see lib/billing/limits.ts).
 *
 * The billing gate is applied identically to /api/wallets so the react route
 * can't be used to bypass the free-tier limit. Resolves app_id → org internally;
 * no SDK change to @cavos/react.
 */
export async function POST(request: Request) {
    try {
        // IP rate-limit (best-effort, per-process) — same cap as /api/wallets,
        // applied identically here so the react route can't be used to bypass.
        const ip = clientIp(request);
        const rl = checkRateLimit(`wallet-create:${ip}`, 20, 60_000);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'rate_limited', message: 'Too many wallet requests. Slow down.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
            );
        }

        const adminSupabase = createAdminClient();
        const body = await request.json();
        const { address, appId, network } = body;

        if (!address || !appId || !network) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify app exists using admin client to bypass RLS
        const { data: app, error: appError } = await adminSupabase
            .from('apps')
            .select('id')
            .eq('id', appId)
            .single();

        if (appError || !app) {
            return NextResponse.json(
                { error: 'Invalid App ID' },
                { status: 401 }
            );
        }

        // ── Billing gate ────────────────────────────────────────────────────
        // Only creation of NEW wallets is gated. Pre-check existence by the
        // react conflict key `(address, network, app_id)` so re-upserts of an
        // existing wallet (the common react case — it upserts on every login)
        // are never blocked.
        const { data: existingWallet } = await adminSupabase
            .from('wallets')
            .select('id')
            .eq('address', address)
            .eq('network', network)
            .eq('app_id', appId)
            .limit(1)
            .maybeSingle();

        if (!existingWallet) {
            const orgId = await resolveOrgForApp(appId);
            if (orgId) {
                const gate = await canCreateWallet(orgId);
                if (!gate.allowed) {
                    const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/billing`;
                    if (shouldBlock(gate.allowed)) {
                        return NextResponse.json(
                            {
                                error: 'wallet_limit_reached',
                                count: gate.count,
                                limit: gate.limit,
                                upgrade_url: upgradeUrl,
                            },
                            { status: 402 }
                        );
                    }
                    console.warn('[billing] over limit (warn mode, allowing)', {
                        app_id: appId, org_id: orgId, count: gate.count, limit: gate.limit
                    });
                }
            }
        }

        // Insert wallet
        const { data, error } = await adminSupabase
            .from('wallets')
            .upsert(
                {
                    address,
                    app_id: appId,
                    network,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'address,network' }
            )
            .select()
            .single();

        if (error) {
            console.error('Error registering wallet:', error);
            return NextResponse.json(
                { error: 'Failed to register wallet' },
                { status: 500 }
            );
        }

        // MAU side-effect removed: increment_mau RPC + its dead tables
        // (app_usage_metrics / active_wallets / usage_metrics) are dropped in
        // Phase E. Usage is now COUNT(wallets) for the org's apps.

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Wallet analytics error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
