import { createAdminClient } from '@/lib/supabase/admin'
import { createRecoveryVm } from './google-compute'
import { randomToken, tokenHash } from './security'

const POOL_LIFETIME_MS = 50 * 60_000
const POOL_VM_RUNTIME_SECONDS = 60 * 60
const POOL_JOB_TIMEOUT_SECONDS = 55 * 60

function targetSize(): number {
  const configured = Number(process.env.SOCIAL_RECOVERY_WARM_POOL_SIZE || '1')
  return Number.isInteger(configured) && configured >= 1 && configured <= 4
    ? configured
    : 1
}

export interface PoolMaintenanceResult {
  target: number
  created: string[]
  failed: string[]
}

/**
 * Ensure empty one-shot Confidential Space workers are ready before login.
 * The database RPC serializes reservations, so this is safe to invoke from a
 * cron, a prewarm claim, and a completion callback at the same time.
 */
export async function ensureRecoveryPool(): Promise<PoolMaintenanceResult> {
  const admin = createAdminClient()
  const target = targetSize()
  const reservations: Array<{
    id: string
    bootstrapToken: string
    instanceName: string
  }> = []

  for (let index = 0; index < target; index += 1) {
    const id = crypto.randomUUID()
    const bootstrapToken = randomToken()
    const instanceName = `cavos-rec-${id.replaceAll('-', '').slice(0, 24)}`
    const { data, error } = await admin.rpc('reserve_social_recovery_pool_slot', {
      p_id: id,
      p_bootstrap_token_hash: tokenHash(bootstrapToken),
      p_vm_instance_name: instanceName,
      p_expires_at: new Date(Date.now() + POOL_LIFETIME_MS).toISOString(),
      p_target_size: target,
    })
    if (error) throw new Error(`warm-pool reservation failed: ${error.message}`)
    if (!data) break
    reservations.push({ id, bootstrapToken, instanceName })
  }

  const created: string[] = []
  const failed: string[] = []
  await Promise.all(
    reservations.map(async (reservation) => {
      try {
        await createRecoveryVm({
          sessionId: reservation.id,
          bootstrapToken: reservation.bootstrapToken,
          instanceName: reservation.instanceName,
          maxRunSeconds: POOL_VM_RUNTIME_SECONDS,
          jobTimeoutSeconds: POOL_JOB_TIMEOUT_SECONDS,
          poolWorker: true,
        })
        created.push(reservation.id)
      } catch (error) {
        failed.push(reservation.id)
        await admin
          .from('social_recovery_sessions')
          .update({ status: 'failed', error_code: 'pool_vm_create_failed' })
          .eq('id', reservation.id)
          .eq('status', 'starting')
        console.error('[social-recovery] warm-pool VM create failed', error)
      }
    }),
  )
  return { target, created, failed }
}
