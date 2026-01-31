import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const adminSupabase = createAdminClient();
        const body = await request.json();
        const { address, appId, network, email } = body;

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

        // Insert wallet
        const { data, error } = await adminSupabase
            .from('wallets')
            .upsert(
                {
                    address,
                    app_id: appId,
                    email: email || null,
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

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Wallet analytics error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
