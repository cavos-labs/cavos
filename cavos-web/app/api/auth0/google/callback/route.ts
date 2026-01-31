import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const finalRedirectUri = request.nextUrl.searchParams.get('final_redirect_uri');

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    if (!finalRedirectUri) {
      return NextResponse.json(
        { error: 'Missing final_redirect_uri parameter' },
        { status: 400 }
      );
    }

    const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!auth0Domain || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Auth0 configuration missing' },
        { status: 500 }
      );
    }

    // Remove protocol if already present in auth0Domain
    const domain = auth0Domain.replace(/^https?:\/\//, '');

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      `https://${domain}/oauth/token`,
      {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${baseUrl}/api/auth0/google/callback?final_redirect_uri=${encodeURIComponent(finalRedirectUri)}`,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const { access_token, refresh_token, id_token, expires_in } = tokenResponse.data;

    // Get user info
    const userInfoResponse = await axios.get(
      `https://${domain}/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const userInfo = userInfoResponse.data;

    // Get Management API token to access user identities with Google tokens
    const managementTokenResponse = await axios.post(
      `https://${domain}/oauth/token`,
      {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const managementToken = managementTokenResponse.data.access_token;

    // Get user's full profile including identities
    const userId = userInfo.sub;
    const userProfileResponse = await axios.get(
      `https://${domain}/api/v2/users/${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${managementToken}`,
        },
      }
    );

    console.log('[AUTH0-GOOGLE-CALLBACK] User profile:', JSON.stringify(userProfileResponse.data, null, 2));

    // Find Google identity
    const googleIdentity = userProfileResponse.data.identities?.find(
      (identity: any) => identity.provider === 'google-oauth2'
    );

    let googleAccessToken = access_token;
    let googleRefreshToken = refresh_token;

    if (googleIdentity?.access_token) {
      googleAccessToken = googleIdentity.access_token;
      googleRefreshToken = googleIdentity.refresh_token || refresh_token;
      console.log('[AUTH0-GOOGLE-CALLBACK] Using Google identity token');
    } else {
      console.warn('[AUTH0-GOOGLE-CALLBACK] No Google access token in identity, using Auth0 token');
    }

    // Prepare response data
    const responseData = {
      access_token: googleAccessToken,
      refresh_token: googleRefreshToken,
      id_token,
      expires_in,
      user: {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
    };

    // Redirect to final URI with auth data
    const redirectUrl = new URL(finalRedirectUri);
    redirectUrl.searchParams.set('auth_data', encodeURIComponent(JSON.stringify(responseData)));

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error('[AUTH0-GOOGLE-CALLBACK] Error:', error);

    // Try to extract more detailed error info
    const errorMessage = error.response?.data?.error_description || error.message;

    return NextResponse.json(
      {
        error: 'Authentication failed',
        details: errorMessage
      },
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
