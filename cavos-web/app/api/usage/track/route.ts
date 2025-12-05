import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { app_id, wallet_address, network } = await request.json();

        if (!app_id || !wallet_address) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ignore Sepolia usage for MAU tracking
        if (network === 'sepolia' || network === 'SN_SEPOLIA') {
            return NextResponse.json({ success: true, ignored: true });
        }

        const supabase = createAdminClient();

        // Get app owner
        const { data: app, error: appError } = await supabase
            .from('apps')
            .select(`
        id,
        organization:organizations (
          owner_id
        )
      `)
            .eq('id', app_id)
            .single();

        if (appError || !app || !app.organization) {
            return NextResponse.json({ error: 'App not found' }, { status: 404 });
        }

        const ownerId = (app.organization as any).owner_id;

        // Calculate period start (1st of current month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodStart = startOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD

        // Track usage via RPC
        const { error: rpcError } = await supabase.rpc('increment_mau', {
            p_user_id: ownerId,
            p_app_id: app_id,
            p_period_start: periodStart
        });

        if (rpcError) {
            console.error('Error tracking usage:', rpcError);
            return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Usage tracking API error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
