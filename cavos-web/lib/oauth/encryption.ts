import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function encryptionKey(): Buffer {
  const material = process.env.OAUTH_CALLBACK_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!material) throw new Error('OAuth callback encryption is not configured');
  return createHash('sha256').update(material, 'utf8').digest();
}

/**
 * Encrypt a JSON value with AES-256-GCM. The output is
 * `iv.tag.ciphertext`, each part base64url.
 *
 * The key is derived from `OAUTH_CALLBACK_ENCRYPTION_KEY` (falling back to
 * `SUPABASE_SERVICE_ROLE_KEY`). Rotating that material invalidates everything
 * encrypted here: in-flight OAuth callback codes and every stored GitHub OAuth
 * client secret, which integrators would have to re-enter.
 */
export function encryptJson(payload: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
}

/** Decrypt a value produced by {@link encryptJson}. Throws when it is malformed or tampered with. */
export function decryptJson(value: string): unknown {
  const [ivValue, tagValue, ciphertextValue] = value.split('.');
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error('Invalid encrypted payload');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString('utf8'));
}
