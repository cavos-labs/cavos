import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

const CALLBACK_CODE_TTL_MS = 2 * 60_000;

function encryptionKey(): Buffer {
  const material = process.env.OAUTH_CALLBACK_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!material) throw new Error('OAuth callback encryption is not configured');
  return createHash('sha256').update(material, 'utf8').digest();
}

function hashCode(code: string): string {
  return createHash('sha256').update(code, 'utf8').digest('hex');
}

function encryptPayload(payload: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
}

function decryptPayload(value: string): unknown {
  const [ivValue, tagValue, ciphertextValue] = value.split('.');
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error('Invalid callback payload');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString('utf8'));
}

export async function issueOAuthCallbackCode(input: {
  appId: string;
  redirectUri: string;
  payload: unknown;
}): Promise<string> {
  const code = randomBytes(32).toString('base64url');
  const now = new Date();
  const admin = createAdminClient();
  const { error } = await admin.from('oauth_callback_codes').insert({
    code_hash: hashCode(code),
    app_id: input.appId,
    redirect_uri: input.redirectUri,
    payload_ciphertext: encryptPayload(input.payload),
    expires_at: new Date(now.getTime() + CALLBACK_CODE_TTL_MS).toISOString(),
  });
  if (error) throw new Error(`Could not issue OAuth callback code: ${error.message}`);
  return code;
}

export async function consumeOAuthCallbackCode(input: {
  code: string;
  appId: string;
  redirectUri: string;
}): Promise<unknown | null> {
  const { data, error } = await createAdminClient()
    .from('oauth_callback_codes')
    .delete()
    .eq('code_hash', hashCode(input.code))
    .eq('app_id', input.appId)
    .eq('redirect_uri', input.redirectUri)
    .gt('expires_at', new Date().toISOString())
    .select('payload_ciphertext')
    .maybeSingle();
  if (error) throw new Error(`Could not consume OAuth callback code: ${error.message}`);
  return data?.payload_ciphertext ? decryptPayload(data.payload_ciphertext) : null;
}
