import { NextResponse } from 'next/server'
import { verifyRecoveryControlPlaneAccess } from '@/lib/recovery/social/google-compute'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const adminKey = request.headers.get('x-admin-key')
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  try {
    await verifyRecoveryControlPlaneAccess()
    return NextResponse.json({
      ok: true,
      dependency: 'gcp-confidential-recovery-control-plane',
      duration_ms: Date.now() - startedAt,
      checked_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[social-recovery] control-plane health check failed', error)
    return NextResponse.json(
      {
        ok: false,
        dependency: 'gcp-confidential-recovery-control-plane',
        checked_at: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
