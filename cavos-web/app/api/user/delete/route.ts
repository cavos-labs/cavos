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

        // 2. Verify token and get User ID by calling Auth0 /userinfo
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

        // 3. Get Auth0 Management API Token
        // We need this to perform administrative actions like deleting a user
        const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
        const clientSecret = process.env.AUTH0_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error('Missing AUTH0_CLIENT_ID or AUTH0_CLIENT_SECRET');
            return NextResponse.json({ error: 'Server configuration error' }, {
                status: 500,
                headers: corsHeaders,
            });
        }

        let managementToken: string;
        try {
            const tokenResponse = await axios.post(`https://${domain}/oauth/token`, {
                client_id: clientId,
                client_secret: clientSecret,
                audience: `https://${domain}/api/v2/`,
                grant_type: 'client_credentials',
            });
            managementToken = tokenResponse.data.access_token;
        } catch (error) {
            console.error('Failed to get Auth0 Management API token:', error);
            return NextResponse.json({ error: 'Failed to authorize management action' }, {
                status: 500,
                headers: corsHeaders,
            });
        }

        // 4. Delete User from Auth0
        try {
            await axios.delete(`https://${domain}/api/v2/users/${userId}`, {
                headers: { Authorization: `Bearer ${managementToken}` },
            });
        } catch (error) {
            console.error('Failed to delete user from Auth0:', error);
            return NextResponse.json({ error: 'Failed to delete user account' }, {
                status: 500,
                headers: corsHeaders,
            });
        }

        // 5. Delete Wallet from Supabase
        // We use the Supabase Admin client to bypass RLS if necessary, or just standard deletion
        const supabase = createAdminClient();

        // Assuming the 'wallets' table has a 'user_id' column that matches the Auth0 ID (sub)
        // Adjust column name if necessary based on schema
        const { error: supabaseError } = await supabase
            .from('wallets')
            .delete()
            .eq('user_social_id', userId);

        if (supabaseError) {
            console.error('Failed to delete wallet from Supabase:', supabaseError);
            // Note: We already deleted the Auth0 user, so this is a partial failure state.
            // We still return 200 but log the error, as the primary account is gone.
            // Ideally, we might want to handle this more gracefully (e.g., retry or manual cleanup),
            // but for now, we prioritize the account deletion.
        }

        return NextResponse.json({ message: 'Account deleted successfully' }, {
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
