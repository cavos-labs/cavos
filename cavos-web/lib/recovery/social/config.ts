import type { SocialRecoveryProvider } from './types'

export interface ProviderPolicy {
  provider: SocialRecoveryProvider
  issuer: string
  audience: string
  jwks_uri: string
}

export function providerPolicy(provider: SocialRecoveryProvider): ProviderPolicy {
  if (provider === 'google') {
    return {
      provider,
      issuer: 'https://accounts.google.com',
      audience: required('GOOGLE_CLIENT_ID'),
      jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
    }
  }
  if (provider === 'apple') {
    return {
      provider,
      issuer: 'https://appleid.apple.com',
      audience: required('APPLE_CLIENT_ID'),
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
  return {
    projectId: required('GCP_RECOVERY_PROJECT_ID'),
    projectNumber: required('GCP_RECOVERY_PROJECT_NUMBER'),
    zone: process.env.GCP_RECOVERY_ZONE || 'us-central1-a',
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
