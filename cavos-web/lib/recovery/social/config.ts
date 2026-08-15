import type { SocialRecoveryProvider } from './types'

export interface ProviderPolicy {
  provider: SocialRecoveryProvider
  issuer: string
  audience: string
  jwks_uri: string
}

/** Per-provider client the environment accepts tokens for. */
export type ProviderAudiences = Partial<Record<SocialRecoveryProvider, string>>

const PROVIDERS: SocialRecoveryProvider[] = ['google', 'apple', 'email']

export function isSocialRecoveryProvider(value: unknown): value is SocialRecoveryProvider {
  return typeof value === 'string' && (PROVIDERS as string[]).includes(value)
}

/**
 * Read the stored overrides, discarding anything that is not a provider name
 * mapped to a non-empty string.
 *
 * The database constrains this column, but it is read on the path that decides
 * whose tokens the enclave will accept, so it is re-checked here rather than
 * trusted. A malformed entry falls back to Cavos's client, which is the closed
 * direction: it accepts fewer tokens, not more.
 */
export function providerAudiences(raw: unknown): ProviderAudiences {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const audiences: ProviderAudiences = {}
  for (const provider of PROVIDERS) {
    const value = (raw as Record<string, unknown>)[provider]
    if (typeof value === 'string' && value.trim()) audiences[provider] = value.trim()
  }
  return audiences
}

/**
 * Build the policy the enclave verifies an id_token against.
 *
 * The provider comes from the credential — an app may offer all three, and a
 * user recovers with the one they signed in with. The *override* must not:
 * it decides whose tokens are accepted, so it comes from the app's stored
 * configuration and never from the request. A compromised frontend can claim to
 * be using Apple, and will then have to produce an Apple token that verifies
 * against the audience the app owner registered; it cannot choose that audience.
 *
 * Declaring the wrong provider gains nothing either way. The enclave binds
 * issuer, audience and subject into the identity commitment, and refuses a
 * recovery whose credential provider differs from the one sealed in the record,
 * so a false claim can only ever act as an identity it can actually prove.
 *
 * The override means different things per provider, which is why it is applied
 * here rather than substituted blindly:
 *
 *   google, apple  the app's own OAuth client id, replacing the audience. The
 *                  issuer is fixed — Google and Apple sign either way, so this
 *                  widens which client a token was minted for, not who can mint.
 *   email          the app's own Firebase project id, which sets the audience
 *                  *and* the issuer, since Firebase issues under a per-project
 *                  URL. Substituting only the audience would build a policy
 *                  that can never verify.
 */
export function providerPolicy(
  provider: SocialRecoveryProvider,
  audiences: ProviderAudiences = {},
): ProviderPolicy {
  const override = audiences[provider]?.trim() || null

  if (provider === 'google') {
    return {
      provider,
      issuer: 'https://accounts.google.com',
      audience: override || required('GOOGLE_CLIENT_ID'),
      jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
    }
  }
  if (provider === 'apple') {
    return {
      provider,
      issuer: 'https://appleid.apple.com',
      audience: override || required('APPLE_CLIENT_ID'),
      jwks_uri: 'https://appleid.apple.com/auth/keys',
    }
  }
  const projectId = override || required('FIREBASE_PROJECT_ID')
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
