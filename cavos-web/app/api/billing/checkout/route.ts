import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionOrg } from '@/lib/auth/session'
import {
  createOnvoCustomer,
  createOnvoSubscription,
  onvoCustomerId,
  onvoSubscriptionId,
  isOnvoSubscriptionActive,
  onvoSubscriptionPeriodEnd,
  OnvoConfigError,
  OnvoGatewayError,
  type OnvoSubscription,
} from '@/lib/onvo'

/**
 * POST /api/billing/checkout
 *
 * Body: { paymentMethodId: string, customerId?: string }
 *   customerId is the Onvo customer the card was tokenized under (client-side);
 *   the subscription must be charged against it.
 *
 * Resolves/creates the Onvo customer + a Pro subscription for the org. Stores
 * onvo_customer_id / onvo_subscription_id.
 *
 * IMPORTANT: this route does NOT flip plan_tier to 'pro'. That happens only via
 * the Onvo renewal webhook (see onvo-webhook/route.ts). Same "never trust client
 * state" principle the framezz reference uses for order fulfillment.
 *
 * Response:
 *   { status: 'active' | 'pending', subscriptionId }
 */
export async function POST(request: Request) {
  const session = await getSessionOrg()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let paymentMethodId: string | undefined
  let clientCustomerId: string | undefined
  try {
    const body = await request.json()
    paymentMethodId = body?.paymentMethodId
    clientCustomerId = typeof body?.customerId === 'string' ? body.customerId : undefined
  } catch {
    // fall through — validated below
  }
  if (!paymentMethodId || typeof paymentMethodId !== 'string') {
    return NextResponse.json({ error: 'paymentMethodId is required' }, { status: 400 })
  }

  const priceId = process.env.ONVO_PRO_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'Pro plan is not configured' }, { status: 503 })
  }

  const admin = createAdminClient()

  // Load org + existing subscription row to reuse the Onvo customer if present.
  const { data: org } = await admin
    .from('organizations')
    .select('id, name')
    .eq('id', session.orgId)
    .single()
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const { data: subRow } = await admin
    .from('org_subscriptions')
    .select('onvo_customer_id, onvo_subscription_id')
    .eq('org_id', session.orgId)
    .single()

  try {
    // 1. Resolve the Onvo customer the card belongs to. Precedence:
    //    (a) the org's stored customer (returning Pro buyer),
    //    (b) the customer Onvo created when the card was tokenized client-side
    //        (the payment method is attached to THIS customer, so we must charge
    //        the subscription against it), else
    //    (c) create one server-side as a fallback.
    let customerId = subRow?.onvo_customer_id ?? clientCustomerId ?? null
    if (!customerId) {
      const customer = await createOnvoCustomer({
        name: org.name,
        email: `${session.orgId}@billing.cavos.xyz`, // placeholder contact; Onvo requires an email
        metadata: { org_id: session.orgId },
      })
      customerId = onvoCustomerId(customer)
      if (!customerId) {
        return NextResponse.json({ error: 'Onvo did not return a customer id' }, { status: 502 })
      }
    }

    // 2. Create the Pro subscription.
    const subscription: OnvoSubscription = await createOnvoSubscription({
      customerId,
      priceId,
      paymentMethodId,
      description: `Cavos Pro — ${org.name}`,
      metadata: { org_id: session.orgId },
    })
    const subscriptionId = onvoSubscriptionId(subscription)
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Onvo did not return a subscription id' }, { status: 502 })
    }

    // 3. Persist customer + subscription ids. plan_tier is intentionally NOT
    //    set here — the webhook is the only thing that flips it to 'pro'.
    //    current_period_end is stored for display; cancel_at_period_end stays
    //    false until a cancel webhook arrives.
    await admin
      .from('org_subscriptions')
      .update({
        onvo_customer_id: customerId,
        onvo_subscription_id: subscriptionId,
        current_period_end: onvoSubscriptionPeriodEnd(subscription),
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', session.orgId)

    // 4. Report the immediate charge result. Even on a paid first charge we
    //    still wait for subscription.renewal.succeeded to flip plan_tier — the
    //    dashboard polls /api/billing/status and reads 'pro' once it lands.
    //    'pending' means the invoice isn't 'paid' yet (e.g. still processing);
    //    the webhook remains the authority either way.
    return NextResponse.json({
      status: isOnvoSubscriptionActive(subscription) ? 'active' : 'pending',
      subscriptionId,
    })
  } catch (err) {
    if (err instanceof OnvoConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 })
    }
    if (err instanceof OnvoGatewayError) {
      return NextResponse.json({ error: 'Onvo request failed', status: err.status }, { status: 502 })
    }
    console.error('[billing/checkout] unexpected error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
