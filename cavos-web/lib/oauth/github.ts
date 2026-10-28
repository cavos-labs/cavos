import { createAdminClient } from '@/lib/supabase/admin';
import { decryptJson } from '@/lib/oauth/encryption';

export interface GithubCredentials {
  clientId: string;
  clientSecret: string;
}

/** The callback GitHub redirects to; it must match the OAuth app's registered callback URL. */
export function githubCallbackUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/oauth/github/callback`;
}

/** True for a base64url SHA-256 PKCE code challenge (43 characters, unpadded). */
export function isCodeChallenge(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}

/**
 * The GitHub OAuth app to use for an environment: its own, when the integrator
 * configured one, otherwise Cavos's from `GITHUB_CLIENT_ID` and
 * `GITHUB_CLIENT_SECRET`. The identity the enclave issues depends on the client
 * id, so the same GitHub user is a different user under different credentials.
 */
export async function githubCredentials(environmentId: string | null): Promise<GithubCredentials> {
  if (environmentId) {
    const { data, error } = await createAdminClient()
      .from('app_environments')
      .select('github_client_id, github_client_secret_ciphertext')
      .eq('id', environmentId)
      .maybeSingle();
    if (error) throw new Error(`Could not load GitHub credentials: ${error.message}`);
    if (data?.github_client_id && data.github_client_secret_ciphertext) {
      const secret = decryptJson(data.github_client_secret_ciphertext);
      if (typeof secret !== 'string' || !secret) throw new Error('Stored GitHub client secret is invalid');
      return { clientId: data.github_client_id, clientSecret: secret };
    }
  }
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
  }
  return { clientId, clientSecret };
}
