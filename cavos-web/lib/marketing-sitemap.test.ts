import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { COMPETITORS } from './compare-data'
import {
  MARKETING_ORIGIN,
  getMarketingSitemapEntries,
} from './marketing-sitemap'

const APP_DIR = path.join(process.cwd(), 'app')

function hasPage(routePath: string): boolean {
  if (routePath === '/') {
    return fs.existsSync(path.join(APP_DIR, 'page.tsx'))
  }
  return fs.existsSync(path.join(APP_DIR, routePath.slice(1), 'page.tsx'))
}

describe('marketing sitemap', () => {
  const entries = getMarketingSitemapEntries()
  const urls = entries.map((entry) => entry.url)

  it('returns a non-empty list of absolute https URLs', () => {
    assert.ok(entries.length > 0)
    for (const entry of entries) {
      assert.match(entry.url, /^https:\/\//)
      assert.ok(entry.priority >= 0 && entry.priority <= 1)
    }
  })

  it('does not invent duplicate URLs', () => {
    assert.equal(urls.length, new Set(urls).size)
  })

  it('includes the public marketing pages that exist in the app router', () => {
    const requiredPaths = [
      '/',
      '/embedded-stellar-wallet',
      '/embedded-solana-wallet',
      '/embedded-starknet-wallet',
      '/compare',
      '/custody',
      '/pricing',
      '/stats',
      '/contact-sales',
      '/blog',
      '/privacy',
      '/dpa',
      '/user-privacy',
      '/user-terms',
      '/terms',
    ]

    for (const routePath of requiredPaths) {
      assert.equal(hasPage(routePath), true, `missing page for ${routePath}`)
      assert.ok(
        urls.includes(`${MARKETING_ORIGIN}${routePath === '/' ? '' : routePath}`),
        `sitemap missing ${routePath}`,
      )
    }
  })

  it('includes each competitor compare page from live data', () => {
    assert.ok(COMPETITORS.length > 0)
    assert.equal(
      hasPage('/compare/[slug]'),
      true,
      'missing compare/[slug] page',
    )
    for (const competitor of COMPETITORS) {
      assert.ok(
        urls.includes(`${MARKETING_ORIGIN}/compare/${competitor.slug}`),
        `sitemap missing /compare/${competitor.slug}`,
      )
    }
  })

  it('omits auth, dashboard, and noindex utility routes', () => {
    const omitted = [
      '/login',
      '/register',
      '/dashboard',
      '/forgot-password',
      '/verification-error',
      '/blog/v1-1-9-sdk-security',
    ]
    for (const routePath of omitted) {
      assert.equal(
        urls.includes(`${MARKETING_ORIGIN}${routePath}`),
        false,
        `sitemap should not include ${routePath}`,
      )
    }
  })
})
