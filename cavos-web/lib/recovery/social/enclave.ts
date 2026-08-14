/**
 * The control plane's client for the recovery enclave.
 *
 * This replaces `google-compute.ts` and `pool.ts` — roughly 490 lines that
 * existed only to boot a Confidential Space VM per session, hedge that boot
 * across four zones, and reap the losers. A long-lived Nitro enclave needs none
 * of it: there is one always-warm service, and talking to it is an HTTP call.
 *
 * The relay this posts to is untrusted, and so is this control plane. Neither
 * can read a user's credential (encrypted in the browser to the enclave's
 * attested key) nor fake an enclave (the browser verifies the attestation
 * document against measurements pinned inside `@cavos/kit`). What this file
 * must get right is availability and abuse control, not confidentiality.
 */

const REQUEST_TIMEOUT_MS = 15_000

export interface OpenedSession {
  /** Uncompressed SEC1 P-256 channel key, relayed for convenience. */
  ephemeral_public_key_b64: string
  /**
   * COSE_Sign1 attestation document. The browser takes the channel key from
   * *inside* this document, not from the field above, so a tampered relay
   * cannot substitute a key it controls.
   */
  attestation_document_b64: string
}

export interface EncryptedJob {
  client_public_key_b64: string
  nonce_b64: string
  ciphertext_b64: string
}

export class EnclaveError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'EnclaveError'
  }
}

function config() {
  const baseUrl = process.env.CAVOS_RECOVERY_ENCLAVE_URL
  const sharedSecret = process.env.CAVOS_RECOVERY_RELAY_SECRET
  if (!baseUrl || !sharedSecret) {
    throw new Error(
      'CAVOS_RECOVERY_ENCLAVE_URL and CAVOS_RECOVERY_RELAY_SECRET are required for social recovery',
    )
  }
  return { baseUrl, sharedSecret }
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const { baseUrl, sharedSecret } = config()
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-cavos-relay-key': sharedSecret,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new EnclaveError(
      `enclave ${path} responded ${response.status}`,
      response.status,
    )
  }

  const result = (await response.json()) as { response?: string; code?: string } & T
  // The enclave answers with a tagged union. An `error` variant is a refusal it
  // decided on — a bad credential, an expired session — and is deliberately
  // coarse so the relay learns nothing from it.
  if (result.response === 'error') {
    throw new EnclaveError(`enclave refused the request: ${result.code ?? 'unknown'}`, 422)
  }
  return result
}

/**
 * Liveness check: is the enclave up and answering?
 *
 * The relay's `/health` reaches through to the enclave rather than reporting on
 * itself, so a wedged enclave behind a healthy relay still fails this.
 */
export async function pingEnclave(): Promise<void> {
  const { baseUrl, sharedSecret } = config()
  const response = await fetch(new URL('/health', baseUrl), {
    headers: { 'x-cavos-relay-key': sharedSecret },
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new EnclaveError(`enclave health check responded ${response.status}`, response.status)
  }
}

/**
 * Open a channel for `sessionId` and get the enclave's attestation for it.
 *
 * Synchronous: the enclave is already running, so this returns a ready session
 * in one round trip. The old flow returned `202 starting` and left the browser
 * polling for up to two minutes while a VM booted.
 */
export function openSession(sessionId: string): Promise<OpenedSession> {
  return call<OpenedSession>('/sessions', { session_id: sessionId })
}

export interface JobResult {
  result: Record<string, unknown>
}

/** Run one job and return its result, in the same request. */
export function runJob(params: {
  sessionId: string
  job: EncryptedJob
  authChallengeHash: string
}): Promise<JobResult> {
  return call<JobResult>('/jobs', {
    session_id: params.sessionId,
    job: params.job,
    auth_challenge_hash: params.authChallengeHash,
  })
}
