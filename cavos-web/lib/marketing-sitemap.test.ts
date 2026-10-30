import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { COMPARE_PAGES_MODIFIED, COMPETITORS } from './compare-data'
import { DYNAMIC_ALTERNATIVES_MODIFIED } from './dynamic-alternatives'
import { EMBEDDED_WALLET_MODIFIED } from './embedded-wallet-guide'
import { MAGIC_ALTERNATIVES_MODIFIED } from './magic-alternatives'
import { PRIVY_ALTERNATIVES_MODIFIED } from './privy-alternatives'
import { TURNKEY_ALTERNATIVES_MODIFIED } from './turnkey-alternatives'
import {
  MARKETING_HOME_URL,
  MARKETING_ORIGIN,
  PRICING_SITEMAP_MODIFIED,
  getMarketingSitemapEntries,
  gitLastModifiedForFile,
  isBlogPostNoindex,
  lastModifiedForPath,
  parseBlogFrontmatter,
  publishedBlogPosts,
  sitemapPageFile,
} from './marketing-sitemap'
import { AUTH_NOINDEX_PATHS } from './marketing-seo'

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
      '/privy-alternatives',
      '/turnkey-alternatives',
      '/dynamic-alternatives',
      '/magic-alternatives',
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
      const expected =
        routePath === '/' ? MARKETING_HOME_URL : `${MARKETING_ORIGIN}${routePath}`
      assert.ok(urls.includes(expected), `sitemap missing ${routePath}`)
    }
  })

  it('uses the trailing-slash homepage URL Google stores as canonical', () => {
    assert.equal(MARKETING_HOME_URL, 'https://cavos.xyz/')
    assert.equal(urls.includes(MARKETING_HOME_URL), true)
    assert.equal(urls.includes(MARKETING_ORIGIN), false)
    assert.equal(urls.includes(`${MARKETING_ORIGIN}/`), true)
  })

  it('uses git last-modified or omits lastmod rather than a fabricated fallback', () => {
    assert.doesNotMatch(SITEMAP_SOURCE, /SITEMAP_LASTMOD_FALLBACK/)
    assert.doesNotMatch(SITEMAP_SOURCE, /new Date\(\s*\)/)

    const withDates = entries.filter((entry) => entry.lastModified)
    for (const entry of withDates) {
      assert.ok(entry.lastModified instanceof Date, `invalid lastModified for ${entry.url}`)
      assert.equal(Number.isNaN(entry.lastModified.getTime()), false)
    }
    if (withDates.length > 1) {
      const stamps = withDates.map((entry) => entry.lastModified!.toISOString())
      assert.equal(new Set(stamps).size > 1, true)
    }

    const homeGit = lastModifiedForPath('/')
    const home = entries.find((entry) => entry.url === MARKETING_HOME_URL)
    assert.ok(home)
    if (homeGit) {
      assert.ok(home.lastModified instanceof Date)
      assert.equal(home.lastModified.toISOString(), homeGit.toISOString())
    } else {
      assert.equal(home.lastModified, undefined)
    }

    const walletGit = gitLastModifiedForFile(sitemapPageFile('/embedded-wallet'))
    const walletLastmod = lastModifiedForPath('/embedded-wallet')
    assert.deepEqual(walletLastmod, walletGit)
  })

  it('maps each static route to a page file without a fake lastmod fallback', () => {
    const staticPaths = [
      '/',
      '/embedded-wallet',
      '/embedded-stellar-wallet',
      '/embedded-solana-wallet',
      '/embedded-starknet-wallet',
      '/compare',
      '/privy-alternatives',
      '/turnkey-alternatives',
      '/dynamic-alternatives',
      '/magic-alternatives',
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
    for (const routePath of staticPaths) {
      assert.equal(hasPage(routePath), true)
      assert.ok(sitemapPageFile(routePath).endsWith('page.tsx'))
    }
    assert.equal(sitemapPageFile('/compare/privy'), 'app/compare/[slug]/page.tsx')
  })

  it('lists /embedded-wallet and /pricing with the content dateModified', () => {
    const wallet = entries.find(
      (item) => item.url === `${MARKETING_ORIGIN}/embedded-wallet`,
    )
    assert.ok(wallet)
    assert.ok(wallet.lastModified instanceof Date)
    assert.equal(
      wallet.lastModified.toISOString().slice(0, 10),
      EMBEDDED_WALLET_MODIFIED,
    )
    const pricing = entries.find(
      (item) => item.url === `${MARKETING_ORIGIN}/pricing`,
    )
    assert.ok(pricing)
    assert.ok(pricing.lastModified instanceof Date)
    assert.equal(
      pricing.lastModified.toISOString().slice(0, 10),
      PRICING_SITEMAP_MODIFIED,
    )
  })

  it('lists compare pages with the content dateModified', () => {
    for (const competitor of COMPETITORS) {
      const entry = entries.find(
        (item) => item.url === `${MARKETING_ORIGIN}/compare/${competitor.slug}`,
      )
      assert.ok(entry, `sitemap missing /compare/${competitor.slug}`)
      assert.ok(entry.lastModified instanceof Date)
      assert.equal(
        entry.lastModified.toISOString().slice(0, 10),
        COMPARE_PAGES_MODIFIED,
      )
    }
  })

  it('lists /privy-alternatives with the content dateModified', () => {
    const entry = entries.find(
      (item) => item.url === `${MARKETING_ORIGIN}/privy-alternatives`,
    )
    assert.ok(entry)
    assert.ok(entry.lastModified instanceof Date)
    assert.equal(
      entry.lastModified.toISOString().slice(0, 10),
      PRIVY_ALTERNATIVES_MODIFIED,
    )
  })

  it('lists Turnkey, Dynamic, and Magic alternatives with the content dateModified', () => {
    const expected = [
      ['/turnkey-alternatives', TURNKEY_ALTERNATIVES_MODIFIED],
      ['/dynamic-alternatives', DYNAMIC_ALTERNATIVES_MODIFIED],
      ['/magic-alternatives', MAGIC_ALTERNATIVES_MODIFIED],
    ] as const
    for (const [routePath, modified] of expected) {
      const entry = entries.find(
        (item) => item.url === `${MARKETING_ORIGIN}${routePath}`,
      )
      assert.ok(entry, `sitemap missing ${routePath}`)
      assert.ok(entry.lastModified instanceof Date)
      assert.equal(entry.lastModified.toISOString().slice(0, 10), modified)
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
    assert.equal(isBlogPostNoindex('how-to-add-an-embedded-wallet'), false)
    assert.equal(isBlogPostNoindex('embedded-wallet-vs-browser-extension'), false)
    assert.equal(isBlogPostNoindex('stellar-embedded-wallet-tutorial'), false)
    assert.equal(isBlogPostNoindex('gasless-starknet-transactions'), false)
    assert.equal(isBlogPostNoindex('embedded-wallet-providers'), false)
    assert.equal(isBlogPostNoindex('privy-vs-turnkey'), false)
    assert.equal(isBlogPostNoindex('embedded-wallet-api'), false)
    assert.equal(isBlogPostNoindex('non-custodial-embedded-wallet'), false)
    assert.equal(isBlogPostNoindex('wallet-as-a-service'), false)
    assert.equal(isBlogPostNoindex('embedded-wallet-react-sdk'), false)
    assert.equal(isBlogPostNoindex('alchemy-vs-privy'), false)
    assert.equal(isBlogPostNoindex('cavos-kit-0-5-0'), false)
    assert.equal(
      urls.includes(`${MARKETING_ORIGIN}/blog/v1-1-9-sdk-security`),
      false,
    )
    assert.equal(
      urls.includes(`${MARKETING_ORIGIN}/blog/how-to-add-an-embedded-wallet`),
      true,
    )
    assert.equal(
      urls.includes(
        `${MARKETING_ORIGIN}/blog/embedded-wallet-vs-browser-extension`,
      ),
      true,
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

    const providers = publishedBlogPosts().find(
      (item) => item.slug === 'embedded-wallet-providers',
    )
    const privy = publishedBlogPosts().find(
      (item) => item.slug === 'privy-vs-turnkey',
    )
    assert.ok(providers)
    assert.ok(privy)
    assert.equal(providers.lastModified.toISOString().startsWith('2026-10-30'), true)
    assert.equal(privy.lastModified.toISOString().startsWith('2026-10-30'), true)

    const reactSdk = publishedBlogPosts().find(
      (item) => item.slug === 'embedded-wallet-react-sdk',
    )
    const alchemyVsPrivy = publishedBlogPosts().find(
      (item) => item.slug === 'alchemy-vs-privy',
    )
    assert.ok(reactSdk)
    assert.ok(alchemyVsPrivy)
    assert.equal(reactSdk.lastModified.toISOString().startsWith('2026-10-30'), true)
    assert.equal(
      alchemyVsPrivy.lastModified.toISOString().startsWith('2026-10-30'),
      true,
    )
  })

  it('keeps the indexable marketing URLs including the React integration guide', () => {
    assert.equal(entries.length, 42)
    assert.ok(
      urls.includes(`${MARKETING_ORIGIN}/blog/how-to-add-an-embedded-wallet`),
    )
    assert.ok(
      urls.includes(
        `${MARKETING_ORIGIN}/blog/embedded-wallet-vs-browser-extension`,
      ),
    )
    assert.ok(
      urls.includes(
        `${MARKETING_ORIGIN}/blog/stellar-embedded-wallet-tutorial`,
      ),
    )
    assert.ok(
      urls.includes(`${MARKETING_ORIGIN}/blog/gasless-starknet-transactions`),
    )
    assert.ok(
      urls.includes(`${MARKETING_ORIGIN}/blog/embedded-wallet-providers`),
    )
    assert.ok(urls.includes(`${MARKETING_ORIGIN}/blog/privy-vs-turnkey`))
    assert.ok(urls.includes(`${MARKETING_ORIGIN}/blog/embedded-wallet-api`))
    assert.ok(
      urls.includes(`${MARKETING_ORIGIN}/blog/non-custodial-embedded-wallet`),
    )
    assert.ok(urls.includes(`${MARKETING_ORIGIN}/blog/wallet-as-a-service`))
    assert.ok(
      urls.includes(`${MARKETING_ORIGIN}/blog/embedded-wallet-react-sdk`),
    )
    assert.ok(urls.includes(`${MARKETING_ORIGIN}/blog/alchemy-vs-privy`))
    assert.ok(urls.includes(`${MARKETING_ORIGIN}/blog/cavos-kit-0-5-0`))
    for (const slug of ['best-embedded-wallets-stellar', 'best-embedded-wallets-solana', 'best-embedded-wallets-starknet']) {
      assert.ok(urls.includes(`${MARKETING_ORIGIN}/blog/${slug}`))
    }
    assert.equal(
      urls.includes(`${MARKETING_ORIGIN}/blog/v1-1-9-sdk-security`),
      false,
    )
  })

  it('keeps legal pages at low priority and omits noindex routes from the list', () => {
    const legal = ['/privacy', '/dpa', '/user-privacy', '/user-terms', '/terms']
    for (const routePath of legal) {
      const entry = entries.find((item) => item.url === `${MARKETING_ORIGIN}${routePath}`)
      assert.ok(entry, `sitemap missing legal page ${routePath}`)
      assert.ok(entry.priority <= 0.3, `${routePath} priority ${entry.priority} is not low`)
    }
  })

  it('omits auth, dashboard, and noindex utility routes', () => {
    const omitted = [
      ...AUTH_NOINDEX_PATHS,
      '/dashboard',
      '/apps',
    ]
    for (const routePath of omitted) {
      assert.equal(
        urls.includes(`${MARKETING_ORIGIN}${routePath}`),
        false,
        `sitemap should not include ${routePath}`,
      )
    }
    assert.doesNotMatch(SITEMAP_SOURCE, /\/login|\/register|\/dashboard|\/forgot-password/)
  })
})
