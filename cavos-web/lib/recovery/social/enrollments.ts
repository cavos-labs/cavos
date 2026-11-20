import type { createAdminClient } from '@/lib/supabase/admin'
import type { SealedEnrollment } from './releases'

export interface EnrollmentRow extends SealedEnrollment {
  id: string
  onchain_status: string
  provider: string
}

const COLUMNS = 'id, onchain_status, provider, dek_sealed'

/**
 * A wallet's recovery enrolment, with the enclave release that sealed it.
 *
 * Reads without `enclave_release` when the column is not there yet, so a
 * deploy that lands before its migration still serves every wallet.
 */
export async function loadEnrollment(
  admin: ReturnType<typeof createAdminClient>,
  walletId: string,
): Promise<EnrollmentRow | null> {
  const withRelease = await admin
    .from('social_recovery_enrollments')
    .select(`${COLUMNS}, enclave_release`)
    .eq('wallet_id', walletId)
    .maybeSingle()
  if (!withRelease.error) return withRelease.data

  const { data } = await admin
    .from('social_recovery_enrollments')
    .select(COLUMNS)
    .eq('wallet_id', walletId)
    .maybeSingle()
  return data ? { ...data, enclave_release: null } : null
}
