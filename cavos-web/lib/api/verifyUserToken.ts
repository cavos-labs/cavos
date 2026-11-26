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
import type { ExternalIdentity } from '../identity/external';
import { nonceNamesApp } from '../oauth/loginNonce';
import { retiredEnclaveUrls } from '../recovery/social/releases';

type Issuer = {
    jwksUrl: string;
    /** Expected `aud`. Undefined = accept any (issuer alone identifies us). */
    audience: () => string | undefined;
    /**
     * Every app shares this issuer's audience, so `aud` cannot tell their
     * tokens apart; the nonce names the app instead (lib/oauth/loginNonce).
     */
    appInNonce?: true;
    /**
     * The enclave signs these with a key of its release, so a user recovering
     * a record an earlier release sealed carries a token only that release's
     * key verifies.
     */
    signedByEnclave?: true;
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
        signedByEnclave: true,
        audience: () => 'cavos-email',
        appInNonce: true,
    },
    'https://enclave.cavos.xyz/github': {
        jwksUrl: 'https://enclave.cavos.xyz/.well-known/jwks.json',
        signedByEnclave: true,
        audience: () => 'cavos-github',
        appInNonce: true,
    },
    'https://enclave.cavos.xyz/telegram': {
        jwksUrl: 'https://enclave.cavos.xyz/.well-known/jwks.json',
        signedByEnclave: true,
        audience: () => 'cavos-telegram',
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

function jwksUrls(issuer: Issuer): string[] {
    if (!issuer.signedByEnclave) return [issuer.jwksUrl];
    const retired = retiredEnclaveUrls().map((url) => new URL('/.well-known/jwks.json', url).href);
    return [issuer.jwksUrl, ...retired];
}

/** Verify against the first key set that holds the token's key. */
async function verifyWithAny(
    token: string,
    urls: string[],
    resolveKeys: (url: string) => jose.JWTVerifyGetKey,
    options: jose.JWTVerifyOptions,
): Promise<jose.JWTVerifyResult> {
    let failure: unknown;
    for (const url of urls) {
        try {
            return await jose.jwtVerify(token, resolveKeys(url), options);
        } catch (error) {
            failure = error;
        }
    }
    throw failure;
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
    /** The token's `iat` in seconds, or null when it carries none. */
    issuedAt: number | null;
    /**
     * Whether this token was issued to a login `appId` started. Google, Apple
     * and enclave email, GitHub and Telegram tokens name the app in their nonce; password tokens
     * carry none and are not checked here.
     */
    issuedTo(appId: string): boolean;
}

/**
 * Verify the caller's provider token. Returns who it identifies, or null when
 * the token is absent, from an unknown issuer, expired, or otherwise invalid.
 *
 * `resolveKeys` is injectable so tests can sign with a local key.
 *
 * `externalIdentity` names the identity provider of an app that signs its
 * users in itself. It is only asked for when the token's issuer is not one
 * Cavos signs in with, so a Cavos login costs no extra lookup.
 */
export async function verifyUserToken(
    request: Request,
    resolveKeys: (url: string) => jose.JWTVerifyGetKey = keySet,
    externalIdentity?: () => Promise<ExternalIdentity | null>,
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
    if (!config) return verifyExternalToken(token, issuer, await externalIdentity?.(), resolveKeys);
    try {
        const { payload } = await verifyWithAny(token, jwksUrls(config), resolveKeys, {
            issuer,
            audience: config.audience(),
        });
        if (typeof payload.sub !== 'string' || !payload.sub) return null;
        const { nonce } = payload;
        return {
            sub: payload.sub,
            issuedAt: typeof payload.iat === 'number' ? payload.iat : null,
            issuedTo: (appId) => !config.appInNonce || nonceNamesApp(nonce, appId),
        };
    } catch {
        return null;
    }
}

/** Verify a token of the identity provider the app registered for itself. */
async function verifyExternalToken(
    token: string,
    issuer: string | undefined,
    identity: ExternalIdentity | null | undefined,
    resolveKeys: (url: string) => jose.JWTVerifyGetKey,
): Promise<VerifiedUser | null> {
    if (!identity || issuer !== identity.issuer) return null;
    try {
        const { payload } = await jose.jwtVerify(token, resolveKeys(identity.jwksUrl), {
            issuer: identity.issuer,
            audience: identity.audience,
            algorithms: ['RS256', 'ES256'],
        });
        if (typeof payload.sub !== 'string' || !payload.sub || typeof payload.exp !== 'number') return null;
        return {
            sub: payload.sub,
            issuedAt: typeof payload.iat === 'number' ? payload.iat : null,
            // The provider was looked up for the app of this request, so its tokens are that app's.
            issuedTo: () => true,
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
