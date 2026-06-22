/**
 * Wallet-count billing gate. Single source of truth for the free-tier limit.
 *
 * See docs/BILLING_AND_DB_SPEC.md §5. The model:
 *   - Free  → 1,000 wallets per org (across all apps + networks).
 *   - Pro   → unlimited (kept in sync with Onvo via the webhook).
 *   - Custom→ unlimited, or a contract cap via `custom_wallet_limit`
 *             (set manually, never via the webhook — billed out-of-band).
 *
 * What is gated: creating NEW wallets only. Reading, signing, recovery and
 * transactions are NEVER gated — blocking those would lock users out of funds.
 *
 * All queries here run against the service-role admin client (RLS-bypassing)
 * because the gate is evaluated on SDK-facing routes that have no user session.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export const FREE_WALLET_LIMIT = 1000
export const WARN_THRESHOLD = 0.8   // soft warning at 80% of limit
const BLOCK_THRESHOLD = 1.0         // hard block at 100%

export type PlanTier = 'free' | 'pro' | 'custom'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled'

export interface OrgPlan {
  tier: PlanTier
  /** Infinity for pro and custom-without-cap. */
  walletLimit: number
  status: SubscriptionStatus
}

export interface CanCreateWalletResult {
  allowed: boolean
  /** Present only when `allowed` is false. */
  reason?: 'wallet_limit_reached'
  /** Current wallet count for the org. `-1` for unlimited plans. */
  count: number
  /** The limit being enforced. `Infinity` for unlimited plans. */
  limit: number
}

export interface ValidateUsage {
  tier: PlanTier
  status: SubscriptionStatus
  count: number
  /** `null` = unlimited. */
  limit: number | null
  /** `'approaching_limit'` at ≥80% on a capped plan, else `null`. */
  warning: 'approaching_limit' | null
}

/**
 * Resolve the organization that owns an app. Returns null for an unknown app
 * (the caller should 404/401 before reaching the gate, but we stay defensive).
 */
export async function resolveOrgForApp(appId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('apps')
    .select('organization_id')
    .eq('id', appId)
    .single()
  return data?.organization_id ?? null
}

/** All app ids owned by an org (every wallet under any of these counts). */
export async function appsOfOrg(orgId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('apps')
    .select('id')
    .eq('organization_id', orgId)
  return (data ?? []).map((a: { id: string }) => a.id)
}

/**
 * Count wallets for an org — summed across every app and network.
 * `COUNT(DISTINCT id)` is the billing unit: every row in `wallets` is one
 * wallet regardless of whether it was created via @cavos/kit (user-keyed) or
 * @cavos/react (address-keyed).
 */
export async function orgWalletCount(orgId: string): Promise<number> {
  const appIds = await appsOfOrg(orgId)
  if (appIds.length === 0) return 0
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('wallets')
    .select('id', { count: 'exact', head: true })
    .in('app_id', appIds)
  return count ?? 0
}

/**
 * Resolve an org's plan + effective wallet limit from `org_subscriptions`.
 * Defaults to free/1000 when no row exists (shouldn't happen after backfill,
 * but treating NULL defensively means a missing row can never grant unlimited).
 *
 * past_due/canceled orgs are treated as free until the webhook resolves them,
 * so a dunning failure never silently upgrades someone to unlimited.
 */
export async function orgPlan(orgId: string): Promise<OrgPlan> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('org_subscriptions')
    .select('plan_tier, status, custom_wallet_limit')
    .eq('org_id', orgId)
    .single()

  if (!data) return { tier: 'free', walletLimit: FREE_WALLET_LIMIT, status: 'active' }

  const tier = data.plan_tier as PlanTier
  const status = data.status as SubscriptionStatus
  const active = status === 'active'

  if ((tier === 'pro' || tier === 'custom') && active) {
    // Pro = unlimited. Custom = unlimited unless the contract sets a cap.
    const limit = tier === 'custom' && data.custom_wallet_limit != null
      ? data.custom_wallet_limit
      : Infinity
    return { tier, walletLimit: limit, status }
  }

  return { tier: 'free', walletLimit: FREE_WALLET_LIMIT, status }
}

/**
 * The gate. Evaluated synchronously on every wallet-creating request.
 * Returns `{ allowed: false, reason: 'wallet_limit_reached' }` at the limit.
 *
 * For unlimited plans we short-circuit and return count: -1 (no point counting).
 */
export async function canCreateWallet(orgId: string): Promise<CanCreateWalletResult> {
  const plan = await orgPlan(orgId)
  if (plan.walletLimit === Infinity) {
    return { allowed: true, count: -1, limit: Infinity }
  }
  const count = await orgWalletCount(orgId)
  if (count >= plan.walletLimit * BLOCK_THRESHOLD) {
    return { allowed: false, reason: 'wallet_limit_reached', count, limit: plan.walletLimit }
  }
  return { allowed: true, count, limit: plan.walletLimit }
}

/**
 * Read-only usage summary for `validate` and the dashboard. Mirrors
 * `canCreateWallet` but never blocks — it only reports count/limit/warning.
 */
export async function orgUsage(orgId: string): Promise<ValidateUsage> {
  const plan = await orgPlan(orgId)
  if (plan.walletLimit === Infinity) {
    return { tier: plan.tier, status: plan.status, count: -1, limit: null, warning: null }
  }
  const count = await orgWalletCount(orgId)
  const warning = count >= plan.walletLimit * WARN_THRESHOLD ? 'approaching_limit' : null
  return { tier: plan.tier, status: plan.status, count, limit: plan.walletLimit, warning }
}
