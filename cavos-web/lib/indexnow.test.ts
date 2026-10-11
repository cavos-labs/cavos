import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const WEB_ROOT = process.cwd()
const PUBLIC_DIR = path.join(WEB_ROOT, 'public')
const KEY_FILE_RE = /^[0-9a-f]{32}\.txt$/

function indexNowKeyFiles(): string[] {
  return fs.readdirSync(PUBLIC_DIR).filter((name) => KEY_FILE_RE.test(name))
}

describe('IndexNow key file', () => {
  const keys = indexNowKeyFiles()

  it('publishes exactly one 32-char hex key as a static text file', () => {
    assert.equal(keys.length, 1, keys.join(', '))
    const filename = keys[0]
    const key = filename.replace(/\.txt$/, '')
    const content = fs.readFileSync(path.join(PUBLIC_DIR, filename), 'utf8')
    assert.equal(key.length, 32)
    assert.match(key, /^[0-9a-f]{32}$/)
    assert.equal(content, key)
  })

  it('lets /.txt files skip middleware and stay text/plain', () => {
    const middleware = fs.readFileSync(path.join(WEB_ROOT, 'middleware.ts'), 'utf8')
    assert.match(middleware, /webp\|txt/)
    assert.match(middleware, /pathname\.endsWith\('\.txt'\)/)

    const nextConfig = fs.readFileSync(path.join(WEB_ROOT, 'next.config.ts'), 'utf8')
    assert.match(nextConfig, /source: "\/:file\.txt"/)
    assert.match(nextConfig, /text\/plain; charset=utf-8/)
  })

  it('does not add runtime IndexNow pinging', () => {
    const scanned = [
      'middleware.ts',
      'next.config.ts',
      'app/sitemap.ts',
      'lib/marketing-sitemap.ts',
    ]
    for (const relative of scanned) {
      const source = fs.readFileSync(path.join(WEB_ROOT, relative), 'utf8')
      assert.doesNotMatch(source, /api\.indexnow\.org|indexnow\.org\/indexnow/i)
    }
  })
})
