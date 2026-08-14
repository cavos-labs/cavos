import type { SocialRecoveryProvider } from './types'

export interface ProviderPolicy {
  provider: SocialRecoveryProvider
  issuer: string
  audience: string
  jwks_uri: string
}

/**
 * Build the policy the enclave verifies an id_token against.
 *
 * `audienceOverride` is the app's own OAuth client ID, letting apps that run
 * their own authentication use the token they already hold instead of sending
 * the user through a second sign-in. It must come from the app's stored
 * configuration, never from the request: the value decides whose tokens are
 * accepted, so a compromised frontend must not be able to choose it.
 *
 * Google and Apple sign the token either way, so this widens which client the
 * token was minted for — not who can mint one. The enclave seals this policy at
 * enrolment and enforces the sealed copy on every later recovery, so changing
 * the setting never retroactively opens an already-enrolled wallet.
 */
export function providerPolicy(
  provider: SocialRecoveryProvider,
  audienceOverride?: string | null,
): ProviderPolicy {
  const audience = (value: string) => audienceOverride?.trim() || value

  if (provider === 'google') {
    return {
      provider,
      issuer: 'https://accounts.google.com',
      audience: audience(required('GOOGLE_CLIENT_ID')),
      jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
    }
  }
  if (provider === 'apple') {
    return {
      provider,
      issuer: 'https://appleid.apple.com',
      audience: audience(required('APPLE_CLIENT_ID')),
      jwks_uri: 'https://appleid.apple.com/auth/keys',
    }
  }
  const projectId = required('FIREBASE_PROJECT_ID')
  return {
    provider,
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    jwks_uri:
      'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  }
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for social recovery`)
  return value
}
