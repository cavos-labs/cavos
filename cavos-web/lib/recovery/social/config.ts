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

export function gcpRecoveryConfig() {
  const zones = (
    process.env.GCP_RECOVERY_ZONES ||
    process.env.GCP_RECOVERY_ZONE ||
    'us-central1-a,us-central1-b,us-central1-c,us-central1-f'
  )
    .split(',')
    .map((zone) => zone.trim())
    .filter(Boolean)
  return {
    projectId: required('GCP_RECOVERY_PROJECT_ID'),
    projectNumber: required('GCP_RECOVERY_PROJECT_NUMBER'),
    zone: zones[0],
    zones: [...new Set(zones)],
    machineType: process.env.GCP_RECOVERY_MACHINE_TYPE || 'n2d-highcpu-2',
    workloadServiceAccount: required('GCP_RECOVERY_WORKLOAD_SERVICE_ACCOUNT'),
    workloadImage: required('GCP_RECOVERY_WORKLOAD_IMAGE'),
    workloadImageDigest: required('GCP_RECOVERY_WORKLOAD_IMAGE_DIGEST'),
    kmsKeyName: required('GCP_RECOVERY_KMS_KEY_NAME'),
    wifAudience: required('GCP_RECOVERY_WIF_AUDIENCE'),
    attestationAudience: required('GCP_RECOVERY_ATTESTATION_AUDIENCE'),
    controlPlaneUrl:
      process.env.GCP_RECOVERY_CONTROL_PLANE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_URL ||
      'https://cavos.xyz',
  }
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for social recovery`)
  return value
}
