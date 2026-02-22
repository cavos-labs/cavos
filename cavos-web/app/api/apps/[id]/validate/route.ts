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

    // Get current billing period
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodStart = startOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get current usage (for analytics tracking)
    const { data: usage } = await supabase
        .from('usage_metrics')
        .select('total_mau')
        .eq('user_id', ownerId)
        .eq('period_start', periodStart)
        .single();

    const currentMAU = usage?.total_mau || 0;

    // Compute per-app salt for wallet address derivation
    const baseSalt = process.env.CAVOS_BASE_SALT || '0x0';
    const appSalt = computeAppSalt(appId, baseSalt);

    return NextResponse.json({
        allowed: true,
        plan_tier: planTier,
        current_mau: currentMAU,
        app_salt: appSalt
    });
}
