import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionOrg } from '@/lib/auth/session'
import { orgUsage } from '@/lib/billing/limits'

/**
 * GET /api/billing/status
 *
 * Dashboard-facing. Returns the signed-in user's org plan + wallet usage.
 * Resolved server-side from org_subscriptions + a wallet count. This is the
 * authoritative source the dashboard's Plan & Usage card reads (Phase D5
 * swaps the dashboard's Phase-B direct read over to this route).
 *
 * Response: { plan_tier, status, wallet_count, wallet_limit, warning,
 *             current_period_end, onvo_customer_id }
 */
export async function GET() {
  const session = await getSessionOrg()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('org_subscriptions')
    .select('plan_tier, status, current_period_end, onvo_customer_id, cancel_at_period_end')
    .eq('org_id', session.orgId)
    .single()

  const usage = await orgUsage(session.orgId)

  return NextResponse.json({
    plan_tier: usage.tier,
    status: usage.status,
    wallet_count: usage.count,                 // -1 = unlimited
    wallet_limit: usage.limit,                 // null = unlimited
    warning: usage.warning,
    current_period_end: sub?.current_period_end ?? null,
    cancel_at_period_end: sub?.cancel_at_period_end ?? false,
    onvo_customer_id: sub?.onvo_customer_id ?? null,
  })
}
