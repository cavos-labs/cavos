import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteRecoveryVm } from '@/lib/recovery/social/google-compute'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  await admin
    .from('social_recovery_sessions')
    .update({ status: 'expired', error_code: 'session_expired' })
    .in('status', ['starting', 'ready', 'processing'])
    .lte('expires_at', now)

  const { data: stale, error } = await admin
    .from('social_recovery_sessions')
    .select('id, vm_instance_name')
    .in('status', ['completed', 'failed', 'expired'])
    .is('vm_deleted_at', null)
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const deleted: string[] = []
  const failed: string[] = []
  for (const session of stale || []) {
    try {
      await deleteRecoveryVm(session.vm_instance_name)
      deleted.push(session.id)
      await admin
        .from('social_recovery_sessions')
        .update({ vm_deleted_at: new Date().toISOString() })
        .eq('id', session.id)
    } catch (cleanupError) {
      console.error('[social-recovery] scheduled VM cleanup failed', session.id, cleanupError)
      failed.push(session.id)
    }
  }
  // Keep the audit/session row; a repeated DELETE is safe and returns 404.
  return NextResponse.json({ inspected: stale?.length || 0, deleted, failed })
}
