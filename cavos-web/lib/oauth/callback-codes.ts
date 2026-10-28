import { createHash, randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptJson, encryptJson } from '@/lib/oauth/encryption';

const CALLBACK_CODE_TTL_MS = 2 * 60_000;

function hashCode(code: string): string {
  return createHash('sha256').update(code, 'utf8').digest('hex');
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
    payload_ciphertext: encryptJson(input.payload),
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
  return data?.payload_ciphertext ? decryptJson(data.payload_ciphertext) : null;
}
