import { createAdminClient } from '@/lib/supabase/admin';
import { computeAppSalt } from '@/lib/crypto/appSalt';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: appId } = await params;
    const url = new URL(request.url);
    const network = url.searchParams.get('network');

    const supabase = createAdminClient();

    // Get app owner via organization
    // Admin client needed because this is called by SDK (public) 
    // and we need to read tables that might have RLS restricting access
    // Actually, validation is a public endpoint for the SDK.
    // Using admin client avoids complex public RLS policies or verified public access.

    const { data: app, error: appError } = await supabase
        .from('apps')
        .select(`
id,
    organization: organizations(
        owner_id
    )
    `)
        .eq('id', appId)
        .single();

    if (appError || !app || !app.organization) {
        return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Type assertion for nested query result
    const ownerId = (app.organization as any).owner_id;

    // Get user's subscription
    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_tier, status')
        .eq('user_id', ownerId)
        .single();

    // Default to developer plan if no sub record found
    const planTier = subscription?.plan_tier || 'developer';

    // Get MAU limits
    const limits: Record<string, number> = {
        developer: 200,
        growth: 3000,
        scale: 16000
    };

    const limit = limits[planTier] || 200;

    // Get current billing period
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodStart = startOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get current usage
    const { data: usage } = await supabase
        .from('usage_metrics')
        .select('total_mau')
        .eq('user_id', ownerId)
        .eq('period_start', periodStart)
        .single();

    const currentMAU = usage?.total_mau || 0;

    // Hard limit enforcement (Mainnet only)
    // Sepolia is unlimited, as per plan
    const isMainnet = network !== 'sepolia' && network !== 'SN_SEPOLIA';

    if (isMainnet && currentMAU >= limit) {
        return NextResponse.json({
            allowed: false,
            reason: 'mau_limit_exceeded',
            message: `MAU limit reached(${currentMAU} / ${limit}).Upgrade at cavos.xyz / pricing`,
            current_mau: currentMAU,
            limit: limit,
            plan_tier: planTier,
            upgrade_url: `${process.env.NEXT_PUBLIC_URL}/pricing`
        }, { status: 403 });
    }

    // Warning thresholds
    let warning = null;
    if (isMainnet) {
        const percentage = (currentMAU / limit) * 100;
        if (percentage >= 80) {
            warning = {
                warning: true,
                message: `You're at ${Math.round(percentage)}% of your ${limit} MAU limit`,
                percentage: percentage
            };
        }
    }

    // Compute per-app salt for wallet address derivation
    const baseSalt = process.env.CAVOS_BASE_SALT || '0x0';
    const appSalt = computeAppSalt(appId, baseSalt);

    return NextResponse.json({
        allowed: true,
        plan_tier: planTier,
        current_mau: currentMAU,
        limit,
        app_salt: appSalt,
        ...(warning && warning)
    });
}
