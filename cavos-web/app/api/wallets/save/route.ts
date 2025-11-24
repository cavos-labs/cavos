import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const adminSupabase = createAdminClient();

        // Get headers
        const appId = request.headers.get('x-app-id');
        const authHeader = request.headers.get('authorization');

        if (!appId || !authHeader) {
            return NextResponse.json(
                { error: 'Missing required headers' },
                {
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    }
                }
            );
        }

        // Validate Auth Token
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                {
                    status: 401,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    }
                }
            );
        }

        // Extract Social ID from identities
        // We look for the first identity that is NOT email (unless email is the only one)
        // Ideally we want 'google' or 'apple'
        const identity = user.identities?.find(id => id.provider === 'google' || id.provider === 'apple')
            || user.identities?.[0];

        if (!identity) {
            return NextResponse.json(
                { error: 'No valid identity found' },
                {
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    }
                }
            );
        }

        const userSocialId = identity.id; // This is the 'sub' from the provider

        // Parse Body
        const body = await request.json();
        const { address, network, encrypted_pk_blob } = body;

        if (!address || !network || !encrypted_pk_blob) {
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
            .eq('id', appId)
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
                    app_id: appId,
                    user_social_id: userSocialId,
                    network,
                    address,
                    encrypted_pk_blob,
                    email: user.email, // Optional, for reference
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
