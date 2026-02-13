import { createHash, timingSafeEqual } from 'crypto'
import { nanoid } from 'nanoid'

const KEY_PREFIX = 'cav_'
const RANDOM_LENGTH = 48 // 48 URL-safe chars → high entropy

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `${KEY_PREFIX}${nanoid(RANDOM_LENGTH)}`
  const hash = hashApiKey(key)
  const prefix = key.slice(0, 12) // "cav_XXXXXXXX" — safe to store/display
  return { key, hash, prefix }
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

// Timing-safe comparison — both sides are 64-char hex strings (SHA-256)
export function verifyApiKey(provided: string, storedHash: string): boolean {
  try {
    const providedHash = hashApiKey(provided)
    return timingSafeEqual(
      Buffer.from(providedHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    )
  } catch {
    return false
  }
}

export const PLAN_APP_LIMITS: Record<string, number> = {
  developer: 10,
  growth: 30,
  scale: 100,
}