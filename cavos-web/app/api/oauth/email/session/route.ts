import { NextResponse } from 'next/server'
import { resolveAppIdentifier } from '@/lib/apps/resolveAppIdentifier'
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit'
import { ApiResponse } from '@/lib/api/response'
import { openSession } from '@/lib/recovery/social/enclave'

/**
 * Open an attested channel to the enclave for an email sign-in.
 *
 * Nothing is stored: the session id is only a name for the channel, and the
 * enclave holds all of its state.
 */

export async function POST(request: Request) {
  let body: { app_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }
  if (typeof body.app_id !== 'string' || !body.app_id) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const rateLimit = checkRateLimit(`email-session:${clientIp(request)}`, 30, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)) } },
    )
  }

  const app = await resolveAppIdentifier(body.app_id)
  if (!app) return NextResponse.json({ error: 'app_not_found' }, { status: 404 })

  const sessionId = crypto.randomUUID()
  try {
    const opened = await openSession(sessionId)
    return NextResponse.json({
      session_id: sessionId,
      ephemeral_public_key_b64: opened.ephemeral_public_key_b64,
      attestation_document_b64: opened.attestation_document_b64,
    })
  } catch (error) {
    console.error('[email-login] enclave openSession failed', error)
    return NextResponse.json({ error: 'enclave_unavailable' }, { status: 502 })
  }
}

export async function OPTIONS() {
  return ApiResponse.options()
}
