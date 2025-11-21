import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { hash, walletAddress, appId, status, network } = body;

        if (!hash || !walletAddress || !appId || !status || !network) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify app exists
        const { data: app, error: appError } = await supabase
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

        // Find wallet ID
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('id')
            .eq('address', walletAddress)
            .eq('network', network)
            .single();

        if (walletError || !wallet) {
            // Optionally auto-register wallet if not found, but for now return error
            // Or just log warning and skip linking? Better to require wallet registration first.
            return NextResponse.json(
                { error: 'Wallet not found' },
                { status: 404 }
            );
        }

        // Insert transaction
        const { data, error } = await supabase
            .from('transactions')
            .upsert(
                {
                    hash,
                    wallet_id: wallet.id,
                    app_id: appId,
                    status,
                    network,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'hash,network' }
            )
            .select()
            .single();

        if (error) {
            console.error('Error recording transaction:', error);
            return NextResponse.json(
                { error: 'Failed to record transaction' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Transaction analytics error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
