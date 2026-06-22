/**
 * Billing enforcement mode — a single env-var cutover so the 402 block can be
 * flipped on without redeploying logic. See BILLING_AND_DB_SPEC.md §9 Phase C.
 *
 *   BILLING_ENFORCE_MODE=warn     (default initially) — log the over-limit
 *                                 condition + dashboard banner, but still allow
 *                                 wallet creation. Used for the ~1-week soak.
 *   BILLING_ENFORCE_MODE=enforce  — return the real 402 and block creation.
 *
 * Both SDKs already send `app_id`, so the server resolves app_id → org and
 * gates with zero SDK-side changes. `@cavos/react` is frozen and is never
 * touched by this module.
 */

export type EnforceMode = 'warn' | 'enforce'

export function billingEnforceMode(): EnforceMode {
  return process.env.BILLING_ENFORCE_MODE === 'enforce' ? 'enforce' : 'warn'
}

/**
 * Returns true when an over-limit result should actually block. In `warn` mode
 * the caller logs and allows; in `enforce` mode it blocks. Either way the
 * `validate` endpoint reports the real `allowed`/`warning` so dashboards and
 * SDKs see accurate state regardless of mode.
 */
export function shouldBlock(allowed: boolean): boolean {
  return !allowed && billingEnforceMode() === 'enforce'
}
