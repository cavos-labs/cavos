import { createAdminClient } from '@/lib/supabase/admin'
import {
  createRecoveryVm,
  deleteRecoveryVm,
  deleteRecoveryVmHedges,
  recoveryVmIsRunning,
} from './google-compute'
import { randomToken, tokenHash } from './security'

const POOL_LIFETIME_MS = 50 * 60_000
const POOL_VM_RUNTIME_SECONDS = 60 * 60
const POOL_JOB_TIMEOUT_SECONDS = 55 * 60

/**
 * How many warm workers to keep. **Zero by default**, so an environment that is
 * not serving users runs no Confidential VMs at all.
 *
 * Warm workers only buy latency: with the pool empty, enrolment and recovery
 * still work, from a cold start. Paying for an idle VM around the clock to save
 * a few seconds is worth it once real users are recovering wallets and not
 * before, so switching it on is a deliberate act.
 *
 * Anything outside 0–4 falls back to 0 rather than to a value that spends money.
 */
function targetSize(): number {
  const configured = Number(process.env.SOCIAL_RECOVERY_WARM_POOL_SIZE ?? '0')
  return Number.isInteger(configured) && configured >= 0 && configured <= 4
    ? configured
    : 0
}

export interface PoolMaintenanceResult {
  target: number
  created: string[]
  failed: string[]
  reconciled: string[]
}

async function reconcileReadyWorkers(): Promise<string[]> {
  const admin = createAdminClient()
  const { data: workers, error } = await admin
    .from('social_recovery_sessions')
    .select('id, vm_instance_name, vm_instance_id')
    .eq('status', 'ready')
    .eq('pool_slot', true)
    .is('wallet_id', null)
    .limit(4)
  if (error) throw new Error(`warm-pool reconciliation failed: ${error.message}`)

  const reconciled: string[] = []
  for (const worker of workers || []) {
    let running = false
    try {
      running = Boolean(
        worker.vm_instance_id &&
          (await recoveryVmIsRunning(worker.vm_instance_name, worker.vm_instance_id)),
      )
    } catch (error) {
      // A transient Compute API failure must not evict a healthy worker.
      console.error('[social-recovery] warm-pool health check failed', worker.id, error)
      continue
    }
    if (running) continue

    const { data: failed, error: updateError } = await admin
      .from('social_recovery_sessions')
      .update({ status: 'failed', error_code: 'pool_vm_unavailable' })
      .eq('id', worker.id)
      .eq('status', 'ready')
      .eq('pool_slot', true)
      .is('wallet_id', null)
      .select('id')
      .maybeSingle()
    if (updateError) {
      throw new Error(`warm-pool reconciliation update failed: ${updateError.message}`)
    }
    if (!failed) continue

    reconciled.push(worker.id)
    try {
      await deleteRecoveryVm(worker.vm_instance_name)
    } catch (error) {
      console.error('[social-recovery] unhealthy warm-pool VM cleanup failed', worker.id, error)
    }
  }
  return reconciled
}

/**
 * Ensure empty one-shot Confidential Space workers are ready before login.
 * The database RPC serializes reservations, so this is safe to invoke from a
 * cron, a prewarm claim, and a completion callback at the same time.
 */
export async function ensureRecoveryPool(): Promise<PoolMaintenanceResult> {
  const admin = createAdminClient()
  const target = targetSize()
  const reconciled = await reconcileReadyWorkers()
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
        try {
          const { data: session, error: sessionError } = await admin
            .from('social_recovery_sessions')
            .select('vm_instance_id')
            .eq('id', reservation.id)
            .maybeSingle()
          if (sessionError) throw sessionError
          if (session?.vm_instance_id) {
            await deleteRecoveryVmHedges(
              reservation.instanceName,
              session.vm_instance_id,
            )
          }
        } catch (error) {
          console.error('[social-recovery] post-provision hedge cleanup failed', error)
        }
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
  return { target, created, failed, reconciled }
}
