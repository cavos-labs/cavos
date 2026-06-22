/**
 * Dashboard session helpers — resolve the org owned by the currently
 * authenticated dashboard user (cookie session, RLS-enforced).
 *
 * Mirrors the inline pattern used across the dashboard routes
 * (supabase.auth.getUser() → organizations.owner_id), extracted once so the
 * billing routes share one ownership check instead of duplicating it.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SessionOrg {
  userId: string
  orgId: string
}

/**
 * Resolve the org the signed-in user owns. Returns null if there is no session
 * (401) or the user owns no org (403). The caller is responsible for mapping
 * those to HTTP codes.
 */
export async function getSessionOrg(): Promise<SessionOrg | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  // A user may own multiple orgs in general; for billing we bill the org they
  // own. If they own several, the dashboard picks one — for now take the first
  // (consistent with the existing /dashboard/billing page which uses .single()
  // and assumes one owned org).
  const admin = createAdminClient()
  const { data: org } = await admin
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!org) return null
  return { userId: user.id, orgId: org.id }
}
