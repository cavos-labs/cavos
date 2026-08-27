/**
 * End-user token verification for the wallet registry.
 *
 * `wallets` is the source of truth for "this user + app + chain → this address",
 * so reads and writes must be authenticated as the end user, not just by the
 * public `app_id`. The kit already receives a provider `id_token` from the OAuth
 * callback; it sends that token as `Authorization: Bearer …` and we verify it
 * against the issuer's JWKS. `sub` is the `user_social_id` used everywhere else.
 */

import * as jose from 'jose';

type Issuer = {
    jwksUrl: string;
    /** Expected `aud`. Undefined = accept any (issuer alone identifies us). */
    audience: () => string | undefined;
};

const ISSUERS: Record<string, Issuer> = {
    'https://accounts.google.com': {
        jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
        audience: () => process.env.GOOGLE_CLIENT_ID,
    },
    'https://appleid.apple.com': {
        jwksUrl: 'https://appleid.apple.com/auth/keys',
        audience: () => process.env.APPLE_CLIENT_ID,
    },
    // Cavos-signed JWT for email/OTP logins (see lib/firebase-jwt.ts).
    'https://cavos.app/firebase': {
        jwksUrl: 'https://cavos.xyz/.well-known/jwks.json',
        audience: () => 'cavos-starknet',
    },
};

const keySets = new Map<string, ReturnType<typeof jose.createRemoteJWKSet>>();

function keySet(url: string) {
    let set = keySets.get(url);
    if (!set) {
        set = jose.createRemoteJWKSet(new URL(url));
        keySets.set(url, set);
    }
    return set;
}

export function bearerToken(request: Request): string | null {
    const header = request.headers.get('authorization');
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    if (!token || scheme.toLowerCase() !== 'bearer') return null;
    return token.trim();
}

/**
 * Verify the caller's provider token. Returns its `sub`, or null when the token
 * is absent, from an unknown issuer, expired, or otherwise invalid.
 *
 * `resolveKeys` is injectable so tests can sign with a local key.
 */
export async function verifyUserToken(
    request: Request,
    resolveKeys: (url: string) => jose.JWTVerifyGetKey = keySet,
): Promise<string | null> {
    const token = bearerToken(request);
    if (!token) return null;

    let issuer: string | undefined;
    try {
        issuer = jose.decodeJwt(token).iss;
    } catch {
        return null;
    }
    const config = issuer ? ISSUERS[issuer] : undefined;
    if (!config) return null;

    try {
        const { payload } = await jose.jwtVerify(token, resolveKeys(config.jwksUrl), {
            issuer,
            audience: config.audience(),
        });
        return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
    } catch {
        return null;
    }
}

/** True when the token identifies exactly the subject the request claims. */
export function isSubject(sub: string | null, userSocialId: unknown): boolean {
    return !!sub && typeof userSocialId === 'string' && sub === userSocialId;
}
