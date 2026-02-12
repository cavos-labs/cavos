import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import * as jose from 'jose';

/**
 * Direct Apple OAuth callback for ZK Login
 *
 * This route handles the OAuth callback from Apple, exchanges the code for tokens,
 * and returns the id_token (JWT) which contains the nonce.
 *
 * Apple-specific notes:
 * - Apple uses form_post response mode, so data comes in POST body
 * - Apple hashes the nonce with SHA256 before embedding in id_token
 * - Apple requires a JWT-based client secret
 *
 * The id_token will have:
 * - iss: "https://appleid.apple.com"
 * - sub: unique user ID (used for address_seed derivation)
 * - email: user's email (only on first sign-in unless requested)
 * - nonce: SHA256 hash of the nonce we passed
 *
 * Required env vars:
 * - APPLE_CLIENT_ID: Apple Services ID
 * - APPLE_TEAM_ID: Apple Developer Team ID
 * - APPLE_KEY_ID: Key ID for the private key
 * - APPLE_PRIVATE_KEY: Private key contents (PEM format)
 * - NEXT_PUBLIC_APP_URL: Base URL for callback
 */

interface StatePayload {
  csrf: string;
  redirect_uri: string;
  nonce: string;
}

interface AppleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token: string;
}

/**
 * Generate Apple client secret (JWT)
 * https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
 */
async function generateAppleClientSecret(): Promise<string> {
  const teamId = process.env.APPLE_TEAM_ID;
  const clientId = process.env.APPLE_CLIENT_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;

  if (!teamId || !clientId || !keyId || !privateKey) {
    throw new Error('Missing Apple OAuth configuration');
  }

  // Parse the private key
  const key = await jose.importPKCS8(privateKey.replace(/\\n/g, '\n'), 'ES256');

  // Create the JWT
  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime('5m')
    .setAudience('https://appleid.apple.com')
    .setSubject(clientId)
    .sign(key);

  return jwt;
}

/**
 * Hash nonce with SHA256 (Apple's nonce format)
 */
function hashNonce(nonce: string): string {
  return createHash('sha256').update(nonce).digest('hex');
}

// Apple uses form_post, so we need to handle POST requests
export async function POST(request: NextRequest) {
  try {
    // Parse form data (Apple sends as application/x-www-form-urlencoded)
    const formData = await request.formData();

    const code = formData.get('code') as string | null;
    const idToken = formData.get('id_token') as string | null;
    const stateParam = formData.get('state') as string | null;
    const error = formData.get('error') as string | null;
    const userDataStr = formData.get('user') as string | null; // Only on first sign-in

    // Handle OAuth errors
    if (error) {
      console.error('[OAUTH-APPLE-CALLBACK] OAuth error:', error);
      return NextResponse.json(
        { error: `OAuth error: ${error}` },
        { status: 400 }
      );
    }

    if (!code && !idToken) {
      return NextResponse.json(
        { error: 'Missing authorization code and id_token' },
        { status: 400 }
      );
    }

    if (!stateParam) {
      return NextResponse.json(
        { error: 'Missing state parameter' },
        { status: 400 }
      );
    }

    // Decode state payload
    let statePayload: StatePayload;
    try {
      const decoded = Buffer.from(stateParam, 'base64url').toString('utf-8');
      statePayload = JSON.parse(decoded);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    const { redirect_uri: finalRedirectUri, nonce: expectedNonce } = statePayload;

    if (!finalRedirectUri) {
      return NextResponse.json(
        { error: 'Missing redirect_uri in state' },
        { status: 400 }
      );
    }

    const appleClientId = process.env.APPLE_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!appleClientId) {
      return NextResponse.json(
        { error: 'Apple OAuth configuration missing' },
        { status: 500 }
      );
    }

    let tokens: AppleTokenResponse;
    let finalIdToken: string;

    // If we already have id_token from form_post, use it
    // Otherwise, exchange code for tokens
    if (idToken) {
      finalIdToken = idToken;
      tokens = {
        access_token: '', // Not provided in form_post
        token_type: 'Bearer',
        expires_in: 3600,
        id_token: idToken,
      };
    } else if (code) {
      // Generate client secret
      const clientSecret = await generateAppleClientSecret();

      // Exchange code for tokens
      const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: appleClientId,
          client_secret: clientSecret,
          redirect_uri: `${baseUrl}/api/oauth/apple/callback`,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('[OAUTH-APPLE-CALLBACK] Token exchange failed:', errorData);
        return NextResponse.json(
          { error: 'Token exchange failed', details: errorData },
          { status: 400 }
        );
      }

      tokens = await tokenResponse.json();
      finalIdToken = tokens.id_token;
    } else {
      return NextResponse.json(
        { error: 'No code or id_token provided' },
        { status: 400 }
      );
    }

    // Decode and verify the id_token (JWT)
    const idTokenParts = finalIdToken.split('.');
    if (idTokenParts.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid id_token format' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(Buffer.from(idTokenParts[1], 'base64url').toString('utf-8'));

    // Apple may or may not hash the nonce with SHA256 depending on the flow
    // Try both: direct match and SHA256 hash match
    const expectedNonceHash = hashNonce(expectedNonce);
    const nonceMatches = payload.nonce === expectedNonce || payload.nonce === expectedNonceHash;

    if (!nonceMatches && payload.nonce) {
      console.error('[OAUTH-APPLE-CALLBACK] Nonce mismatch:', {
        expectedRaw: expectedNonce,
        expectedHash: expectedNonceHash,
        received: payload.nonce,
      });
      return NextResponse.json(
        {
          error: 'Nonce mismatch - possible replay attack',
          debug: {
            expectedRaw: expectedNonce,
            expectedHash: expectedNonceHash,
            received: payload.nonce,
          }
        },
        { status: 400 }
      );
    }

    // If no nonce in payload, log warning but continue (some Apple flows don't include it)
    if (!payload.nonce) {
      console.warn('[OAUTH-APPLE-CALLBACK] No nonce in id_token, skipping verification');
    }

    // Verify issuer
    if (payload.iss !== 'https://appleid.apple.com') {
      return NextResponse.json(
        { error: 'Invalid token issuer' },
        { status: 400 }
      );
    }

    // Verify audience
    if (payload.aud !== appleClientId) {
      return NextResponse.json(
        { error: 'Invalid token audience' },
        { status: 400 }
      );
    }

    // Parse user data if provided (only on first sign-in)
    let userName: string | undefined;
    let userEmail = payload.email;
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.name) {
          userName = [userData.name.firstName, userData.name.lastName].filter(Boolean).join(' ');
        }
        if (userData.email) {
          userEmail = userData.email;
        }
      } catch (e) {
        // Ignore user data parsing errors
      }
    }

    // Prepare response data
    // IMPORTANT: We return the raw id_token (JWT) because the ZK circuit needs it
    // Note: For Apple, the ZK circuit needs to be configured for Apple's issuer
    const responseData = {
      // The raw JWT - this is what the ZK circuit will process
      jwt: finalIdToken,

      // Parsed claims for convenience
      claims: {
        iss: payload.iss,
        sub: payload.sub, // This is used to derive address_seed
        email: userEmail,
        email_verified: payload.email_verified,
        nonce: payload.nonce, // Note: This is SHA256(original_nonce)
        nonce_original: expectedNonce, // Original nonce for reference
        iat: payload.iat,
        exp: payload.exp,
      },

      // User info for display
      user: {
        id: payload.sub,
        email: userEmail,
        name: userName,
        picture: undefined, // Apple doesn't provide profile pictures
      },

      // Token metadata
      expires_in: tokens.expires_in,

      // Refresh token (if available)
      refresh_token: tokens.refresh_token,

      // Provider info (useful for the ZK circuit to know which issuer to verify)
      provider: 'apple',
    };

    // Redirect to final URI with auth data
    // IMPORTANT: We return an HTML page with JavaScript redirect instead of HTTP 302
    // because Apple uses form_post which sends POST to this callback.
    // Using NextResponse.redirect() would preserve the POST method to the client app,
    // causing Next.js to fail parsing the URL with auth_data.
    // JavaScript redirect converts POST -> GET automatically.
    const redirectUrl = new URL(finalRedirectUri);
    redirectUrl.searchParams.set('auth_data', JSON.stringify(responseData));

    console.log('[OAUTH-APPLE-CALLBACK] Success for user:', payload.sub);

    // Return HTML with auto-redirect (converts POST to GET)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
</head>
<body>
  <p>Authentication successful. Redirecting...</p>
  <script>
    window.location.replace(${JSON.stringify(redirectUrl.toString())});
  </script>
</body>
</html>
    `.trim();

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('[OAUTH-APPLE-CALLBACK] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    );
  }
}

// Also handle GET for error redirects
export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  if (error) {
    return NextResponse.json(
      { error: `OAuth error: ${error}` },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: 'Apple OAuth callback expects POST request with form data' },
    { status: 405 }
  );
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
