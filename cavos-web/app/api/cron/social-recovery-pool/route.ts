import { NextResponse } from 'next/server'
import { ensureRecoveryPool } from '@/lib/recovery/social/pool'

export const maxDuration = 300

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return NextResponse.json(await ensureRecoveryPool())
  } catch (error) {
    console.error('[social-recovery] warm-pool maintenance failed', error)
    return NextResponse.json({ error: 'warm_pool_maintenance_failed' }, { status: 500 })
  }
}
