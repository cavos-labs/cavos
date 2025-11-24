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

        // Extract Social ID
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

        const userSocialId = identity.id;

        // Parse Body
        const body = await request.json();
        const { network } = body;

        if (!network) {
            return NextResponse.json(
                { error: 'Missing network' },
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

        // Get Wallet
        const { data, error } = await adminSupabase
            .from('wallets')
            .select('encrypted_pk_blob, address')
            .eq('app_id', appId)
            .eq('user_social_id', userSocialId)
            .eq('network', network)
            .single();

        if (error) {
            // It's okay if wallet doesn't exist yet
            if (error.code === 'PGRST116') { // JSON code for no rows returned
                return NextResponse.json({ found: false }, {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    }
                });
            }

            console.error('Error fetching wallet:', error);
            return NextResponse.json(
                { error: 'Failed to fetch wallet' },
                {
                    status: 500,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    }
                }
            );
        }

        return NextResponse.json({
            found: true,
            encrypted_pk_blob: data.encrypted_pk_blob,
            address: data.address
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });

    } catch (error) {
        console.error('Get wallet error:', error);
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
