/**
 * Onvo server client — recurring subscriptions.
 *
 * Adapted from the reference Onvo integration at framezz/vigilant-goggles
 * (one-time Payment Intents). Cavos needs RECURRING subscriptions ($99/mo Pro),
 * so the subscription functions below are net-new vs the reference. The
 * transport (onvoFetch, auth header, error classes, webhook verification) is
 * reused verbatim.
 *
 * Confirmed against the real Onvo docs (https://docs.onvopay.com —
 * payments/subscriptions, webhooks, openapi.yaml). Recurring flow:
 *   Product (POST /products) → recurring Price (POST /prices) → Customer
 *   (POST /customers) → Subscription (POST /subscriptions, items:[{ priceId }]).
 * Product + recurring Price are created once out-of-band; that price id is
 * ONVO_PRO_PRICE_ID. Subscription create takes `items` + `paymentMethodId`.
 *
 * Plan changes are driven ONLY by the two documented subscription webhooks:
 *   subscription.renewal.succeeded / subscription.renewal.failed
 * Onvo has NO subscription.active/canceled/expired events — the lifecycle
 * status is carried inside the renewal payload as `subscriptionStatus`.
 */

// ─── Endpoint paths (ONVO_BASE_URL already includes /v1) ──────────────────────
const CUSTOMERS_PATH = '/customers'
const SUBSCRIPTIONS_PATH = '/subscriptions'            // POST create, GET list
const subscriptionPath = (id: string) => `${SUBSCRIPTIONS_PATH}/${encodeURIComponent(id)}`

export type OnvoCustomer = {
  id?: unknown
}

// The POST /subscriptions response is invoice-shaped: it carries the first
// invoice `id`, the parent `subscriptionId`, and that invoice's `status`
// (draft|open|paid|void|uncollectible) + `periodStart`/`periodEnd`. GET
// /subscriptions/{id} returns the subscription resource itself. We read both
// shapes defensively (subscriptionId preferred, id fallback).
export type OnvoSubscription = {
  id?: unknown
  subscriptionId?: unknown
  status?: unknown
  periodEnd?: unknown
  currentPeriodEnd?: unknown
  periodStart?: unknown
  currentPeriodStart?: unknown
  canceledAt?: unknown
  customerId?: unknown
  metadata?: unknown
}

export class OnvoConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OnvoConfigError'
  }
}

export class OnvoGatewayError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'OnvoGatewayError'
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.includes('replace-me') || value.includes('replace-with')) {
    throw new OnvoConfigError(`${name} is not set`)
  }
  return value
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback
}

function onvoBaseUrl(): string {
  return optionalEnv('ONVO_BASE_URL', 'https://api.onvopay.com/v1').replace(/\/+$/, '')
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`ONVO returned non-JSON response (${response.status})`)
  }
}

async function onvoFetch<T>(
  path: string,
  init: { method: string; body?: unknown },
): Promise<T> {
  const response = await fetch(`${onvoBaseUrl()}${path}`, {
    method: init.method,
    headers: {
      authorization: `Bearer ${requiredEnv('ONVO_SECRET_KEY')}`,
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })
  const body = await parseJsonResponse<T>(response)
  if (!response.ok) {
    console.error(`[onvo] request failed`, { path, status: response.status, body })
    throw new OnvoGatewayError(`ONVO request failed (${response.status})`, response.status)
  }
  return body
}

// ─── Field accessors (defensive — Onvo payloads are typed `unknown`) ──────────

export function onvoCustomerId(customer: OnvoCustomer): string | null {
  return typeof customer.id === 'string' && customer.id.length > 0 ? customer.id : null
}

export function onvoSubscriptionId(sub: OnvoSubscription): string | null {
  // The create response is invoice-shaped (its `id` is the first invoice);
  // `subscriptionId` is the parent subscription we persist. GET on a
  // subscription returns the resource itself, where `id` is the subscription.
  if (typeof sub.subscriptionId === 'string' && sub.subscriptionId.length > 0) {
    return sub.subscriptionId
  }
  return typeof sub.id === 'string' && sub.id.length > 0 ? sub.id : null
}

export function onvoSubscriptionPeriodEnd(sub: OnvoSubscription): string | null {
  // The invoice-shaped create/renewal payload uses `periodEnd`; the subscription
  // resource uses `currentPeriodEnd`. Accept either.
  const v = sub.periodEnd ?? sub.currentPeriodEnd
  if (typeof v === 'string' && v.length > 0) return v
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'number') {
    // epoch seconds or ms — accept either
    return new Date(v > 1e12 ? v : v * 1000).toISOString()
  }
  return null
}

export function onvoSubscriptionCustomerId(sub: OnvoSubscription): string | null {
  const v = sub.customerId
  return typeof v === 'string' && v.length > 0 ? v : null
}

/**
 * True when the first charge went through. The create response is invoice-
 * shaped; `status: 'paid'` means the card was charged. We also accept 'active'/
 * 'trialing' in case a GET on the subscription resource is passed in.
 *
 * Note: plan_tier is still only flipped to 'pro' by the renewal webhook, never
 * by this check — this is just for the immediate checkout-response UX.
 */
export function isOnvoSubscriptionActive(sub: OnvoSubscription): boolean {
  const s = String(sub.status ?? '').toLowerCase()
  return s === 'paid' || s === 'active' || s === 'trialing'
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function createOnvoCustomer({
  name,
  email,
  metadata,
}: {
  name: string
  email: string
  metadata?: Record<string, string>
}): Promise<OnvoCustomer> {
  return onvoFetch<OnvoCustomer>(CUSTOMERS_PATH, {
    method: 'POST',
    body: {
      name,
      email,
      ...(metadata ? { metadata } : {}),
    },
  })
}

/**
 * Create a Pro subscription for an org and charge the first period immediately.
 *
 * Per the Onvo recurring-subscriptions doc, the price is passed inside an
 * `items` array (`[{ priceId, quantity }]`) and the card via `paymentMethodId`.
 * `description`/`metadata` are stored on the subscription for reconciliation.
 */
export async function createOnvoSubscription({
  customerId,
  priceId,
  paymentMethodId,
  description,
  metadata,
}: {
  customerId: string
  priceId: string
  paymentMethodId?: string
  description?: string
  metadata?: Record<string, string>
}): Promise<OnvoSubscription> {
  return onvoFetch<OnvoSubscription>(SUBSCRIPTIONS_PATH, {
    method: 'POST',
    body: {
      customerId,
      ...(paymentMethodId ? { paymentMethodId } : {}),
      items: [{ priceId, quantity: 1 }],
      ...(description ? { description } : {}),
      ...(metadata ? { metadata } : {}),
    },
  })
}

export async function getOnvoSubscription(subscriptionId: string): Promise<OnvoSubscription> {
  return onvoFetch<OnvoSubscription>(subscriptionPath(subscriptionId), { method: 'GET' })
}

/**
 * Cancel a subscription. Onvo exposes this as `DELETE /v1/subscriptions/{id}`.
 * The docs don't document a cancel-at-period-end flag, so this cancels the
 * subscription; the org keeps Pro until our stored current_period_end (the
 * webhook / status route honor that), then orgPlan downgrades it.
 */
export async function cancelOnvoSubscription(
  subscriptionId: string,
): Promise<OnvoSubscription> {
  return onvoFetch<OnvoSubscription>(subscriptionPath(subscriptionId), {
    method: 'DELETE',
  })
}

// ─── Webhook verification ─────────────────────────────────────────────────────
// Onvo delivers the webhook secret in the X-Webhook-Secret header (a shared
// secret, NOT an HMAC signature). Constant-time compare to avoid leaking the
// secret via timing. Mirrors the framezz reference verbatim.

export function verifyOnvoWebhook(request: Request): boolean {
  const expected = process.env.ONVO_WEBHOOK_SECRET ?? ''
  if (!expected || expected.includes('replace-with')) return false
  const received = request.headers.get('x-webhook-secret') ?? ''
  if (received.length !== expected.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ received.charCodeAt(i)
  }
  return mismatch === 0
}

/**
 * Onvo webhook envelope: `{ type, data }` where `data` is the resource snapshot
 * (for subscription events, a renewal/invoice object).
 */
export type OnvoWebhookEvent = {
  type?: unknown
  data?: unknown
}

export function onvoEventType(event: OnvoWebhookEvent): string {
  return typeof event.type === 'string' ? event.type : ''
}

/**
 * The `data` of a subscription.renewal.* webhook. Field names per the Onvo docs:
 *   succeeded → { subscriptionId, status:'paid', periodStart, periodEnd, ... }
 *   failed    → { subscriptionId, subscriptionStatus, currentPeriodEnd,
 *                 nextPaymentAttempt, attemptCount, error, ... }
 */
export interface OnvoRenewalData {
  /** Parent subscription id — the key we match rows on. */
  subscriptionId: string | null
  /** Period end to store (periodEnd on success, currentPeriodEnd on failure). */
  periodEnd: string | null
  /** Lifecycle status carried on the failed payload, e.g. 'past_due', 'canceled'. */
  subscriptionStatus: string | null
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

/** Pull the renewal fields out of a webhook envelope. */
export function extractRenewalFromEvent(event: OnvoWebhookEvent): OnvoRenewalData | null {
  const data = event.data
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  return {
    subscriptionId: asString(d.subscriptionId) ?? asString(d.id),
    periodEnd: asString(d.periodEnd) ?? asString(d.currentPeriodEnd),
    subscriptionStatus: asString(d.subscriptionStatus) ?? asString(d.status),
  }
}
