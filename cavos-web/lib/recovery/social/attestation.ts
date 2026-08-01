import { createRemoteJWKSet, jwtVerify } from 'jose'
import { gcpRecoveryConfig } from './config'
import type { AttestationClaims } from './types'

const GOOGLE_ATTESTATION_ISSUER = 'https://confidentialcomputing.googleapis.com'
const jwks = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/metadata/jwk/signer@confidentialspace-sign.iam.gserviceaccount.com',
  ),
)

export async function verifyWorkloadAttestation(params: {
  token: string
  expectedNonce: string
  expectedInstanceId: string
  expectedInstanceName: string
}): Promise<AttestationClaims> {
  const cfg = gcpRecoveryConfig()
  const { payload } = await jwtVerify(params.token, jwks, {
    issuer: GOOGLE_ATTESTATION_ISSUER,
    audience: cfg.attestationAudience,
    algorithms: ['RS256'],
    clockTolerance: 30,
  })
  const claims = payload as unknown as AttestationClaims
  const nonces = Array.isArray(claims.eat_nonce)
    ? claims.eat_nonce
    : claims.eat_nonce
      ? [claims.eat_nonce]
      : []
  const supports = claims.submods?.confidential_space?.support_attributes || []
  const digest = claims.submods?.container?.image_digest
  const gce = claims.submods?.gce

  if (claims.swname !== 'CONFIDENTIAL_SPACE') throw new Error('attestation software mismatch')
  if (claims.dbgstat !== 'disabled-since-boot') throw new Error('debug Confidential Space image rejected')
  if (!supports.includes('STABLE')) throw new Error('unsupported Confidential Space image')
  if (digest !== cfg.workloadImageDigest) throw new Error('workload image digest mismatch')
  if (gce?.project_number !== cfg.projectNumber) throw new Error('workload project mismatch')
  if (gce?.instance_id !== params.expectedInstanceId) throw new Error('workload instance id mismatch')
  if (gce?.instance_name !== params.expectedInstanceName) {
    throw new Error('workload instance name mismatch')
  }
  if (!claims.google_service_accounts?.includes(cfg.workloadServiceAccount)) {
    throw new Error('workload service account mismatch')
  }
  if (!nonces.includes(params.expectedNonce)) throw new Error('attestation channel nonce mismatch')
  return claims
}
