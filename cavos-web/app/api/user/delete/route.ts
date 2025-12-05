import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import axios from 'axios';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
    });
}

export async function DELETE(request: Request) {
    try {
        // 1. Get and validate the Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, {
                status: 401,
                headers: corsHeaders,
            });
        }

        // 2. Parse request body to get app_id and network
        const body = await request.json();
        const { app_id, network } = body;

        if (!app_id) {
            return NextResponse.json({ error: 'Missing app_id in request body' }, {
                status: 400,
                headers: corsHeaders,
            });
        }

        if (!network) {
            return NextResponse.json({ error: 'Missing network in request body' }, {
                status: 400,
                headers: corsHeaders,
            });
        }

        const accessToken = authHeader.replace('Bearer ', '');
        const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;

        if (!auth0Domain) {
            console.error('Missing NEXT_PUBLIC_AUTH0_DOMAIN env var');
            return NextResponse.json({ error: 'Server configuration error' }, {
                status: 500,
                headers: corsHeaders,
            });
        }

        // Clean domain (remove protocol)
        const domain = auth0Domain.replace(/^https?:\/\//, '');

        // 3. Verify token and get User ID by calling Auth0 /userinfo
        // This ensures the token is valid and belongs to the user
        let userId: string;
        try {
            const userInfoResponse = await axios.get(`https://${domain}/userinfo`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            userId = userInfoResponse.data.sub;
        } catch (error) {
            console.error('Failed to validate token with Auth0:', error);
            return NextResponse.json({ error: 'Invalid or expired token' }, {
                status: 401,
                headers: corsHeaders,
            });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Could not retrieve user ID' }, {
                status: 401,
                headers: corsHeaders,
            });
        }

        // 4. Delete Wallet from Supabase
        // Delete only the wallet for this specific app, user, and network
        const supabase = createAdminClient();

        const { error: supabaseError } = await supabase
            .from('wallets')
            .delete()
            .eq('app_id', app_id)
            .eq('user_social_id', userId)
            .eq('network', network);

        if (supabaseError) {
            console.error('Failed to delete wallet from Supabase:', supabaseError);
            return NextResponse.json({ error: 'Failed to delete wallet' }, {
                status: 500,
                headers: corsHeaders,
            });
        }

        return NextResponse.json({ message: 'Wallet deleted successfully' }, {
            headers: corsHeaders,
        });

    } catch (error) {
        console.error('Unexpected error in delete account route:', error);
        return NextResponse.json({ error: 'Internal server error' }, {
            status: 500,
            headers: corsHeaders,
        });
    }
}
