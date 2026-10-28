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
import { nonceNamesApp } from '../oauth/loginNonce';

type Issuer = {
    jwksUrl: string;
    /** Expected `aud`. Undefined = accept any (issuer alone identifies us). */
    audience: () => string | undefined;
    /**
     * Every app shares this issuer's audience, so `aud` cannot tell their
     * tokens apart; the nonce names the app instead (lib/oauth/loginNonce).
     */
    appInNonce?: true;
};

const ISSUERS: Record<string, Issuer> = {
    'https://accounts.google.com': {
        jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
        audience: () => process.env.GOOGLE_CLIENT_ID,
        appInNonce: true,
    },
    'https://appleid.apple.com': {
        jwksUrl: 'https://appleid.apple.com/auth/keys',
        audience: () => process.env.APPLE_CLIENT_ID,
        appInNonce: true,
    },
    'https://enclave.cavos.xyz': {
        jwksUrl: 'https://enclave.cavos.xyz/.well-known/jwks.json',
        audience: () => 'cavos-email',
        appInNonce: true,
    },
    'https://enclave.cavos.xyz/github': {
        jwksUrl: 'https://enclave.cavos.xyz/.well-known/jwks.json',
        audience: () => 'cavos-github',
        appInNonce: true,
    },
    /** Cavos-signed JWT for password logins (see lib/firebase-jwt.ts). */
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

/** A caller whose provider token verified. */
export interface VerifiedUser {
    sub: string;
    /**
     * Whether this token was issued to a login `appId` started. Google, Apple
     * and enclave email and GitHub tokens name the app in their nonce; password tokens
     * carry none and are not checked here.
     */
    issuedTo(appId: string): boolean;
}

/**
 * Verify the caller's provider token. Returns who it identifies, or null when
 * the token is absent, from an unknown issuer, expired, or otherwise invalid.
 *
 * `resolveKeys` is injectable so tests can sign with a local key.
 */
export async function verifyUserToken(
    request: Request,
    resolveKeys: (url: string) => jose.JWTVerifyGetKey = keySet,
): Promise<VerifiedUser | null> {
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
        if (typeof payload.sub !== 'string' || !payload.sub) return null;
        const { nonce } = payload;
        return {
            sub: payload.sub,
            issuedTo: (appId) => !config.appInNonce || nonceNamesApp(nonce, appId),
        };
    } catch {
        return null;
    }
}

/**
 * True when the token identifies exactly the user the request claims, and was
 * issued to this app. The audience is shared by every app, so the nonce is what
 * names the one that asked.
 */
export function isUserOfApp(user: VerifiedUser | null, userSocialId: unknown, appId: string): boolean {
    return !!user && typeof userSocialId === 'string' && user.sub === userSocialId && user.issuedTo(appId);
}
