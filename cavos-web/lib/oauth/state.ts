import { createHmac, timingSafeEqual } from 'crypto';

const STATE_MAX_AGE_MS = 10 * 60_000;

function stateSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('OAuth state signing is not configured');
  return secret;
}

function signature(payload: string): Buffer {
  return createHmac('sha256', stateSecret()).update(`v1.${payload}`, 'utf8').digest();
}

export function signOAuthState(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify({ ...payload, issued_at: Date.now() }), 'utf8').toString('base64url');
  return `v1.${encoded}.${signature(encoded).toString('base64url')}`;
}

export function verifyOAuthState<T extends { issued_at?: number }>(
  value: string,
  maxAgeMs = STATE_MAX_AGE_MS,
): T {
  const [version, encoded, suppliedValue] = value.split('.');
  if (version !== 'v1' || !encoded || !suppliedValue) throw new Error('Invalid OAuth state');
  const supplied = Buffer.from(suppliedValue, 'base64url');
  const expected = signature(encoded);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new Error('Invalid OAuth state');
  }
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T;
  if (
    typeof payload.issued_at !== 'number' ||
    payload.issued_at > Date.now() + 30_000 ||
    Date.now() - payload.issued_at > maxAgeMs
  ) throw new Error('Expired OAuth state');
  return payload;
}
