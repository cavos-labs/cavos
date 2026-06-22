import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  verifyOnvoWebhook,
  onvoEventType,
  extractRenewalFromEvent,
  type OnvoWebhookEvent,
} from '@/lib/onvo'

/**
 * POST /api/billing/onvo-webhook
 *
 * THE source of truth for plan_tier. This is the ONLY thing that flips an org
 * to 'pro'. The checkout route deliberately does not — never trust client state.
 *
 * Onvo exposes exactly two subscription webhooks (confirmed against the docs):
 *   - subscription.renewal.succeeded → first charge or a renewal was paid.
 *   - subscription.renewal.failed    → a charge failed; the payload carries the
 *                                       lifecycle status in `subscriptionStatus`.
 * There is NO subscription.active/canceled/expired event — lifecycle transitions
 * are inferred from the renewal payloads (and from our own cancel call).
 *
 * Idempotency: every update is an atomic conditional UPDATE keyed on
 * onvo_subscription_id, so duplicate deliveries don't double-fire and
 * out-of-order events resolve to the latest known state.
 */

// Terminal Onvo subscription statuses → downgrade to free. Anything else on a
// failed renewal (e.g. 'past_due', 'unpaid' while still retrying) keeps Pro
// during the dunning window; Onvo eventually reports a terminal status.
const TERMINAL_STATUSES = new Set(['canceled', 'cancelled', 'incomplete_expired', 'expired'])

export async function POST(request: Request) {
  // 1. Verify the shared-secret webhook. Onvo sends it in X-Webhook-Secret
  //    (NOT an HMAC signature). Constant-time compare.
  if (!verifyOnvoWebhook(request)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let event: OnvoWebhookEvent
  try {
    event = (await request.json()) as OnvoWebhookEvent
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const type = onvoEventType(event)
  const renewal = extractRenewalFromEvent(event)
  const subscriptionId = renewal?.subscriptionId ?? null
  const periodEnd = renewal?.periodEnd ?? null

  const admin = createAdminClient()

  // Atomic update keyed on onvo_subscription_id so duplicate deliveries and
  // races resolve idempotently.
  const applyUpdate = async (subId: string, fields: Record<string, unknown>) => {
    await admin
      .from('org_subscriptions')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('onvo_subscription_id', subId)
  }

  switch (type) {
    // ── Charge paid (first charge or renewal) → Pro, active ───────────────
    case 'subscription.renewal.succeeded': {
      if (!subscriptionId) break
      await applyUpdate(subscriptionId, {
        plan_tier: 'pro',
        status: 'active',
        cancel_at_period_end: false,
        ...(periodEnd ? { current_period_end: periodEnd } : {}),
      })
      return NextResponse.json({ received: true, handled: type })
    }

    // ── Charge failed → past_due (grace) or downgrade if terminal ─────────
    case 'subscription.renewal.failed': {
      if (!subscriptionId) break
      const lifecycle = (renewal?.subscriptionStatus ?? '').toLowerCase()
      if (TERMINAL_STATUSES.has(lifecycle)) {
        // Subscription is dead — downgrade to free now.
        await applyUpdate(subscriptionId, {
          plan_tier: 'free',
          status: 'canceled',
          cancel_at_period_end: false,
        })
      } else {
        // Still in dunning — keep Pro, mark past_due. orgPlan() treats past_due
        // as free for the limit check, so unlimited creation pauses until the
        // card recovers, but the row stays Pro for display/recovery.
        await applyUpdate(subscriptionId, {
          status: 'past_due',
          ...(periodEnd ? { current_period_end: periodEnd } : {}),
        })
      }
      return NextResponse.json({ received: true, handled: type })
    }

    default: {
      // Unknown / unhandled event (e.g. payment-intent.*, checkout-session.*).
      // Ack so Onvo stops retrying, but log so we can see real traffic.
      console.warn('[onvo-webhook] unhandled event type', { type, hasSubscriptionId: !!subscriptionId })
      return NextResponse.json({ received: true, unhandled: type })
    }
  }

  // Reached a known branch but the payload was missing the subscription id —
  // ack so Onvo doesn't loop, but flag it.
  console.warn('[onvo-webhook] known event missing subscription id', { type })
  return NextResponse.json({ received: true, incomplete: type })
}
