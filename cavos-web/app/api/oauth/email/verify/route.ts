import { NextResponse } from 'next/server'
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit'
import { ApiResponse } from '@/lib/api/response'
import { EnclaveError, runJob } from '@/lib/recovery/social/enclave'

/**
 * Forward the encrypted `verify_email` job and return only the sealed result.
 *
 * The enclave's plaintext result carries the user's token, so it is neither
 * returned nor logged here. Only the client holds the key that opens
 * `sealed_result`.
 */

interface VerifyBody {
  session_id?: unknown
  job?: {
    client_public_key_b64?: unknown
    nonce_b64?: unknown
    ciphertext_b64?: unknown
  }
}

export const maxDuration = 30

export async function POST(request: Request) {
  let body: VerifyBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }
  const job = body.job
  if (
    typeof body.session_id !== 'string' ||
    !body.session_id ||
    typeof job?.client_public_key_b64 !== 'string' ||
    typeof job.nonce_b64 !== 'string' ||
    typeof job.ciphertext_b64 !== 'string' ||
    !job.client_public_key_b64 ||
    !job.nonce_b64 ||
    !job.ciphertext_b64
  ) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }
  if (
    job.client_public_key_b64.length > 256 ||
    job.nonce_b64.length > 32 ||
    job.ciphertext_b64.length > 131072
  ) {
    return NextResponse.json({ error: 'encrypted_job_too_large' }, { status: 413 })
  }

  const rateLimit = checkRateLimit(`email-verify:${clientIp(request)}`, 30, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)) } },
    )
  }

  try {
    const { sealed_result } = await runJob({
      sessionId: body.session_id,
      job: {
        client_public_key_b64: job.client_public_key_b64,
        nonce_b64: job.nonce_b64,
        ciphertext_b64: job.ciphertext_b64,
      },
    })
    return NextResponse.json({ sealed_result })
  } catch (error) {
    if (error instanceof EnclaveError && error.code === 'code_rejected') {
      return NextResponse.json({ error: 'code_rejected' }, { status: 401 })
    }
    console.error(
      '[email-login] enclave job failed',
      error instanceof EnclaveError ? `${error.status} ${error.code ?? ''}` : 'unexpected error',
    )
    return NextResponse.json({ error: 'enclave_unavailable' }, { status: 502 })
  }
}

export async function OPTIONS() {
  return ApiResponse.options()
}
