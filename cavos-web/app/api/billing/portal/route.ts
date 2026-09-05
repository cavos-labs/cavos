import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionOrg } from '@/lib/auth/session'

/**
 * POST /api/billing/portal
 *
 * Subscription management portal is not yet implemented. Stripe Billing Portal
 * integration is planned. For now, custom-contract orgs are handled out-of-band.
 *
 * Body: { action?: 'cancel' }
 *   - Returns informational response about the org's plan status.
 */
export async function POST() {
  const session = await getSessionOrg()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: subRow } = await admin
    .from('org_subscriptions')
    .select('plan_tier')
    .eq('org_id', session.orgId)
    .single()

  if (subRow?.plan_tier === 'custom') {
    return NextResponse.json({
      managedExternally: true,
      reason: 'Your plan is managed under a custom contract. Contact sales to change it.',
    })
  }

  return NextResponse.json({
    managedExternally: true,
    reason: 'Billing portal is not yet available. Contact sales for plan changes.',
  })
}
