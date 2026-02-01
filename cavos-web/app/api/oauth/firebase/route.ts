import { NextRequest, NextResponse } from 'next/server';

/**
 * Firebase Auth endpoint for Cavos
 * 
 * Receives a Firebase ID Token, verifies it (optional, contract does it),
 * and returns the auth_data required for SDK session registration.
 */

export async function POST(request: NextRequest) {
    try {
        const { idToken, user: clientUser } = await request.json();

        if (!idToken) {
            return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
        }

        // Basic decoding to extract claims (signature is verified on-chain)
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
        }

        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));

        // Format auth_data to match Cavos SDK expectations (same as Google/Apple)
        const responseData = {
            jwt: idToken,
            claims: {
                iss: payload.iss,
                sub: payload.sub,
                email: payload.email,
                email_verified: payload.email_verified,
                nonce: payload.nonce || '', // Nonce might be optional or managed by client
                iat: payload.iat,
                exp: payload.exp,
            },
            user: {
                id: payload.sub,
                email: payload.email,
                name: payload.name || clientUser?.displayName || '',
                picture: payload.picture || clientUser?.photoURL || '',
            },
            expires_in: payload.exp - payload.iat,
            provider: 'firebase'
        };

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error('[API-OAUTH-FIREBASE] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
