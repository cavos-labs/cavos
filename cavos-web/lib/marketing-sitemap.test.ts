import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { COMPETITORS } from './compare-data'
import {
  MARKETING_ORIGIN,
  getMarketingSitemapEntries,
  isBlogPostNoindex,
  parseBlogFrontmatter,
  publishedBlogPosts,
} from './marketing-sitemap'

const APP_DIR = path.join(process.cwd(), 'app')
const SITEMAP_SOURCE = fs.readFileSync(
  path.join(process.cwd(), 'lib/marketing-sitemap.ts'),
  'utf8',
)

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

  it('only includes cavos.xyz URLs', () => {
    for (const entry of entries) {
      assert.match(entry.url, /^https:\/\/cavos\.xyz(\/|$)/)
    }
    assert.equal(
      urls.some((url) => url.includes('demo.cavos.xyz') || url.includes('docs.cavos.xyz')),
      false,
    )
  })

  it('includes the public marketing pages that exist in the app router', () => {
    const requiredPaths = [
      '/',
      '/embedded-wallet',
      '/embedded-stellar-wallet',
      '/embedded-solana-wallet',
      '/embedded-starknet-wallet',
      '/compare',
      '/custody',
      '/pricing',
      '/stats',
      '/contact-sales',
      '/about',
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

  it('includes every indexable blog post from the content source with a lastModified date', () => {
    const posts = publishedBlogPosts()
    assert.ok(posts.length > 0, 'expected blog MDX files on disk')

    const indexable = posts.filter((post) => !isBlogPostNoindex(post.slug))
    for (const post of indexable) {
      const entry = entries.find(
        (item) => item.url === `${MARKETING_ORIGIN}/blog/${post.slug}`,
      )
      assert.ok(entry, `sitemap missing /blog/${post.slug}`)
      assert.ok(entry.lastModified instanceof Date)
      assert.equal(Number.isNaN(entry.lastModified.getTime()), false)
    }
  })

  it('omits noindex blog posts using the same helper as robots meta', () => {
    assert.equal(isBlogPostNoindex('v1-1-9-sdk-security'), true)
    assert.equal(isBlogPostNoindex('a-future-indexable-post'), false)
    assert.equal(
      urls.includes(`${MARKETING_ORIGIN}/blog/v1-1-9-sdk-security`),
      false,
    )

    const pageSource = fs.readFileSync(
      path.join(process.cwd(), 'app/blog/[slug]/page.tsx'),
      'utf8',
    )
    assert.match(pageSource, /isBlogPostNoindex/)
    assert.doesNotMatch(pageSource, /slug === ['"]v1-1-9-sdk-security['"]/)
  })

  it('reads lastModified from frontmatter dates without an MDX parser', () => {
    const parsed = parseBlogFrontmatter(`---
title: "Example"
date: "2025-03-30"
slug: "example"
---

Hello
`)
    assert.equal(parsed.date, '2025-03-30')
    assert.doesNotMatch(SITEMAP_SOURCE, /from ['"]gray-matter['"]|from ['"]next-mdx-remote/)

    const post = publishedBlogPosts().find(
      (item) => item.slug === 'v1-1-9-sdk-security',
    )
    assert.ok(post)
    assert.equal(post.lastModified.toISOString().startsWith('2025-03-30'), true)
  })

  it('omits auth, dashboard, and noindex utility routes', () => {
    const omitted = [
      '/login',
      '/register',
      '/dashboard',
      '/forgot-password',
      '/verification-error',
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
