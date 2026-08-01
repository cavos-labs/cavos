import { createHash, randomBytes, timingSafeEqual } from 'crypto'

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function tokenMatches(token: string, expectedHash: string | null): boolean {
  if (!expectedHash) return false
  const actual = Buffer.from(tokenHash(token), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function bearer(request: Request): string | null {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7)
}

export function sha256Base64url(...parts: Uint8Array[]): string {
  const hash = createHash('sha256')
  for (const part of parts) hash.update(part)
  return hash.digest('base64url')
}
