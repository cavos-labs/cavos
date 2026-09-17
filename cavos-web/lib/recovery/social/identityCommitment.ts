import { createHash } from 'node:crypto'

/**
 * Same layout as cavos-recovery/enclave/src/crypto.rs `identity_commitment`.
 * Length-prefixed SHA-256 over domain, app, environment, issuer, audience, sub.
 */
export function identityCommitmentHex(
  policy: {
    app_id: string
    environment_id: string
    issuer: string
    audience: string
  },
  subject: string,
): string {
  return `0x${hashFields('cavos-social-id-v1', [
    policy.app_id,
    policy.environment_id,
    policy.issuer,
    policy.audience,
    subject,
  ])}`
}

function hashFields(domain: string, fields: string[]): string {
  const hash = createHash('sha256')
  hash.update(domain)
  for (const field of fields) {
    const bytes = Buffer.from(field, 'utf8')
    const length = Buffer.alloc(4)
    length.writeUInt32BE(bytes.length)
    hash.update(length)
    hash.update(bytes)
  }
  return hash.digest('hex')
}
