import { createHash } from 'crypto'

/**
 * Hash the browser-supplied token fingerprint before it touches the database.
 *
 * The raw ID token never leaves the browser-to-enclave encrypted channel; what
 * the control plane stores is a hash of a hash, used only to enforce that one
 * provider credential drives at most one live or successful recovery session.
 *
 * The bearer-token and random-token helpers that used to live here went with
 * the workload registration endpoints: a Confidential Space VM had to
 * authenticate itself back to the control plane over the public internet, which
 * needed minted secrets and constant-time comparison. The enclave now reaches
 * the control plane only through its parent over vsock, and is identified by an
 * attestation document rather than by a shared secret.
 */
export function tokenHash(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}
