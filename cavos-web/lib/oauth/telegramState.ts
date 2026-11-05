import { createHash, timingSafeEqual } from 'crypto';
import { oauthStateMac } from '@/lib/oauth/state';

/**
 * The `state` of a Telegram sign-in.
 *
 * Telegram refuses a `state` longer than 256 characters ("state too long"),
 * and the JSON state the other providers use carries the full redirect URI.
 * This one is fixed-size binary: app id, environment id, a digest of the
 * redirect URI and the issue time, HMAC-signed under the OAuth state secret.
 * The URI itself is recovered at the callback from the app's registered
 * callbacks, which the redirect had to match exactly to start the login.
 */

const VERSION = 't1';
const LABEL = 'telegram-state-v1';
const MAX_AGE_MS = 10 * 60_000;
const CLOCK_SKEW_MS = 30_000;
const BODY_BYTES = 16 + 16 + 16 + 8;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface TelegramState {
  appId: string;
  environmentId: string | null;
  redirectDigest: Buffer;
}

function uuidBytes(value: string): Buffer {
  if (!UUID.test(value)) throw new Error('Telegram state ids must be UUIDs');
  return Buffer.from(value.replace(/-/g, ''), 'hex');
}

function uuidString(bytes: Buffer): string {
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** The first 16 bytes of SHA-256 over a redirect URI. */
export function redirectDigest(redirectUri: string): Buffer {
  return createHash('sha256').update(redirectUri, 'utf8').digest().subarray(0, 16);
}

export function signTelegramState(
  input: { appId: string; environmentId: string | null; redirectUri: string },
  now = Date.now(),
): string {
  const issuedAt = Buffer.alloc(8);
  issuedAt.writeBigUInt64BE(BigInt(now));
  const body = Buffer.concat([
    uuidBytes(input.appId),
    input.environmentId ? uuidBytes(input.environmentId) : Buffer.alloc(16),
    redirectDigest(input.redirectUri),
    issuedAt,
  ]).toString('base64url');
  return `${VERSION}.${body}.${oauthStateMac(LABEL, body).toString('base64url')}`;
}

/** Verify a state from `signTelegramState` and return what it binds. Throws if it is forged, malformed or stale. */
export function openTelegramState(state: string, now = Date.now()): TelegramState {
  const parts = state.split('.');
  if (parts.length !== 3 || parts[0] !== VERSION || !parts[1] || !parts[2]) {
    throw new Error('Invalid Telegram state');
  }
  const [, body, mac] = parts;
  const supplied = Buffer.from(mac, 'base64url');
  const expected = oauthStateMac(LABEL, body);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new Error('Invalid Telegram state');
  }
  const raw = Buffer.from(body, 'base64url');
  if (raw.length !== BODY_BYTES) throw new Error('Invalid Telegram state');
  const issuedAt = Number(raw.readBigUInt64BE(48));
  if (issuedAt > now + CLOCK_SKEW_MS || now - issuedAt > MAX_AGE_MS) {
    throw new Error('Expired Telegram state');
  }
  const environment = raw.subarray(16, 32);
  return {
    appId: uuidString(raw.subarray(0, 16)),
    environmentId: environment.every((byte) => byte === 0) ? null : uuidString(environment),
    redirectDigest: Buffer.from(raw.subarray(32, 48)),
  };
}

/** The registered callback whose digest the state carries, or null when none matches. */
export function registeredRedirect(callbackUrls: string[], digest: Buffer): string | null {
  return callbackUrls.find((url) => timingSafeEqual(redirectDigest(url), digest)) ?? null;
}
