import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionOrg } from '@/lib/auth/session'
import { cancelOnvoSubscription, OnvoConfigError, OnvoGatewayError } from '@/lib/onvo'

/**
 * POST /api/billing/portal
 *
 * Onvo does NOT expose a hosted customer portal (confirmed against the docs —
 * there's no portal/manage URL on the subscription resource). Management is
 * API-driven, and the only self-serve action a Pro org needs is to cancel.
 *
 * Body: { action?: 'cancel' }
 *   - 'cancel' → cancel the Onvo subscription (DELETE /subscriptions/{id}) and
 *                mark cancel_at_period_end. plan_tier stays 'pro' until the
 *                period ends / the renewal webhook reports a terminal status.
 *   - otherwise → return an informational message (no hosted portal exists).
 *
 * The dashboard renders `reason` when there's no `url`. We never return a `url`
 * here because Onvo has none; cancellation is explicit via the body action.
 */
export async function POST(request: Request) {
  const session = await getSessionOrg()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let action: string | undefined
  try {
    const body = await request.json()
    action = body?.action
  } catch {
    // no body — treated as an info request below
  }

  const admin = createAdminClient()
  const { data: subRow } = await admin
    .from('org_subscriptions')
    .select('onvo_subscription_id, plan_tier')
    .eq('org_id', session.orgId)
    .single()

  const subscriptionId = subRow?.onvo_subscription_id
  if (!subscriptionId) {
    return NextResponse.json({
      managedExternally: true,
      reason: subRow?.plan_tier === 'custom'
        ? 'Your plan is managed under a custom contract. Contact sales to change it.'
        : 'No active subscription to manage.',
    })
  }

  if (action !== 'cancel') {
    // Informational: Onvo has no hosted portal. Tell the dashboard what's available.
    return NextResponse.json({
      managedExternally: true,
      reason: 'To cancel your Pro plan, confirm cancellation from the dashboard. Your plan stays active until the end of the current billing period.',
    })
  }

  try {
    await cancelOnvoSubscription(subscriptionId)
    // Reflect the pending cancellation. plan_tier stays 'pro' (orgPlan keeps it
    // until current_period_end); the renewal webhook finalizes the downgrade.
    await admin
      .from('org_subscriptions')
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq('org_id', session.orgId)

    return NextResponse.json({
      canceled: true,
      reason: 'Your Pro plan will not renew. You keep Pro until the end of the current billing period.',
    })
  } catch (err) {
    if (err instanceof OnvoConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 })
    }
    if (err instanceof OnvoGatewayError) {
      return NextResponse.json({ error: 'Onvo request failed', status: err.status }, { status: 502 })
    }
    console.error('[billing/portal] unexpected error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
