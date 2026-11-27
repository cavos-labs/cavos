/**
 * The identity provider of an app that signs its users in itself (Clerk,
 * Auth0, Firebase, its own backend). The app registers the provider per
 * environment; the vault and the wallet registry then accept its tokens for
 * that environment, with `sub` as the user id.
 */
import { isIP } from 'node:net';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier';
import { verifyUserToken, type VerifiedUser } from '@/lib/api/verifyUserToken';

export interface ExternalIdentity {
    issuer: string;
    jwksUrl: string;
    /** The `aud` a token must carry. Undefined accepts any audience from the issuer. */
    audience?: string;
}

/** Issuers Cavos signs users in with. An app cannot register one as its own: their tokens answer a Cavos login. */
const RESERVED_ISSUERS = [
    'https://accounts.google.com',
    'accounts.google.com',
    'https://appleid.apple.com',
    'https://cavos.app/firebase',
];
const RESERVED_ISSUER_PREFIX = 'https://enclave.cavos.xyz';

const MAX_FIELD_LENGTH = 255;
const MAX_URL_LENGTH = 2048;

type Parsed = { ok: true; identity: ExternalIdentity | null } | { ok: false; error: string };

/**
 * Read the identity provider an app owner submitted. All fields empty clears
 * it. The keys URL is fetched by Cavos servers, so it has to be a public HTTPS
 * address.
 */
export function parseExternalIdentity(input: {
    issuer?: unknown;
    jwksUrl?: unknown;
    audience?: unknown;
}): Parsed {
    const issuer = trimmed(input.issuer);
    const jwksUrl = trimmed(input.jwksUrl);
    const audience = trimmed(input.audience);
    if (issuer === null || jwksUrl === null || audience === null) {
        return { ok: false, error: 'Identity provider fields must be text' };
    }
    if (!issuer && !jwksUrl && !audience) return { ok: true, identity: null };
    if (!issuer || !jwksUrl) return { ok: false, error: 'An identity provider needs both an issuer and a keys URL' };
    if (issuer.length > MAX_FIELD_LENGTH || audience.length > MAX_FIELD_LENGTH || jwksUrl.length > MAX_URL_LENGTH) {
        return { ok: false, error: 'An identity provider field is too long' };
    }
    if (RESERVED_ISSUERS.includes(issuer) || issuer.startsWith(RESERVED_ISSUER_PREFIX)) {
        return { ok: false, error: 'This issuer is one Cavos signs users in with and cannot be registered as your own' };
    }
    if (!isPublicHttpsUrl(jwksUrl)) {
        return { ok: false, error: 'The keys URL must be a public https:// address' };
    }
    return { ok: true, identity: { issuer, jwksUrl, ...(audience ? { audience } : {}) } };
}

/** The identity provider registered for an environment, or null when Cavos signs its users in. */
export async function externalIdentityOf(environmentId: string): Promise<ExternalIdentity | null> {
    const { data } = await createAdminClient()
        .from('app_environments')
        .select('identity_issuer,identity_jwks_url,identity_audience')
        .eq('id', environmentId)
        .maybeSingle();
    if (!data?.identity_issuer || !data.identity_jwks_url) return null;
    return {
        issuer: data.identity_issuer,
        jwksUrl: data.identity_jwks_url,
        ...(data.identity_audience ? { audience: data.identity_audience } : {}),
    };
}

/** The same, for the app identifier and environment hint an SDK request carries. */
export async function externalIdentityForApp(
    appIdentifier: string,
    environmentHint?: string | null,
): Promise<ExternalIdentity | null> {
    const resolved = await resolveAppIdentifier(appIdentifier, environmentHint);
    return resolved?.environmentId ? externalIdentityOf(resolved.environmentId) : null;
}

/**
 * Verify the caller's token for a request that names an app: one from a Cavos
 * login, or one from the identity provider that app registered.
 */
export function verifyTokenForApp(
    request: Request,
    appIdentifier: string,
    environmentHint?: string | null,
): Promise<VerifiedUser | null> {
    return verifyUserToken(request, undefined, () => externalIdentityForApp(appIdentifier, environmentHint));
}

const KEYS_TIMEOUT_MS = 5_000;
const KEYS_MAX_BYTES = 64 * 1024;

/**
 * Fetch a provider's published keys for the vault. Redirects are refused, so
 * the address checked when it was registered is the one that is read.
 */
export async function fetchExternalKeys(jwksUrl: string): Promise<{ keys: unknown[] }> {
    if (!isPublicHttpsUrl(jwksUrl)) throw new Error('identity keys URL is not a public https address');
    const response = await fetch(jwksUrl, {
        redirect: 'error',
        signal: AbortSignal.timeout(KEYS_TIMEOUT_MS),
        headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`identity keys answered ${response.status}`);
    const text = await response.text();
    if (text.length > KEYS_MAX_BYTES) throw new Error('identity keys are too large');
    const body = JSON.parse(text) as { keys?: unknown };
    if (!Array.isArray(body.keys)) throw new Error('identity keys are malformed');
    return { keys: body.keys };
}

export function isPublicHttpsUrl(value: string): boolean {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return false;
    }
    const host = url.hostname.replace(/^\[|\]$/g, '');
    return (
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        isIP(host) === 0 &&
        host.includes('.') &&
        !host.endsWith('.local') &&
        !host.endsWith('.internal') &&
        !host.endsWith('.localhost')
    );
}

/** A trimmed string, '' for absent, or null when the value is not text. */
function trimmed(value: unknown): string | null {
    if (value === undefined || value === null) return '';
    return typeof value === 'string' ? value.trim() : null;
}
