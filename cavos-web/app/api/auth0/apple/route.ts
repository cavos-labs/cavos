import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const finalRedirectUri = request.nextUrl.searchParams.get('redirect_uri');

    if (!finalRedirectUri) {
      return NextResponse.json(
        { error: 'Missing redirect_uri parameter' },
        { status: 400 }
      );
    }

    // Build callback redirect URI with final_redirect_uri embedded
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUri = `${baseUrl}/api/auth0/apple/callback`;
    const redirectUri = `${callbackUri}?final_redirect_uri=${encodeURIComponent(finalRedirectUri)}`;

    // Build Auth0 authorization URL for Apple OAuth
    const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;

    if (!auth0Domain || !clientId) {
      return NextResponse.json(
        { error: 'Auth0 configuration missing' },
        { status: 500 }
      );
    }

    // Remove protocol if already present in auth0Domain
    const domain = auth0Domain.replace(/^https?:\/\//, '');

    const url = new URL(`https://${domain}/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    // Apple only supports basic scopes
    url.searchParams.set('scope', 'openid profile email offline_access');
    url.searchParams.set('connection', 'apple');

    return NextResponse.json({ url: url.toString() });
  } catch (error: any) {
    console.error('[AUTH0-APPLE] Error:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
