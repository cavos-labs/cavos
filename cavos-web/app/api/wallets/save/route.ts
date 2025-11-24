import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const adminSupabase = createAdminClient();

        // Parse Body
        const body = await request.json();
        const { address, network, encrypted_pk_blob, app_id, user_social_id } = body;

        if (!address || !network || !encrypted_pk_blob || !app_id || !user_social_id) {
            return NextResponse.json(
                { error: 'Missing required body fields' },
                {
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    }
                }
            );
        }

        // Verify App ID exists
        const { data: app, error: appError } = await adminSupabase
            .from('apps')
            .select('id')
            .eq('id', app_id)
            .single();

        if (appError || !app) {
            return NextResponse.json(
                { error: 'Invalid App ID' },
                {
                    status: 401,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    }
                }
            );
        }

        // Upsert Wallet
        const { data, error } = await adminSupabase
            .from('wallets')
            .upsert(
                {
                    app_id: app_id,
                    user_social_id: user_social_id,
                    network,
                    address,
                    encrypted_pk_blob,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'app_id,user_social_id,network',
                    ignoreDuplicates: false
                }
            )
            .select()
            .single();

        if (error) {
            console.error('Error saving wallet:', error);
            return NextResponse.json(
                { error: 'Failed to save wallet' },
                {
                    status: 500,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    }
                }
            );
        }

        return NextResponse.json({ success: true, data }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });

    } catch (error) {
        console.error('Save wallet error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                }
            }
        );
    }
}

export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-app-id',
        },
    });
}
