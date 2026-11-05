import { NextResponse } from 'next/server'
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit'
import { ApiResponse } from '@/lib/api/response'
import { EnclaveError, runJob } from '@/lib/recovery/social/enclave'
import { verifyOAuthState } from '@/lib/oauth/state'
import { telegramCallbackUrl, telegramCredentials } from '@/lib/oauth/telegram'

/**
 * Forward the encrypted `verify_telegram` job and return only the sealed result.
 *
 * The grant minted by the callback carries the authorization code, bound to an
 * app and environment. This route attaches the bot credentials and hands
 * both to the enclave, which redeems the code with the PKCE verifier from the
 * encrypted job. The enclave's plaintext result is neither returned nor logged;
 * only the client holds the key that opens `sealed_result`. Neither the code
 * nor the client secret is ever logged.
 */

interface VerifyBody {
  session_id?: unknown
  job?: {
    client_public_key_b64?: unknown
    nonce_b64?: unknown
    ciphertext_b64?: unknown
  }
  telegram_grant?: unknown
}

interface GrantPayload {
  code: string
  app_id: string
  environment_id: string | null
  issued_at?: number
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
    typeof body.telegram_grant !== 'string' ||
    !body.telegram_grant ||
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
    job.ciphertext_b64.length > 131072 ||
    body.telegram_grant.length > 4096
  ) {
    return NextResponse.json({ error: 'encrypted_job_too_large' }, { status: 413 })
  }

  const rateLimit = checkRateLimit(`telegram-verify:${clientIp(request)}`, 30, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)) } },
    )
  }

  let grant: GrantPayload
  try {
    grant = verifyOAuthState<GrantPayload>(body.telegram_grant)
  } catch {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 })
  }
  if (typeof grant.code !== 'string' || !grant.code || typeof grant.app_id !== 'string' || !grant.app_id) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 })
  }

  try {
    const { botId, clientSecret } = await telegramCredentials(grant.environment_id ?? null)
    const { sealed_result } = await runJob({
      sessionId: body.session_id,
      job: {
        client_public_key_b64: job.client_public_key_b64,
        nonce_b64: job.nonce_b64,
        ciphertext_b64: job.ciphertext_b64,
      },
      telegram: {
        code: grant.code,
        app_id: grant.app_id,
        bot_id: botId,
        client_secret: clientSecret,
        redirect_uri: telegramCallbackUrl(),
      },
    })
    return NextResponse.json({ sealed_result })
  } catch (error) {
    if (error instanceof EnclaveError && error.code === 'telegram_rejected') {
      return NextResponse.json({ error: 'telegram_rejected' }, { status: 401 })
    }
    console.error(
      '[telegram-login] enclave job failed',
      error instanceof EnclaveError ? `${error.status} ${error.code ?? ''}` : 'unexpected error',
    )
    return NextResponse.json({ error: 'enclave_unavailable' }, { status: 502 })
  }
}

export async function OPTIONS() {
  return ApiResponse.options()
}
