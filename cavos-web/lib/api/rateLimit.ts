/**
 * In-memory fixed-window rate limiter.
 *
 * This is a best-effort, per-process limiter — the same pattern already used by
 * the firebase email routes. It is NOT distributed: state does not share across
 * server instances/edge replicas. It exists as the near-term quota-griefing cap
 * on the (currently un-keyed) wallet-creation routes until API-key auth lands
 * in Phase F. See BILLING_AND_DB_SPEC.md §6.3.
 *
 * Do not use this for anything that must be accurate globally — only for
 * cheaply rejecting obvious abuse on a single instance.
 */

interface RateRecord {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateRecord>()

// Bound memory: periodically drop expired entries so a flood of unique keys
// can't grow the map unbounded. Checked lazily on each call.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000
let lastSweep = Date.now()

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [k, r] of buckets) {
    if (now > r.resetAt) buckets.delete(k)
  }
}

export interface RateLimitResult {
  allowed: boolean
  /** Remaining requests in the current window. */
  remaining: number
  /** ms until the window resets (for Retry-After). */
  retryAfterMs: number
}

/**
 * @param key     Bucket key (e.g. `wallet-create:${ip}`).
 * @param maxRequests  Max requests allowed in the window.
 * @param windowMs     Window size in ms.
 */
export function checkRateLimit(
  key: string,
  maxRequests = 20,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now()
  sweep(now)
  const record = buckets.get(key)

  if (!record || now > record.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: record.resetAt - now }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count, retryAfterMs: 0 }
}

/**
 * Extract a best-effort client IP from a Next.js Request. Falls back to
 * 'unknown' so the limiter still buckets something when no IP is available
 * (e.g. behind a proxy that doesn't forward headers).
 */
export function clientIp(request: Request): string {
  const headers = request.headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
