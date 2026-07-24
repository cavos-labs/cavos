/**
 * Billing enforcement. The wallet-limit gate is ALWAYS enforced: an over-limit
 * org is blocked with a real 402. There is deliberately no env-var toggle —
 * enforcement is not a runtime decision.
 *
 * Both SDKs already send `app_id`, so the server resolves app_id → org and gates
 * with zero SDK-side changes. `@cavos/react` is frozen and is never touched by
 * this module.
 */

/**
 * Returns true when an over-limit result should block. Enforcement is
 * unconditional: any disallowed result blocks. The `validate` endpoint still
 * reports the real `allowed`/`warning` so dashboards and SDKs see accurate state.
 */
export function shouldBlock(allowed: boolean): boolean {
  return !allowed
}
