import { NextResponse } from 'next/server'
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier'
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit'
import { ApiResponse } from '@/lib/api/response'
import { EnclaveError, sendCode } from '@/lib/recovery/social/enclave'

/**
 * Ask the enclave to mail a sign-in code to an address.
 *
 * The enclave generates the code and delivers it directly to the recipient's
 * mail server. This route only names the app the mail is branded for and never
 * sees the code.
 */

const MAX_EMAIL_LENGTH = 254
const MAX_APP_NAME_LENGTH = 40
const FALLBACK_APP_NAME = 'Cavos'

function enclaveAppName(name: string): string {
  const cleaned = name
    .replace(/[^A-Za-z0-9 .,'&-]/g, '')
    .trim()
    .slice(0, MAX_APP_NAME_LENGTH)
    .trim()
  return cleaned || FALLBACK_APP_NAME
}

function refusal(code: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error: code }, { status, headers })
}

export async function POST(request: Request) {
  let body: { app_id?: unknown; email?: unknown }
  try {
    body = await request.json()
  } catch {
    return refusal('invalid_request', 400)
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (
    typeof body.app_id !== 'string' ||
    !body.app_id ||
    !email ||
    email.length > MAX_EMAIL_LENGTH ||
    !/^[^\s@]+@[^\s@]+$/.test(email)
  ) {
    return refusal('invalid_request', 400)
  }

  const rateLimit = checkRateLimit(`email-code:${clientIp(request)}`, 10, 60_000)
  if (!rateLimit.allowed) {
    return refusal('rate_limited', 429, {
      'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)),
    })
  }

  const app = await resolveAppIdentifier(body.app_id)
  if (!app) return refusal('app_not_found', 404)

  try {
    await sendCode({ email, appId: app.appId, appName: enclaveAppName(app.appName) })
  } catch (error) {
    const code = error instanceof EnclaveError ? error.code : undefined
    if (code === 'code_cooldown') return refusal('code_cooldown', 429)
    if (code === 'email_undeliverable') return refusal('email_undeliverable', 422)
    if (code === 'email_invalid') return refusal('invalid_request', 400)
    if (code === 'email_unavailable') return refusal('email_unavailable', 503)
    console.error('[email-login] enclave sendCode failed', error)
    return refusal('enclave_unavailable', 502)
  }
  return NextResponse.json({ status: 'sent' })
}

export async function OPTIONS() {
  return ApiResponse.options()
}
