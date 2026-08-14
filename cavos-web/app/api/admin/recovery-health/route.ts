import { NextResponse } from 'next/server'
import { pingEnclave } from '@/lib/recovery/social/enclave'

export const dynamic = 'force-dynamic'

/**
 * Is social recovery actually able to serve?
 *
 * This used to verify that the control plane could reach the GCE Compute API to
 * boot a VM. There is no VM to boot now, so the question that matters is
 * whether the long-lived enclave is up — which the relay answers by reaching
 * through to it rather than reporting on itself.
 */
export async function GET(request: Request) {
  const adminKey = request.headers.get('x-admin-key')
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  try {
    await pingEnclave()
    return NextResponse.json({
      ok: true,
      dependency: 'nitro-recovery-enclave',
      duration_ms: Date.now() - startedAt,
      checked_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[social-recovery] enclave health check failed', error)
    return NextResponse.json(
      {
        ok: false,
        dependency: 'nitro-recovery-enclave',
        duration_ms: Date.now() - startedAt,
        checked_at: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
