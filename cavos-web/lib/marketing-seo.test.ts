import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { blogOgImageUrl, blogOgVersion } from './blog-og-version'
import {
  ABOUT_DESCRIPTION,
  ABOUT_PATH,
  ABOUT_TITLE,
  AUTH_NOINDEX_PATHS,
  FRAMEZZ_GALLERIES_ID,
  FRAMEZZ_GALLERIES_URL,
  FRAMEZZ_ID,
  FRAMEZZ_URL,
  HOME_DESCRIPTION,
  HOME_TITLE,
  NOINDEX_FOLLOW,
  FOUNDER_NAME,
  FOUNDER_SAME_AS,
  ORGANIZATION_DESCRIPTION,
  ORGANIZATION_SAME_AS,
  OFFER_AVAILABILITY,
  ORGANIZATION_ID,
  SOFTWARE_ID,
  PRICING_DESCRIPTION,
  PRICING_FAQ,
  PRICING_PATH,
  PRICING_TITLE,
  SOLANA_WALLET_DESCRIPTION,
  SOLANA_WALLET_FAQ,
  SOLANA_WALLET_PATH,
  SOLANA_WALLET_TITLE,
  STARKNET_WALLET_DESCRIPTION,
  STARKNET_WALLET_FAQ,
  STARKNET_WALLET_PATH,
  STARKNET_WALLET_TITLE,
  STELLAR_WALLET_DESCRIPTION,
  STELLAR_WALLET_FAQ,
  STELLAR_WALLET_PATH,
  STELLAR_WALLET_TITLE,
  WEBSITE_ID,
  aboutPageJsonLd,
  blogPostJsonLd,
  breadcrumbListJsonLd,
  chainWalletPageJsonLd,
  guidePageJsonLd,
  cavosProductApplicationsJsonLd,
  compareCompetitorPageJsonLd,
  compareIndexJsonLd,
  freeTierOfferJsonLd,
  homepageJsonLd,
  marketingPageMetadata,
  noindexFollowMetadata,
  organizationJsonLd,
  pricingPageJsonLd,
  sitewideJsonLd,
  walletSoftwareApplicationJsonLd,
} from './marketing-seo'
import {
  CHAIN_WALLET_MODIFIED,
  CHAIN_WALLET_PUBLISHED,
  SOLANA_FAQ,
  STARKNET_FAQ,
  STELLAR_FAQ,
} from './chain-wallet-pages'
import {
  DOCS_URLS,
  EMBEDDED_WALLET_DEFINITION,
  EMBEDDED_WALLET_DESCRIPTION,
  EMBEDDED_WALLET_FAQ,
  EMBEDDED_WALLET_HOW_IT_WORKS,
  EMBEDDED_WALLET_HOW_TO,
  EMBEDDED_WALLET_INTEGRATION_PATH,
  EMBEDDED_WALLET_INTEGRATION_TITLE,
  EMBEDDED_WALLET_MODIFIED,
  EMBEDDED_WALLET_PATH,
  EMBEDDED_WALLET_PUBLISHED,
  EMBEDDED_WALLET_TITLE,
  EMBEDDED_WALLET_API_PATH,
  EMBEDDED_WALLET_API_TITLE,
  NON_CUSTODIAL_EMBEDDED_WALLET_PATH,
  NON_CUSTODIAL_EMBEDDED_WALLET_TITLE,
  EMBEDDED_WALLET_PROVIDERS_PATH,
  EMBEDDED_WALLET_PROVIDERS_TITLE,
  EMBEDDED_WALLET_VS_EXTENSION_PATH,
  EMBEDDED_WALLET_VS_EXTENSION_TITLE,
  PRIVY_VS_TURNKEY_PATH,
  PRIVY_VS_TURNKEY_TITLE,
  STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH,
  STELLAR_EMBEDDED_WALLET_TUTORIAL_TITLE,
  GASLESS_STARKNET_TRANSACTIONS_PATH,
  GASLESS_STARKNET_TRANSACTIONS_TITLE,
  WALLET_AS_A_SERVICE_PATH,
  WALLET_AS_A_SERVICE_TITLE,
  EMBEDDED_WALLET_REACT_SDK_PATH,
  EMBEDDED_WALLET_REACT_SDK_TITLE,
  ALCHEMY_VS_PRIVY_PATH,
  ALCHEMY_VS_PRIVY_TITLE,
} from './embedded-wallet-guide'
import {
  COMPETITORS,
  EMBEDDED_WALLET_MARKET_NOTE,
  embeddedWalletProviderRows,
  getCompetitor,
} from './compare-data'
import {
  DYNAMIC_ALTERNATIVE_SECTIONS,
  DYNAMIC_ALTERNATIVES_CRUMB,
  DYNAMIC_ALTERNATIVES_DESCRIPTION,
  DYNAMIC_ALTERNATIVES_FAQ,
  DYNAMIC_ALTERNATIVES_H1,
  DYNAMIC_ALTERNATIVES_MODIFIED,
  DYNAMIC_ALTERNATIVES_PATH,
  DYNAMIC_ALTERNATIVES_PUBLISHED,
  DYNAMIC_ALTERNATIVES_TITLE,
  DYNAMIC_HOW_TO_CHOOSE,
  DYNAMIC_WHY_LOOK,
  dynamicAlternativesItemList,
} from './dynamic-alternatives'
import {
  MAGIC_ALTERNATIVE_SECTIONS,
  MAGIC_ALTERNATIVES_CRUMB,
  MAGIC_ALTERNATIVES_DESCRIPTION,
  MAGIC_ALTERNATIVES_FAQ,
  MAGIC_ALTERNATIVES_H1,
  MAGIC_ALTERNATIVES_MODIFIED,
  MAGIC_ALTERNATIVES_PATH,
  MAGIC_ALTERNATIVES_PUBLISHED,
  MAGIC_ALTERNATIVES_TITLE,
  MAGIC_HOW_TO_CHOOSE,
  MAGIC_WHY_LOOK,
  magicAlternativesItemList,
} from './magic-alternatives'
import {
  PRIVY_ALTERNATIVE_SECTIONS,
  PRIVY_ALTERNATIVES_CRUMB,
  PRIVY_ALTERNATIVES_DESCRIPTION,
  PRIVY_ALTERNATIVES_FAQ,
  PRIVY_ALTERNATIVES_H1,
  PRIVY_ALTERNATIVES_MODIFIED,
  PRIVY_ALTERNATIVES_PATH,
  PRIVY_ALTERNATIVES_PUBLISHED,
  PRIVY_ALTERNATIVES_TITLE,
  PRIVY_HOW_TO_CHOOSE,
  PRIVY_WHY_LOOK,
  privyAlternativesItemList,
} from './privy-alternatives'
import {
  TURNKEY_ALTERNATIVE_SECTIONS,
  TURNKEY_ALTERNATIVES_CRUMB,
  TURNKEY_ALTERNATIVES_DESCRIPTION,
  TURNKEY_ALTERNATIVES_FAQ,
  TURNKEY_ALTERNATIVES_H1,
  TURNKEY_ALTERNATIVES_MODIFIED,
  TURNKEY_ALTERNATIVES_PATH,
  TURNKEY_ALTERNATIVES_PUBLISHED,
  TURNKEY_ALTERNATIVES_TITLE,
  TURNKEY_HOW_TO_CHOOSE,
  TURNKEY_WHY_LOOK,
  turnkeyAlternativesItemList,
} from './turnkey-alternatives'
import { parseBlogFrontmatter } from './marketing-sitemap'

const PRODUCT_LIKE_TYPES = new Set(['Product', 'SoftwareApplication'])

function jsonLdTypes(node: { '@type'?: string | string[] }): string[] {
  const type = node['@type']
  if (!type) return []
  return Array.isArray(type) ? type : [type]
}

function walkJsonLdNodes(
  value: unknown,
  out: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') return out
  if (Array.isArray(value)) {
    for (const item of value) walkJsonLdNodes(item, out)
    return out
  }
  const rec = value as Record<string, unknown>
  if (rec['@type']) out.push(rec)
  for (const [key, child] of Object.entries(rec)) {
    if (key === '@context') continue
    walkJsonLdNodes(child, out)
  }
  return out
}

function assertProductLikeOffers(node: Record<string, unknown>, label: string) {
  const types = jsonLdTypes(node)
  if (!types.some((type) => PRODUCT_LIKE_TYPES.has(type))) return
  if (!('offers' in node) || node.offers == null) return
  const offers = Array.isArray(node.offers) ? node.offers : [node.offers]
  assert.ok(offers.length > 0, `${label} has empty offers`)
  for (const offer of offers) {
    assert.equal(typeof offer, 'object', `${label} offer is not an object`)
    assert.ok(offer && typeof offer === 'object')
    const fields = offer as Record<string, unknown>
    assert.ok(
      fields.price !== undefined && fields.price !== '',
      `${label} missing offers.price`,
    )
    assert.equal(typeof fields.priceCurrency, 'string', `${label} missing offers.priceCurrency`)
    assert.ok(String(fields.priceCurrency).length > 0, `${label} empty offers.priceCurrency`)
    assert.ok(
      fields.availability === 'https://schema.org/InStock' ||
        fields.availability === 'https://schema.org/OnlineOnly',
      `${label} missing offers.availability (InStock or OnlineOnly)`,
    )
  }
}

describe('marketing SEO', () => {
  it('builds complete Open Graph and Twitter tags with a canonical URL', () => {
    const meta = marketingPageMetadata({
      title: 'Embedded Wallet Pricing',
      description: 'Flat monthly fees for multichain embedded wallets.',
      path: '/pricing',
    })

    assert.equal(meta.title, 'Embedded Wallet Pricing')
    assert.equal(meta.alternates?.canonical, 'https://cavos.xyz/pricing')
    assert.equal(meta.openGraph?.url, 'https://cavos.xyz/pricing')
    assert.equal(meta.openGraph?.type, 'website')
    assert.equal(meta.openGraph?.title, 'Embedded Wallet Pricing | Cavos')
    assert.ok(Array.isArray(meta.openGraph?.images) && meta.openGraph.images.length > 0)
    assert.equal(meta.twitter?.card, 'summary_large_image')
    assert.equal(meta.twitter?.title, 'Embedded Wallet Pricing | Cavos')
  })

  it('uses an absolute homepage title so the layout template does not double Cavos', () => {
    const home = marketingPageMetadata({
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      path: '/',
    })
    assert.deepEqual(home.title, { absolute: HOME_TITLE })
    assert.equal(home.openGraph?.title, HOME_TITLE)
    assert.equal(home.twitter?.title, HOME_TITLE)
    assert.equal(home.description, HOME_DESCRIPTION)
    assert.equal(home.openGraph?.description, HOME_DESCRIPTION)
    assert.equal(home.twitter?.description, HOME_DESCRIPTION)
    assert.equal(HOME_TITLE.includes('| Cavos'), false)
    assert.equal(home.alternates?.canonical, 'https://cavos.xyz/')
    assert.equal(home.openGraph?.url, 'https://cavos.xyz/')
  })

  it('keeps a single Cavos in the homepage title within search limits', () => {
    assert.ok(HOME_TITLE.length > 0 && HOME_TITLE.length <= 60)
    assert.ok(HOME_DESCRIPTION.length > 0 && HOME_DESCRIPTION.length <= 155)
    assert.match(HOME_TITLE, /^Cavos/)
    assert.match(HOME_DESCRIPTION, /^Cavos/)
    assert.equal((HOME_TITLE.match(/Cavos/g) ?? []).length, 1)
    assert.doesNotMatch(HOME_DESCRIPTION, /—/)
  })

  it('does not invent a homepage canonical for other routes', () => {
    const meta = marketingPageMetadata({
      title: 'Privacy Policy',
      description: 'How Cavos collects and uses data.',
      path: '/privacy',
    })
    assert.notEqual(meta.alternates?.canonical, 'https://cavos.xyz')
  })

  it('exposes Organization and SoftwareApplication JSON-LD without ratings or traffic figures', () => {
    const data = homepageJsonLd()
    const json = JSON.stringify(data)
    JSON.parse(json)

    assert.match(json, /"@type":"Organization"/)
    assert.match(json, /"@type":"WebSite"/)
    assert.match(json, /"@type":"SoftwareApplication"/)
    assert.match(json, /Cavos, LLC/)
    assert.match(json, /Starknet/)
    assert.match(json, /Solana/)
    assert.match(json, /Stellar/)
    assert.doesNotMatch(json, /aggregateRating/)
    assert.doesNotMatch(json, /userCount|ratingValue|downloadCount/i)

    const org = data['@graph'][0]
    assert.equal(org['@type'], 'Organization')
    assert.equal(org['@id'], ORGANIZATION_ID)

    const website = data['@graph'].find(
      (node: { '@type'?: string }) => node['@type'] === 'WebSite',
    )
    assert.ok(website)
    assert.equal(website['@id'], WEBSITE_ID)
    assert.equal(website.name, 'Cavos')
    assert.equal(website.url, 'https://cavos.xyz')
    assert.equal(website.publisher['@id'], ORGANIZATION_ID)
    assert.deepEqual(org.sameAs, [...ORGANIZATION_SAME_AS])
    assert.equal(org.legalName, 'Cavos, LLC')
    assert.equal(org.founder['@type'], 'Person')
    assert.equal(org.founder.name, FOUNDER_NAME)
    assert.deepEqual(org.founder.sameAs, [...FOUNDER_SAME_AS])
    assert.equal(org.sameAs.includes('https://x.com/0xAdrianvrj'), false)
    assert.equal(org.description, ORGANIZATION_DESCRIPTION)
    assert.match(org.description, /software and SaaS/i)
    assert.equal(org.brand.length, 3)
    assert.deepEqual(
      org.brand.map((brand: { name: string; url: string }) => ({
        type: 'Brand',
        name: brand.name,
        url: brand.url,
      })),
      [
        { type: 'Brand', name: 'Cavos', url: 'https://cavos.xyz' },
        { type: 'Brand', name: 'Framezz', url: FRAMEZZ_URL },
        { type: 'Brand', name: 'Framezz Galleries', url: FRAMEZZ_GALLERIES_URL },
      ],
    )
    assert.deepEqual(org.owns, [
      { '@id': SOFTWARE_ID },
      { '@id': FRAMEZZ_ID },
      { '@id': FRAMEZZ_GALLERIES_ID },
    ])
    const ids = new Set(
      data['@graph']
        .map((node: { '@id'?: string }) => node['@id'])
        .filter(Boolean),
    )
    for (const owned of org.owns) {
      assert.equal(ids.has(owned['@id']), true, `owns target missing: ${owned['@id']}`)
    }

    const wallet = data['@graph'].find(
      (node: { '@id'?: string }) => node['@id'] === SOFTWARE_ID,
    )
    assert.ok(wallet)
    assert.equal(wallet['@type'], 'SoftwareApplication')
    assert.equal(wallet['@id'], SOFTWARE_ID)
    assert.equal(wallet.name, 'Cavos')
    assert.equal(wallet.alternateName, '@cavos/kit')
    assert.equal(wallet.url, 'https://cavos.xyz')
    assert.equal(wallet.operatingSystem, 'Web, iOS, Android')
    assert.equal(wallet.applicationCategory, 'DeveloperApplication')
    assert.equal(wallet.applicationSubCategory, 'Embedded multichain wallet infrastructure')
    assert.equal(wallet.offers.price, '0')
    assert.equal(wallet.offers.priceCurrency, 'USD')
    assert.equal(wallet.offers.availability, OFFER_AVAILABILITY)
    assert.equal(wallet.author['@id'], ORGANIZATION_ID)

    const framezz = data['@graph'].find((node: { '@id'?: string }) => node['@id'] === FRAMEZZ_ID)
    const galleries = data['@graph'].find(
      (node: { '@id'?: string }) => node['@id'] === FRAMEZZ_GALLERIES_ID,
    )
    assert.ok(framezz)
    assert.ok(galleries)
    assert.equal(framezz['@type'], 'Brand')
    assert.equal(framezz.name, 'Framezz')
    assert.equal(framezz.url, FRAMEZZ_URL)
    assert.equal(galleries['@type'], 'Brand')
    assert.equal(galleries.name, 'Framezz Galleries')
    assert.equal(galleries.url, FRAMEZZ_GALLERIES_URL)
    assert.equal('offers' in framezz, false)
    assert.equal('offers' in galleries, false)
  })

  it('keeps layout and homepage Organization nodes on the same @id', () => {
    const layoutOrg = organizationJsonLd('customer support', { includeBrands: false })
    const homeOrg = organizationJsonLd('sales')
    assert.equal(layoutOrg['@id'], ORGANIZATION_ID)
    assert.equal(homeOrg['@id'], ORGANIZATION_ID)
    assert.equal(layoutOrg.description, homeOrg.description)
    assert.equal(layoutOrg.legalName, homeOrg.legalName)
    assert.deepEqual(layoutOrg.founder, homeOrg.founder)
    assert.deepEqual(layoutOrg.sameAs, homeOrg.sameAs)
    assert.equal('brand' in layoutOrg, false)
    assert.equal(homeOrg.brand.length, 3)
    assert.deepEqual(layoutOrg.owns, homeOrg.owns)
    assert.equal(layoutOrg.contactPoint.contactType, 'customer support')
    assert.equal(homeOrg.contactPoint.contactType, 'sales')
  })

  it('omits Brand nodes and the wallet Offer from the sitewide graph', () => {
    const data = sitewideJsonLd()
    const json = JSON.stringify(data)
    JSON.parse(json)
    const types = data['@graph'].map((node: { '@type'?: string }) => node['@type'])
    assert.deepEqual(types, ['Organization', 'WebSite'])
    assert.doesNotMatch(json, /"@type":"Brand"/)
    assert.doesNotMatch(json, /"@type":"Offer"/)
    assert.doesNotMatch(json, /"@type":"SoftwareApplication"/)
    assert.equal(data['@graph'][0]['@id'], ORGANIZATION_ID)
    assert.equal('brand' in data['@graph'][0], false)
    assert.equal(data['@graph'][0].legalName, 'Cavos, LLC')
    assert.equal(data['@graph'][0].founder.name, FOUNDER_NAME)
  })

  it('builds AboutPage and BreadcrumbList JSON-LD for /about', () => {
    const meta = marketingPageMetadata({
      title: ABOUT_TITLE,
      description: ABOUT_DESCRIPTION,
      path: ABOUT_PATH,
    })
    assert.equal(meta.title, ABOUT_TITLE)
    assert.equal(ABOUT_TITLE.includes('| Cavos'), false)
    assert.equal(meta.alternates?.canonical, 'https://cavos.xyz/about')
    assert.equal(
      meta.openGraph?.title,
      'About Cavos: Embedded Wallet SDK for Starknet, Solana & Stellar | Cavos',
    )
    assert.match(ABOUT_TITLE, /Embedded Wallet SDK/)
    assert.match(ABOUT_TITLE, /Starknet/)
    assert.match(ABOUT_TITLE, /Solana/)
    assert.match(ABOUT_TITLE, /Stellar/)
    assert.ok(ABOUT_TITLE.length > 0 && ABOUT_TITLE.length <= 70)
    assert.ok(ABOUT_DESCRIPTION.length > 0 && ABOUT_DESCRIPTION.length <= 155)

    const data = aboutPageJsonLd()
    const json = JSON.stringify(data)
    JSON.parse(json)

    const page = data['@graph'].find(
      (node: { '@type'?: string }) => node['@type'] === 'AboutPage',
    )
    assert.ok(page)
    assert.equal(page.url, 'https://cavos.xyz/about')
    assert.equal(page.name, ABOUT_TITLE)
    assert.equal(page.description, ABOUT_DESCRIPTION)
    assert.equal(page.about['@id'], ORGANIZATION_ID)
    assert.equal(page.mainEntity['@id'], ORGANIZATION_ID)

    const crumbs = data['@graph'].find(
      (node: { '@type'?: string }) => node['@type'] === 'BreadcrumbList',
    )
    assert.ok(crumbs)
    assert.equal(crumbs.itemListElement[0].item, 'https://cavos.xyz/')
    assert.equal(crumbs.itemListElement[1].name, 'About')
    assert.equal(crumbs.itemListElement[1].item, 'https://cavos.xyz/about')

    assert.ok(data['@graph'].some((node: { '@type'?: string }) => node['@type'] === 'Organization'))
    assert.ok(
      data['@graph'].some((node: { '@type'?: string }) => node['@type'] === 'SoftwareApplication'),
    )
    assert.equal(
      data['@graph'].filter((node: { '@type'?: string }) => node['@type'] === 'Brand').length,
      2,
    )
    assert.match(json, /"@type":"Offer"/)
  })

  it('builds Article JSON-LD that references the organization node by @id', () => {
    const data = blogPostJsonLd({
      title: 'v1.1.9 — Cartridge Slot Support & Security Hardening',
      description: 'Native Cartridge Slot integration.',
      path: '/blog/v1-1-9-sdk-security',
      datePublished: '2025-03-30',
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: 'v1.1.9 — Cartridge Slot Support & Security Hardening', path: '/blog/v1-1-9-sdk-security' },
      ],
    })

    const json = JSON.stringify(data)
    JSON.parse(json)

    const posting = data['@graph'][0]
    assert.equal(posting['@type'], 'Article')
    assert.equal(posting.headline, 'v1.1.9 — Cartridge Slot Support & Security Hardening')
    assert.equal(posting.description, 'Native Cartridge Slot integration.')
    assert.equal(posting.datePublished, '2025-03-30')
    assert.equal(posting.dateModified, '2025-03-30')
    assert.equal(posting.image, 'https://cavos.xyz/og-image.png')
    assert.equal(posting.url, 'https://cavos.xyz/blog/v1-1-9-sdk-security')
    assert.equal(posting.mainEntityOfPage['@id'], 'https://cavos.xyz/blog/v1-1-9-sdk-security')
    assert.equal(posting.publisher['@id'], ORGANIZATION_ID)
    assert.equal(posting.author['@id'], ORGANIZATION_ID)
    assert.doesNotMatch(json, /"legalName":"Cavos, LLC"/)
    assert.doesNotMatch(json, /"@type":"Organization"[^}]*"logo"/)

    const crumbs = data['@graph'][1]
    assert.equal(crumbs['@type'], 'BreadcrumbList')
    assert.deepEqual(
      crumbs.itemListElement.map((item: { name: string; item: string; position: number }) => ({
        position: item.position,
        name: item.name,
        item: item.item,
      })),
      [
        { position: 1, name: 'Home', item: 'https://cavos.xyz/' },
        { position: 2, name: 'Blog', item: 'https://cavos.xyz/blog' },
        {
          position: 3,
          name: 'v1.1.9 — Cartridge Slot Support & Security Hardening',
          item: 'https://cavos.xyz/blog/v1-1-9-sdk-security',
        },
      ],
    )
  })

  it('builds absolute-URL breadcrumbs for compare and chain pages', () => {
    const compare = breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Compare', path: '/compare' },
      { name: 'Cavos vs Privy', path: '/compare/privy' },
    ])
    assert.equal(compare.itemListElement[0].item, 'https://cavos.xyz/')
    assert.equal(compare.itemListElement[1].item, 'https://cavos.xyz/compare')
    assert.equal(compare.itemListElement[2].item, 'https://cavos.xyz/compare/privy')

    const alternatives = breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Compare', path: '/compare' },
      { name: 'Privy wallet alternatives', path: '/privy-alternatives' },
    ])
    assert.equal(alternatives.itemListElement[2].item, 'https://cavos.xyz/privy-alternatives')
    assert.equal(alternatives.itemListElement[2].name, 'Privy wallet alternatives')

    const chain = breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Embedded Stellar Wallet', path: '/embedded-stellar-wallet' },
    ])
    assert.equal(chain.itemListElement[1].item, 'https://cavos.xyz/embedded-stellar-wallet')
    JSON.parse(JSON.stringify({ '@context': 'https://schema.org', ...chain }))
  })

  it('keeps the embedded-wallet guide title and description inside search limits', () => {
    assert.ok(EMBEDDED_WALLET_TITLE.length > 0)
    assert.ok(EMBEDDED_WALLET_TITLE.length <= 60)
    assert.match(EMBEDDED_WALLET_TITLE, /Embedded Wallets: What They Are/)
    assert.match(EMBEDDED_WALLET_TITLE, /API & SDK/)
    assert.ok(`${EMBEDDED_WALLET_TITLE} | Cavos`.length <= 60)
    assert.ok(EMBEDDED_WALLET_DESCRIPTION.length > 0)
    assert.ok(EMBEDDED_WALLET_DESCRIPTION.length <= 155)
    assert.match(EMBEDDED_WALLET_DESCRIPTION, /[Ee]mbedded wallets/)
    assert.match(EMBEDDED_WALLET_DESCRIPTION, /API/)
    assert.match(EMBEDDED_WALLET_DESCRIPTION, /SDK/)
    assert.match(EMBEDDED_WALLET_DESCRIPTION, /wallet-as-a-service/)
    assert.match(EMBEDDED_WALLET_DESCRIPTION, /non-custodial/)
    assert.match(EMBEDDED_WALLET_DESCRIPTION, /payments/)
    assert.equal(EMBEDDED_WALLET_PATH, '/embedded-wallet')
    const definitionWords = EMBEDDED_WALLET_DEFINITION.trim().split(/\s+/).length
    assert.ok(definitionWords >= 40 && definitionWords <= 60, definitionWords)
    assert.ok(EMBEDDED_WALLET_FAQ.length >= 8 && EMBEDDED_WALLET_FAQ.length <= 12)
    assert.ok(EMBEDDED_WALLET_FAQ.some((item) => item.question === 'What is an embedded wallet SDK?'))
    assert.ok(EMBEDDED_WALLET_FAQ.some((item) => item.question === 'What is an embedded wallet API?'))
    assert.ok(
      EMBEDDED_WALLET_FAQ.some((item) => item.question === 'What is an embedded wallet as a service?'),
    )
    assert.ok(EMBEDDED_WALLET_FAQ.some((item) => item.question === 'What are embedded wallet providers?'))
    assert.ok(
      EMBEDDED_WALLET_FAQ.some((item) => item.question === 'What is a non-custodial embedded wallet?'),
    )
    assert.ok(
      EMBEDDED_WALLET_FAQ.some(
        (item) => item.question === 'Which chains does Cavos support for embedded wallets?',
      ),
    )
    assert.ok(
      EMBEDDED_WALLET_FAQ.some((item) => item.question === 'What are embedded wallet payments?'),
    )
    assert.equal(EMBEDDED_WALLET_MODIFIED, '2026-10-30')
  })

  it('keeps a single H1 and adds how-it-works plus a compare-data provider table', () => {
    assert.deepEqual(
      EMBEDDED_WALLET_HOW_IT_WORKS.map((step) => step.title),
      ['Sign in', 'Key creation', 'Signing', 'Recovery'],
    )

    const rows = embeddedWalletProviderRows()
    assert.deepEqual(
      rows.map((row) => row.slug),
      ['cavos', ...COMPETITORS.map((competitor) => competitor.slug)],
    )
    assert.deepEqual(
      rows.map((row) => row.href),
      ['/pricing', ...COMPETITORS.map((competitor) => `/compare/${competitor.slug}`)],
    )
    for (const row of rows) {
      assert.ok(row.pricing.length > 0, `${row.slug} missing pricing`)
      assert.ok(row.chains.length > 0, `${row.slug} missing chains`)
      assert.ok(row.keyModel.length > 0, `${row.slug} missing key model`)
    }
    assert.match(rows[0].keyModel, /audited OpenZeppelin AccountUpgradeable/)
    assert.equal(
      rows.find((row) => row.slug === 'web3auth')?.name,
      'Web3Auth / MetaMask Embedded Wallets',
    )

    const pageSource = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-wallet/page.tsx'),
      'utf8',
    )
    assert.equal((pageSource.match(/<h1[\s>]/g) ?? []).length, 1)
    assert.equal((pageSource.match(/application\/ld\+json/g) ?? []).length, 1)
    assert.match(pageSource, /How an embedded wallet works/)
    assert.match(pageSource, /embeddedWalletProviderRows/)
    assert.match(pageSource, /\/privy-alternatives/)
    assert.match(pageSource, /guidePageJsonLd/)
    assert.match(pageSource, /EMBEDDED_WALLET_FAQ/)
    assert.match(pageSource, /Pricing and free tier/)
    assert.match(pageSource, /Key model/)
    assert.match(pageSource, /audited OpenZeppelin account contract/)
    assert.match(pageSource, /AccountUpgradeable v3\.0\.0/)
    assert.match(pageSource, /EMBEDDED_WALLET_MARKET_NOTE/)
    assert.match(EMBEDDED_WALLET_MARKET_NOTE, /Stripe acquired Privy/)
    assert.match(EMBEDDED_WALLET_MARKET_NOTE, /Fireblocks acquired Dynamic/)
    assert.match(EMBEDDED_WALLET_MARKET_NOTE, /Consensys acquired Web3Auth/)
    assert.match(EMBEDDED_WALLET_MARKET_NOTE, /Payward/)
    assert.doesNotMatch(pageSource, /on-chain approval/)
    assert.doesNotMatch(pageSource, /This device must be approved first/)
    assert.doesNotMatch(pageSource, /audited Cavos/)
    const headings = [...pageSource.matchAll(/<h[12][^>]*>\s*([^<]+)/g)].map(
      (match) => match[1].trim(),
    )
    assert.ok(headings.includes('Embedded wallets'))
    assert.ok(headings.includes('What is an embedded wallet?'))
    assert.ok(headings.includes('How an embedded wallet works'))
    assert.ok(headings.includes('Embedded wallet API and SDK'))
    assert.ok(headings.includes('Embedded wallet payments'))
    assert.ok(headings.includes('Embedded wallet vs browser extension'))
    assert.ok(headings.includes('Embedded wallet pricing'))
    assert.ok(headings.includes('Gas Sponsorship in Any Token'))
    assert.ok(headings.includes('How to integrate an embedded wallet'))
    assert.ok(headings.includes('Embedded wallet provider comparison'))
    assert.match(pageSource, /EMBEDDED_WALLET_DEFINITION/)
    assert.match(pageSource, /Free up to 1,000 wallets/)
    assert.match(pageSource, /Essential \$59\/month/)
    assert.match(pageSource, /Complete \$139\/month/)
    assert.match(pageSource, /href=["']\/compare["']/)
    assert.doesNotMatch(pageSource, /Horizon signer/)
    assert.doesNotMatch(pageSource, /grandfathered/)
    assert.match(pageSource, /href=["']\/embedded-starknet-wallet["']/)
    assert.match(pageSource, /href=["']\/embedded-solana-wallet["']/)
    assert.match(pageSource, /href=["']\/embedded-stellar-wallet["']/)
    assert.match(pageSource, /GASLESS_STARKNET_TRANSACTIONS_PATH/)
    assert.match(pageSource, /href=["']\/pricing["']/)
    assert.match(pageSource, /EMBEDDED_WALLET_INTEGRATION_PATH/)
    assert.match(pageSource, /EMBEDDED_WALLET_VS_EXTENSION_PATH/)
    assert.match(pageSource, /EMBEDDED_WALLET_API_PATH/)
    assert.match(pageSource, /NON_CUSTODIAL_EMBEDDED_WALLET_PATH/)
    assert.match(pageSource, /WALLET_AS_A_SERVICE_PATH/)
    assert.match(pageSource, /PRIVY_VS_TURNKEY_PATH/)
    assert.match(pageSource, /Related guides/)
    assert.match(pageSource, /embedded wallet vs browser extension/)
    assert.match(pageSource, /step-by-step integration guide/)
    for (const heading of headings) {
      assert.doesNotMatch(heading, /—/)
    }
  })

  it('links the homepage body copy to the embedded-wallet guide and compare index', () => {
    const features = fs.readFileSync(
      path.join(process.cwd(), 'components/landing/FeaturesGrid.tsx'),
      'utf8',
    )
    assert.match(
      features,
      /href="\/embedded-wallet"[^>]*>\s*embedded wallet\s*</,
    )
    assert.match(features, /Start with what an/)
    assert.match(features, /href="\/compare"/)
    assert.match(features, /title="Gas Sponsorship in Any Token"/)
    assert.doesNotMatch(features, /Gas sponsorship built in/)
    const home = fs.readFileSync(path.join(process.cwd(), 'app/page.tsx'), 'utf8')
    assert.match(home, /path: '\/'/)
    assert.doesNotMatch(home, /<h1[\s\S]*embedded wallet/i)
  })

  it('keeps the Privy alternatives title and description inside search limits', () => {
    assert.equal(PRIVY_ALTERNATIVES_PATH, '/privy-alternatives')
    assert.equal(PRIVY_ALTERNATIVES_TITLE.includes('| Cavos'), false)
    assert.match(PRIVY_ALTERNATIVES_TITLE, /Privy Alternatives/)
    assert.match(PRIVY_ALTERNATIVES_TITLE, /Competitors/)
    assert.match(PRIVY_ALTERNATIVES_TITLE, /2026/)
    assert.match(PRIVY_ALTERNATIVES_H1, /What are some alternatives to Privy/)
    assert.match(PRIVY_ALTERNATIVES_DESCRIPTION, /Shopify/)
    assert.match(PRIVY_ALTERNATIVES_DESCRIPTION, /alternatives to Privy/)
    assert.match(PRIVY_ALTERNATIVES_DESCRIPTION, /Privy competitors/)
    assert.match(PRIVY_ALTERNATIVES_DESCRIPTION, /Cavos, Dynamic, Turnkey, Web3Auth, Magic/)
    assert.match(PRIVY_ALTERNATIVES_DESCRIPTION, /1,000 wallets/)
    const fullTitle = `${PRIVY_ALTERNATIVES_TITLE} | Cavos`
    assert.ok(fullTitle.length >= 50 && fullTitle.length <= 60, fullTitle)
    assert.ok(
      PRIVY_ALTERNATIVES_DESCRIPTION.length >= 140 &&
        PRIVY_ALTERNATIVES_DESCRIPTION.length <= 155,
      String(PRIVY_ALTERNATIVES_DESCRIPTION.length),
    )
    assert.ok(PRIVY_ALTERNATIVES_FAQ.length >= 5 && PRIVY_ALTERNATIVES_FAQ.length <= 8)
    assert.ok(
      PRIVY_ALTERNATIVES_FAQ.some(
        (item) => item.question === 'What is the best Privy alternative?',
      ),
    )
    assert.ok(
      PRIVY_ALTERNATIVES_FAQ.some(
        (item) => item.question === 'Is there a free Privy alternative?',
      ),
    )
    assert.ok(
      PRIVY_ALTERNATIVES_FAQ.some((item) =>
        /Starknet, Solana, or Stellar/.test(item.question),
      ),
    )
    assert.ok(
      PRIVY_ALTERNATIVES_FAQ.some(
        (item) => item.question === 'What are some alternatives to Privy?',
      ),
    )
    assert.ok(
      PRIVY_ALTERNATIVES_FAQ.some((item) => item.question === 'Who are Privy competitors?'),
    )
    assert.ok(PRIVY_WHY_LOOK.length >= 4)
    assert.ok(PRIVY_HOW_TO_CHOOSE.length >= 5)
    assert.deepEqual(
      PRIVY_ALTERNATIVE_SECTIONS.map((section) => section.name),
      ['Cavos', 'Dynamic', 'Turnkey', 'Web3Auth', 'Magic'],
    )
    assert.deepEqual(
      PRIVY_ALTERNATIVE_SECTIONS.map((section) => section.href),
      [
        '/compare/privy',
        '/compare/dynamic',
        '/compare/turnkey',
        '/compare/web3auth',
        '/compare/magic',
      ],
    )
    assert.equal(PRIVY_ALTERNATIVES_PUBLISHED, '2026-10-11')
    assert.equal(PRIVY_ALTERNATIVES_MODIFIED, '2026-10-30')
    assert.equal(PRIVY_ALTERNATIVES_CRUMB, 'Privy alternatives')

    const meta = marketingPageMetadata({
      title: PRIVY_ALTERNATIVES_TITLE,
      description: PRIVY_ALTERNATIVES_DESCRIPTION,
      path: PRIVY_ALTERNATIVES_PATH,
      type: 'article',
      publishedTime: PRIVY_ALTERNATIVES_PUBLISHED,
      modifiedTime: PRIVY_ALTERNATIVES_MODIFIED,
    })
    assert.equal(meta.title, PRIVY_ALTERNATIVES_TITLE)
    assert.equal(meta.alternates?.canonical, 'https://cavos.xyz/privy-alternatives')
    assert.equal(meta.openGraph?.title, fullTitle)
    assert.equal(meta.openGraph?.url, 'https://cavos.xyz/privy-alternatives')
    assert.equal(meta.openGraph?.type, 'article')
    assert.equal(meta.openGraph?.modifiedTime, PRIVY_ALTERNATIVES_MODIFIED)
    assert.equal(meta.twitter?.card, 'summary_large_image')
    assert.equal(meta.twitter?.title, fullTitle)
    assert.equal(meta.twitter?.description, PRIVY_ALTERNATIVES_DESCRIPTION)

    const jsonLd = guidePageJsonLd({
      title: PRIVY_ALTERNATIVES_TITLE,
      description: PRIVY_ALTERNATIVES_DESCRIPTION,
      path: PRIVY_ALTERNATIVES_PATH,
      datePublished: PRIVY_ALTERNATIVES_PUBLISHED,
      dateModified: PRIVY_ALTERNATIVES_MODIFIED,
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Compare', path: '/compare' },
        { name: PRIVY_ALTERNATIVES_CRUMB, path: PRIVY_ALTERNATIVES_PATH },
      ],
      faq: [...PRIVY_ALTERNATIVES_FAQ],
      itemList: privyAlternativesItemList(),
    })
    JSON.parse(JSON.stringify(jsonLd))
    assert.equal(jsonLd['@graph'][0]['@type'], 'Article')
    assert.equal(jsonLd['@graph'][0].dateModified, PRIVY_ALTERNATIVES_MODIFIED)
    assert.equal(jsonLd['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(jsonLd['@graph'][1].itemListElement[2].name, 'Privy alternatives')
    assert.equal(jsonLd['@graph'][2]['@type'], 'FAQPage')
    assert.equal(jsonLd['@graph'][2].mainEntity.length, PRIVY_ALTERNATIVES_FAQ.length)
    assert.deepEqual(
      jsonLd['@graph'][2].mainEntity.map((item: { name: string }) => item.name),
      PRIVY_ALTERNATIVES_FAQ.map((item) => item.question),
    )
    const alternativesList = jsonLd['@graph'].find(
      (node: { '@type'?: string }) => node['@type'] === 'ItemList',
    )
    assert.ok(alternativesList)
    assert.equal(alternativesList['@id'], 'https://cavos.xyz/privy-alternatives#itemlist')
    assert.deepEqual(
      alternativesList.itemListElement.map((item: { name: string; url: string; position: number }) => ({
        position: item.position,
        name: item.name,
        url: item.url,
      })),
      [
        { position: 1, name: 'Cavos', url: 'https://cavos.xyz/compare/privy' },
        { position: 2, name: 'Dynamic', url: 'https://cavos.xyz/compare/dynamic' },
        { position: 3, name: 'Turnkey', url: 'https://cavos.xyz/compare/turnkey' },
        { position: 4, name: 'Web3Auth', url: 'https://cavos.xyz/compare/web3auth' },
        { position: 5, name: 'Magic', url: 'https://cavos.xyz/compare/magic' },
      ],
    )
    assert.doesNotMatch(JSON.stringify(jsonLd), /"@type":"Product"/)

    const pageSource = fs.readFileSync(
      path.join(process.cwd(), 'app/privy-alternatives/page.tsx'),
      'utf8',
    )
    const templateSource = fs.readFileSync(
      path.join(process.cwd(), 'components/AlternativesGuidePage.tsx'),
      'utf8',
    )
    const dataSource = fs.readFileSync(
      path.join(process.cwd(), 'lib/privy-alternatives.ts'),
      'utf8',
    )
    assert.match(pageSource, /privyAlternativesGuide/)
    assert.match(pageSource, /AlternativesGuidePage/)
    assert.match(templateSource, /guidePageJsonLd/)
    assert.match(templateSource, /embeddedWalletProviderRows/)
    assert.match(templateSource, /relatedLinks/)
    assert.match(dataSource, /href: '\/pricing'/)
    assert.match(dataSource, /Why teams look for a Privy alternative/)
    assert.match(dataSource, /How to choose a Privy alternative/)
    assert.match(
      dataSource,
      /Cavos, Dynamic, Turnkey, Web3Auth, and Magic are the five Privy/,
    )
    assert.equal((templateSource.match(/<h1[\s>]/g) ?? []).length, 1)

    const cavos = PRIVY_ALTERNATIVE_SECTIONS[0]
    assert.deepEqual(
      (cavos.relatedLinks ?? []).map((link) => link.href),
      [
        '/embedded-starknet-wallet',
        '/embedded-solana-wallet',
        '/embedded-stellar-wallet',
        '/blog/how-to-add-an-embedded-wallet',
        '/blog/embedded-wallet-api',
        '/blog/non-custodial-embedded-wallet',
        '/blog/embedded-wallet-providers',
        '/blog/wallet-as-a-service',
      ],
    )
    assert.match(dataSource, /audited OpenZeppelin account contract/)
    assert.match(dataSource, /Privy vs Turnkey/)
    assert.doesNotMatch(dataSource, /audited Cavos/)
    assert.doesNotMatch(dataSource, /on-chain device approval/)
    assert.doesNotMatch(dataSource, /Cavos custom/)

    const compareSource = fs.readFileSync(
      path.join(process.cwd(), 'app/compare/[slug]/page.tsx'),
      'utf8',
    )
    assert.match(
      compareSource,
      /href="\/privy-alternatives"[^>]*>\s*Privy alternatives\s*</,
    )
    const compareIndex = fs.readFileSync(
      path.join(process.cwd(), 'app/compare/page.tsx'),
      'utf8',
    )
    assert.match(
      compareIndex,
      /href="\/privy-alternatives"[^>]*>\s*Privy alternatives\s*</,
    )
    const embeddedWallet = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-wallet/page.tsx'),
      'utf8',
    )
    assert.match(
      embeddedWallet,
      /href="\/privy-alternatives"[^>]*>\s*Privy alternatives\s*</,
    )
    assert.match(compareSource, /PRIVY_VS_TURNKEY_PATH/)
    assert.match(dataSource, /PRIVY_VS_TURNKEY_PATH/)
    const turnkey = PRIVY_ALTERNATIVE_SECTIONS.find((section) => section.name === 'Turnkey')
    assert.ok(turnkey)
    assert.deepEqual(
      (turnkey.relatedLinks ?? []).map((link) => link.href),
      [PRIVY_VS_TURNKEY_PATH, '/turnkey-alternatives'],
    )
    const dynamic = PRIVY_ALTERNATIVE_SECTIONS.find((section) => section.name === 'Dynamic')
    assert.ok(dynamic)
    assert.deepEqual(
      (dynamic.relatedLinks ?? []).map((link) => link.href),
      [EMBEDDED_WALLET_VS_EXTENSION_PATH, '/dynamic-alternatives'],
    )
    const magic = PRIVY_ALTERNATIVE_SECTIONS.find((section) => section.name === 'Magic')
    assert.ok(magic)
    assert.deepEqual(
      (magic.relatedLinks ?? []).map((link) => link.href),
      ['/magic-alternatives'],
    )
    assert.match(compareSource, /href="\/turnkey-alternatives"/)
    assert.match(compareSource, /href="\/dynamic-alternatives"/)
    assert.match(compareSource, /href="\/magic-alternatives"/)
    assert.match(compareIndex, /href="\/turnkey-alternatives"/)
    assert.match(embeddedWallet, /href="\/turnkey-alternatives"/)

    const privy = getCompetitor('privy')
    assert.ok(privy)
    assert.match(privy.pageTitle ?? '', /Privy vs Cavos \(2026\): Pricing, Chains, Review/)
    assert.match(privy.pageH1 ?? '', /Privy vs Cavos: pricing, chains, and custody/)
    assert.doesNotMatch(privy.pageTitle ?? '', /alternative/i)
    assert.doesNotMatch(privy.pageH1 ?? '', /alternative/i)
    assert.match(privy.pageDescription ?? '', /Privy wallet alternative/)
    assert.match(privy.pageDescription ?? '', /Shopify/)
    assert.match(privy.pageDescription ?? '', /1,000 wallets/)
    assert.match(privy.summary, /Privy vs Cavos/)
    const comparePrivyIntro = fs.readFileSync(
      path.join(process.cwd(), 'app/compare/[slug]/page.tsx'),
      'utf8',
    )
    assert.match(comparePrivyIntro, /Privy vs Cavos/)
    assert.match(comparePrivyIntro, /Privy alternative/)
    assert.match(privy.rows.find((row) => row.feature === 'Account model')?.cavos ?? '', /audited OpenZeppelin/i)
    assert.doesNotMatch(JSON.stringify(privy.rows), /PDA/)
  })

  it('replicates the Privy alternatives template for Turnkey, Dynamic, and Magic', () => {
    const guides = [
      {
        incumbent: 'Turnkey',
        path: TURNKEY_ALTERNATIVES_PATH,
        title: TURNKEY_ALTERNATIVES_TITLE,
        description: TURNKEY_ALTERNATIVES_DESCRIPTION,
        h1: TURNKEY_ALTERNATIVES_H1,
        published: TURNKEY_ALTERNATIVES_PUBLISHED,
        modified: TURNKEY_ALTERNATIVES_MODIFIED,
        crumb: TURNKEY_ALTERNATIVES_CRUMB,
        faq: TURNKEY_ALTERNATIVES_FAQ,
        whyLook: TURNKEY_WHY_LOOK,
        howToChoose: TURNKEY_HOW_TO_CHOOSE,
        sections: TURNKEY_ALTERNATIVE_SECTIONS,
        itemList: turnkeyAlternativesItemList(),
        pageFile: 'app/turnkey-alternatives/page.tsx',
        dataFile: 'lib/turnkey-alternatives.ts',
        names: ['Cavos', 'Privy', 'Dynamic', 'Web3Auth', 'Magic'],
        hrefs: [
          '/compare/turnkey',
          '/compare/privy',
          '/compare/dynamic',
          '/compare/web3auth',
          '/compare/magic',
        ],
        itemListUrls: [
          { position: 1, name: 'Cavos', url: 'https://cavos.xyz/compare/turnkey' },
          { position: 2, name: 'Privy', url: 'https://cavos.xyz/compare/privy' },
          { position: 3, name: 'Dynamic', url: 'https://cavos.xyz/compare/dynamic' },
          { position: 4, name: 'Web3Auth', url: 'https://cavos.xyz/compare/web3auth' },
          { position: 5, name: 'Magic', url: 'https://cavos.xyz/compare/magic' },
        ],
        fiveLead: 'Cavos, Privy, Dynamic, Web3Auth, and Magic are the five Turnkey',
        comparePath: '/compare/turnkey',
      },
      {
        incumbent: 'Dynamic',
        path: DYNAMIC_ALTERNATIVES_PATH,
        title: DYNAMIC_ALTERNATIVES_TITLE,
        description: DYNAMIC_ALTERNATIVES_DESCRIPTION,
        h1: DYNAMIC_ALTERNATIVES_H1,
        published: DYNAMIC_ALTERNATIVES_PUBLISHED,
        modified: DYNAMIC_ALTERNATIVES_MODIFIED,
        crumb: DYNAMIC_ALTERNATIVES_CRUMB,
        faq: DYNAMIC_ALTERNATIVES_FAQ,
        whyLook: DYNAMIC_WHY_LOOK,
        howToChoose: DYNAMIC_HOW_TO_CHOOSE,
        sections: DYNAMIC_ALTERNATIVE_SECTIONS,
        itemList: dynamicAlternativesItemList(),
        pageFile: 'app/dynamic-alternatives/page.tsx',
        dataFile: 'lib/dynamic-alternatives.ts',
        names: ['Cavos', 'Privy', 'Turnkey', 'Web3Auth', 'Magic'],
        hrefs: [
          '/compare/dynamic',
          '/compare/privy',
          '/compare/turnkey',
          '/compare/web3auth',
          '/compare/magic',
        ],
        itemListUrls: [
          { position: 1, name: 'Cavos', url: 'https://cavos.xyz/compare/dynamic' },
          { position: 2, name: 'Privy', url: 'https://cavos.xyz/compare/privy' },
          { position: 3, name: 'Turnkey', url: 'https://cavos.xyz/compare/turnkey' },
          { position: 4, name: 'Web3Auth', url: 'https://cavos.xyz/compare/web3auth' },
          { position: 5, name: 'Magic', url: 'https://cavos.xyz/compare/magic' },
        ],
        fiveLead: 'Cavos, Privy, Turnkey, Web3Auth, and Magic are the five Dynamic',
        comparePath: '/compare/dynamic',
      },
      {
        incumbent: 'Magic',
        path: MAGIC_ALTERNATIVES_PATH,
        title: MAGIC_ALTERNATIVES_TITLE,
        description: MAGIC_ALTERNATIVES_DESCRIPTION,
        h1: MAGIC_ALTERNATIVES_H1,
        published: MAGIC_ALTERNATIVES_PUBLISHED,
        modified: MAGIC_ALTERNATIVES_MODIFIED,
        crumb: MAGIC_ALTERNATIVES_CRUMB,
        faq: MAGIC_ALTERNATIVES_FAQ,
        whyLook: MAGIC_WHY_LOOK,
        howToChoose: MAGIC_HOW_TO_CHOOSE,
        sections: MAGIC_ALTERNATIVE_SECTIONS,
        itemList: magicAlternativesItemList(),
        pageFile: 'app/magic-alternatives/page.tsx',
        dataFile: 'lib/magic-alternatives.ts',
        names: ['Cavos', 'Privy', 'Dynamic', 'Turnkey', 'Web3Auth'],
        hrefs: [
          '/compare/magic',
          '/compare/privy',
          '/compare/dynamic',
          '/compare/turnkey',
          '/compare/web3auth',
        ],
        itemListUrls: [
          { position: 1, name: 'Cavos', url: 'https://cavos.xyz/compare/magic' },
          { position: 2, name: 'Privy', url: 'https://cavos.xyz/compare/privy' },
          { position: 3, name: 'Dynamic', url: 'https://cavos.xyz/compare/dynamic' },
          { position: 4, name: 'Turnkey', url: 'https://cavos.xyz/compare/turnkey' },
          { position: 5, name: 'Web3Auth', url: 'https://cavos.xyz/compare/web3auth' },
        ],
        fiveLead: 'Cavos, Privy, Dynamic, Turnkey, and Web3Auth are the five Magic',
        comparePath: '/compare/magic',
      },
    ] as const

    const templateSource = fs.readFileSync(
      path.join(process.cwd(), 'components/AlternativesGuidePage.tsx'),
      'utf8',
    )
    assert.match(templateSource, /guidePageJsonLd/)
    assert.match(templateSource, /FAQPage|faq/)
    assert.equal((templateSource.match(/<h1[\s>]/g) ?? []).length, 1)

    for (const guide of guides) {
      assert.equal(guide.path, `/${guide.incumbent.toLowerCase()}-alternatives`)
      assert.equal(guide.title.includes('| Cavos'), false)
      assert.match(guide.title, new RegExp(`${guide.incumbent} Alternatives`))
      assert.match(guide.title, /2026/)
      if (guide.incumbent === 'Turnkey') {
        assert.match(guide.title, /Competitors/)
        assert.match(guide.h1, /Turnkey alternatives and embedded wallet competitors/)
        assert.match(guide.description, /embedded wallet competitors/)
        assert.match(guide.description, /Turnkey vs Privy/)
        assert.equal(guide.modified, '2026-10-30')
        assert.ok(
          guide.faq.some(
            (item) => item.question === 'Who are Turnkey embedded wallet competitors?',
          ),
        )
        assert.ok(guide.faq.some((item) => item.question === 'What is Turnkey vs Privy?'))
      } else {
        assert.match(guide.title, new RegExp(`5 ${guide.incumbent} Alternatives`))
        assert.match(guide.title, /Free 1,000 Wallets/)
        assert.match(guide.h1, new RegExp(`5 ${guide.incumbent} alternatives`))
        assert.match(guide.description, /Starknet, Solana, Stellar/)
        assert.equal(guide.modified, '2026-10-27')
      }
      assert.match(guide.description, /1,000 wallets/)
      const fullTitle = `${guide.title} | Cavos`
      assert.ok(fullTitle.length >= 50 && fullTitle.length <= 60, fullTitle)
      assert.ok(
        guide.description.length >= 140 && guide.description.length <= 155,
        `${guide.incumbent} description ${guide.description.length}`,
      )
      assert.ok(guide.faq.length >= 5 && guide.faq.length <= 8)
      assert.ok(
        guide.faq.some(
          (item) => item.question === `What is the best ${guide.incumbent} alternative?`,
        ),
      )
      assert.ok(
        guide.faq.some(
          (item) => item.question === `Is there a free ${guide.incumbent} alternative?`,
        ),
      )
      assert.ok(
        guide.faq.some((item) => /Starknet, Solana, or Stellar/.test(item.question)),
      )
      assert.ok(guide.whyLook.length >= 4)
      assert.ok(guide.howToChoose.length >= 5)
      assert.deepEqual(
        guide.sections.map((section) => section.name),
        [...guide.names],
      )
      assert.deepEqual(
        guide.sections.map((section) => section.href),
        [...guide.hrefs],
      )
      assert.equal(guide.published, '2026-10-27')
      assert.equal(guide.crumb, `${guide.incumbent} alternatives`)

      const jsonLd = guidePageJsonLd({
        title: guide.title,
        description: guide.description,
        path: guide.path,
        datePublished: guide.published,
        dateModified: guide.modified,
        crumbs: [
          { name: 'Home', path: '/' },
          { name: 'Compare', path: '/compare' },
          { name: guide.crumb, path: guide.path },
        ],
        faq: [...guide.faq],
        itemList: guide.itemList,
      })
      JSON.parse(JSON.stringify(jsonLd))
      assert.equal(jsonLd['@graph'][0]['@type'], 'Article')
      assert.equal(jsonLd['@graph'][1]['@type'], 'BreadcrumbList')
      assert.equal(jsonLd['@graph'][2]['@type'], 'FAQPage')
      const alternativesList = jsonLd['@graph'].find(
        (node: { '@type'?: string }) => node['@type'] === 'ItemList',
      )
      assert.ok(alternativesList)
      assert.equal(
        alternativesList['@id'],
        `https://cavos.xyz${guide.path}#itemlist`,
      )
      assert.deepEqual(
        alternativesList.itemListElement.map(
          (item: { name: string; url: string; position: number }) => ({
            position: item.position,
            name: item.name,
            url: item.url,
          }),
        ),
        [...guide.itemListUrls],
      )
      assert.doesNotMatch(JSON.stringify(jsonLd), /"@type":"Product"/)

      const pageSource = fs.readFileSync(
        path.join(process.cwd(), guide.pageFile),
        'utf8',
      )
      const dataSource = fs.readFileSync(
        path.join(process.cwd(), guide.dataFile),
        'utf8',
      )
      assert.match(pageSource, /AlternativesGuidePage/)
      assert.match(dataSource, new RegExp(guide.fiveLead))
      assert.match(dataSource, /href: '\/privy-alternatives'/)
      assert.match(dataSource, new RegExp(`href: '${guide.comparePath}'`))
      assert.match(dataSource, /audited OpenZeppelin account contract/)
      assert.match(dataSource, /Gas Sponsorship in Any Token/)
      assert.doesNotMatch(dataSource, /audited Cavos/)
      assert.doesNotMatch(dataSource, /on-chain device approval/)
      assert.doesNotMatch(dataSource, /grandfather/)
      assert.doesNotMatch(dataSource, /Horizon signer/)
      const cavos = guide.sections[0]
      assert.equal(cavos.href, guide.comparePath)
      assert.match(cavos.paragraphs.join(' '), /audited OpenZeppelin/)
      const privySection = guide.sections.find((section) => section.name === 'Privy')
      assert.ok(privySection)
      assert.ok(
        (privySection.relatedLinks ?? []).some(
          (link) => link.href === '/privy-alternatives',
        ),
      )
    }
  })

  it('builds Article, BreadcrumbList, and FAQPage JSON-LD for the guide', () => {
    const data = guidePageJsonLd({
      title: EMBEDDED_WALLET_TITLE,
      description: EMBEDDED_WALLET_DESCRIPTION,
      path: EMBEDDED_WALLET_PATH,
      datePublished: EMBEDDED_WALLET_PUBLISHED,
      dateModified: EMBEDDED_WALLET_MODIFIED,
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'What is an embedded wallet', path: EMBEDDED_WALLET_PATH },
      ],
      faq: [...EMBEDDED_WALLET_FAQ],
      howTo: EMBEDDED_WALLET_HOW_TO,
    })

    const json = JSON.stringify(data)
    JSON.parse(json)

    const article = data['@graph'][0]
    assert.equal(article['@type'], 'Article')
    assert.equal(article.headline, EMBEDDED_WALLET_TITLE)
    assert.equal(article.description, EMBEDDED_WALLET_DESCRIPTION)
    assert.equal(article.url, 'https://cavos.xyz/embedded-wallet')
    assert.equal(article.mainEntityOfPage['@id'], 'https://cavos.xyz/embedded-wallet')
    assert.equal(article.publisher['@id'], ORGANIZATION_ID)
    assert.equal(article.author['@id'], ORGANIZATION_ID)
    assert.equal(article.datePublished, EMBEDDED_WALLET_PUBLISHED)
    assert.equal(article.dateModified, EMBEDDED_WALLET_MODIFIED)

    const crumbs = data['@graph'][1]
    assert.equal(crumbs['@type'], 'BreadcrumbList')
    assert.equal(crumbs['@id'], 'https://cavos.xyz/embedded-wallet#breadcrumb')
    assert.equal(crumbs.itemListElement[1].item, 'https://cavos.xyz/embedded-wallet')

    const faq = data['@graph'][2]
    assert.equal(faq['@type'], 'FAQPage')
    assert.equal(faq.mainEntity.length, EMBEDDED_WALLET_FAQ.length)
    assert.equal(faq.mainEntity[0].name, EMBEDDED_WALLET_FAQ[0].question)
    assert.equal(faq.mainEntity[0].acceptedAnswer.text, EMBEDDED_WALLET_FAQ[0].answer)

    const howTo = data['@graph'][3]
    assert.equal(howTo['@type'], 'HowTo')
    assert.equal(howTo.name, EMBEDDED_WALLET_HOW_TO.name)
    assert.equal(howTo.step.length, 4)
    assert.equal(howTo.step[0].url, DOCS_URLS.auth)
    assert.equal(howTo.step[1].url, DOCS_URLS.quickstart)
    assert.equal(howTo.step[2].url, DOCS_URLS.walletActions)
    assert.equal(howTo.step[3].url, DOCS_URLS.recovery)
  })

  it('rewrites chain page titles for CTR and query coverage inside snippet bounds', () => {
    const chains = [
      {
        title: STARKNET_WALLET_TITLE,
        description: STARKNET_WALLET_DESCRIPTION,
        path: STARKNET_WALLET_PATH,
        name: 'Starknet',
        query: /Starknet Embedded Wallet/,
        expectedTitle: 'Starknet Embedded Wallet (2026): Self-Custody',
      },
      {
        title: SOLANA_WALLET_TITLE,
        description: SOLANA_WALLET_DESCRIPTION,
        path: SOLANA_WALLET_PATH,
        name: 'Solana',
        query: /Solana Embedded Wallet SDK/,
        expectedTitle: 'Solana Embedded Wallet SDK (2026): Self-Custody',
      },
      {
        title: STELLAR_WALLET_TITLE,
        description: STELLAR_WALLET_DESCRIPTION,
        path: STELLAR_WALLET_PATH,
        name: 'Stellar',
        query: /Stellar Embedded Wallet/,
        expectedTitle: 'Stellar Embedded Wallet (2026): Self-Custody',
      },
    ]

    for (const chain of chains) {
      assert.equal(chain.title, chain.expectedTitle)
      assert.match(chain.title, chain.query)
      assert.match(chain.title, /2026/)
      assert.equal(chain.title.includes('| Cavos'), false)
      const fullTitle = `${chain.title} | Cavos`
      assert.ok(
        fullTitle.length <= 60,
        `${chain.name} SERP title length ${fullTitle.length} exceeds 60: ${fullTitle}`,
      )
      assert.ok(
        chain.description.length >= 140 && chain.description.length <= 155,
        `${chain.name} description length ${chain.description.length} is outside 140-155`,
      )
      assert.match(chain.description, new RegExp(`^${chain.name} embedded wallet`, 'i'))
      assert.match(chain.description, /2026/)
      assert.doesNotMatch(chain.description, /—/)
      assert.doesNotMatch(
        chain.description,
        /seamless|powerful|unlock|revolutionary|next-gen|effortless|best-in-class/i,
      )

      const meta = marketingPageMetadata({
        title: chain.title,
        description: chain.description,
        path: chain.path,
      })
      assert.equal(meta.title, chain.title)
      assert.equal(meta.openGraph?.title, fullTitle)
      assert.equal(meta.twitter?.title, fullTitle)
      assert.equal(meta.description, chain.description)
      assert.equal(meta.openGraph?.description, chain.description)
      assert.equal(meta.twitter?.description, chain.description)
    }

    assert.match(STARKNET_WALLET_DESCRIPTION, /Audited OpenZeppelin AccountUpgradeable/)
    assert.doesNotMatch(STARKNET_WALLET_DESCRIPTION, /audited Cavos/)
    assert.match(STELLAR_WALLET_DESCRIPTION, /Gas Sponsorship in Any Token/)
    assert.match(SOLANA_WALLET_DESCRIPTION, /Solana embedded wallet SDK/)
    assert.equal(STARKNET_WALLET_FAQ.length, 4)
    assert.equal(SOLANA_WALLET_FAQ.length, 4)
    assert.equal(STELLAR_WALLET_FAQ.length, 4)
    assert.ok(
      STARKNET_WALLET_FAQ.some((item) =>
        /audited OpenZeppelin account contract/i.test(item.answer),
      ),
    )
    assert.equal(
      STARKNET_WALLET_FAQ.some((item) => /audited Cavos/i.test(`${item.question} ${item.answer}`)),
      false,
    )
    assert.equal(
      STARKNET_WALLET_FAQ.some((item) =>
        /needs-device-approval|session key/i.test(`${item.question} ${item.answer}`),
      ),
      false,
    )
    assert.ok(
      STARKNET_FAQ.some((item) => /audited OpenZeppelin account contract/i.test(item.answer)),
    )
    assert.equal(
      STARKNET_FAQ.some((item) => /audited Cavos/i.test(`${item.question} ${item.answer}`)),
      false,
    )
    assert.ok(
      STELLAR_WALLET_FAQ.some((item) => /Gas Sponsorship in Any Token/i.test(item.answer)),
    )

    const starknetPage = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-starknet-wallet/page.tsx'),
      'utf8',
    )
    assert.match(starknetPage, /STARKNET_FAQ/)
    assert.match(starknetPage, /chainWalletPageJsonLd/)
    assert.match(starknetPage, /audited OpenZeppelin account contract/)
    assert.doesNotMatch(starknetPage, /needs-device-approval/)
    assert.doesNotMatch(starknetPage, /session key|sessionKey|session-key/)
    assert.doesNotMatch(starknetPage, /audited Cavos/)
    assert.equal((starknetPage.match(/<h1[\s>]/g) ?? []).length, 1)
  })

  it('marks auth, dashboard, and not-found routes as noindex, follow', () => {
    const meta = noindexFollowMetadata('Register')
    assert.deepEqual(meta.robots, NOINDEX_FOLLOW)
    assert.equal(meta.robots?.index, false)
    assert.equal(meta.robots?.follow, true)
    assert.equal(meta.title, 'Register')

    const layoutFiles = [
      'app/register/layout.tsx',
      'app/login/layout.tsx',
      'app/forgot-password/layout.tsx',
      'app/update-password/layout.tsx',
      'app/verification-error/layout.tsx',
      'app/verification-success/layout.tsx',
      'app/setup-passkey/layout.tsx',
      'app/apps/layout.tsx',
      'app/dashboard/layout.tsx',
      'app/not-found.tsx',
    ]

    for (const relative of layoutFiles) {
      const source = fs.readFileSync(path.join(process.cwd(), relative), 'utf8')
      assert.match(source, /noindexFollowMetadata/, `missing noindex helper in ${relative}`)
      assert.doesNotMatch(source, /['"]use client['"]/)
    }

    assert.deepEqual([...AUTH_NOINDEX_PATHS], [
      '/login',
      '/register',
      '/forgot-password',
      '/update-password',
      '/verification-error',
      '/verification-success',
      '/setup-passkey',
    ])
  })

  it('emits BreadcrumbList JSON-LD on indexable marketing pages', () => {
    const pagesWithBreadcrumbs = [
      'app/compare/page.tsx',
      'components/AlternativesGuidePage.tsx',
      'app/custody/page.tsx',
      'app/pricing/page.tsx',
      'app/stats/page.tsx',
      'app/contact-sales/page.tsx',
      'app/blog/page.tsx',
      'app/privacy/page.tsx',
      'app/dpa/page.tsx',
      'app/user-privacy/page.tsx',
      'app/user-terms/page.tsx',
      'app/terms/page.tsx',
      'app/embedded-starknet-wallet/page.tsx',
      'app/embedded-solana-wallet/page.tsx',
      'app/embedded-stellar-wallet/page.tsx',
      'app/embedded-wallet/page.tsx',
      'app/about/page.tsx',
      'app/compare/[slug]/page.tsx',
      'app/blog/[slug]/page.tsx',
    ]

    for (const relative of pagesWithBreadcrumbs) {
      const source = fs.readFileSync(path.join(process.cwd(), relative), 'utf8')
      assert.match(
        source,
        /breadcrumbListJsonLd|guidePageJsonLd|aboutPageJsonLd|blogPostJsonLd|chainWalletPageJsonLd|compareIndexJsonLd|compareCompetitorPageJsonLd|pricingPageJsonLd/,
        `missing breadcrumb JSON-LD on ${relative}`,
      )
      assert.match(
        source,
        /application\/ld\+json/,
        `missing JSON-LD script on ${relative}`,
      )
    }
  })

  it('links ranking chain pages and the changelog from the shared footer', () => {
    const footer = fs.readFileSync(
      path.join(process.cwd(), 'components/Footer.tsx'),
      'utf8',
    )
    const required = [
      ['/embedded-starknet-wallet', 'Starknet wallet'],
      ['/embedded-solana-wallet', 'Solana wallet'],
      ['/embedded-stellar-wallet', 'Stellar wallet'],
      ['/blog', 'Changelog'],
      ['/privy-alternatives', 'Privy wallet alternatives'],
      ['/turnkey-alternatives', 'Turnkey wallet alternatives'],
      ['/dynamic-alternatives', 'Dynamic wallet alternatives'],
      ['/magic-alternatives', 'Magic wallet alternatives'],
      ['/embedded-wallet', 'Embedded wallet'],
      ['/blog/how-to-add-an-embedded-wallet', 'How to add an embedded wallet'],
      ['/blog/wallet-as-a-service', 'Wallet as a service'],
    ] as const

    for (const [href, label] of required) {
      assert.match(
        footer,
        new RegExp(`href="${href}"[^>]*>${label}<`),
        `footer missing ${label} -> ${href}`,
      )
    }
    assert.match(footer, /hover:text-black transition-colors/)
    const legal = [
      ['/terms', 'Terms of Service'],
      ['/privacy', 'Privacy Policy'],
      ['/dpa', 'Data Processing Agreement'],
      ['/user-terms', 'End-User Terms'],
      ['/user-privacy', 'End-User Privacy Policy'],
    ] as const
    for (const [href, label] of legal) {
      assert.match(
        footer,
        new RegExp(`<a href="${href}"[^>]*>${label}<`),
        `footer missing crawlable <a href> ${label} -> ${href}`,
      )
      assert.doesNotMatch(
        footer,
        new RegExp(`<Link href="${href}"`),
        `footer legal ${href} must be a plain <a href>, not next/link`,
      )
    }
  })

  it('gives each blog guide at least three crawlable inlinks and un-orphans legal pages', () => {
    const guides = [
      EMBEDDED_WALLET_API_PATH,
      EMBEDDED_WALLET_PROVIDERS_PATH,
      EMBEDDED_WALLET_VS_EXTENSION_PATH,
      EMBEDDED_WALLET_INTEGRATION_PATH,
      NON_CUSTODIAL_EMBEDDED_WALLET_PATH,
      PRIVY_VS_TURNKEY_PATH,
      STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH,
      GASLESS_STARKNET_TRANSACTIONS_PATH,
      WALLET_AS_A_SERVICE_PATH,
      EMBEDDED_WALLET_REACT_SDK_PATH,
      ALCHEMY_VS_PRIVY_PATH,
    ]
    for (const href of guides) {
      const sources = marketingInlinkSources(href)
      assert.ok(
        sources.length >= 3,
        `${href} has ${sources.length} inlinks: ${sources.join(', ')}`,
      )
    }
    for (const href of ['/privacy', '/dpa', '/user-privacy', '/user-terms']) {
      const sources = marketingInlinkSources(href)
      assert.ok(
        sources.length >= 1,
        `${href} has no crawlable internal inlink`,
      )
    }
    assert.ok(marketingInlinkSources(WALLET_AS_A_SERVICE_PATH).includes('app/embedded-wallet/page.tsx'))
    assert.ok(marketingInlinkSources(WALLET_AS_A_SERVICE_PATH).includes('app/blog/page.tsx'))
    const waasSiblings = marketingInlinkSources(WALLET_AS_A_SERVICE_PATH).filter((file) =>
      file.startsWith('content/blog/') && file !== 'content/blog/wallet-as-a-service.mdx',
    )
    assert.ok(waasSiblings.length >= 3, `WaaS sibling inlinks: ${waasSiblings.join(', ')}`)
    const waasInBodyPosts = [
      'content/blog/embedded-wallet-providers.mdx',
      'content/blog/privy-vs-turnkey.mdx',
      'content/blog/embedded-wallet-api.mdx',
      'content/blog/how-to-add-an-embedded-wallet.mdx',
      'content/blog/embedded-wallet-react-sdk.mdx',
    ]
    for (const relative of waasInBodyPosts) {
      const source = fs.readFileSync(path.join(process.cwd(), relative), 'utf8')
      const body = source.split('## What to read next')[0]
      assert.match(
        body,
        /\[([^\]]+)\]\(\/blog\/wallet-as-a-service\)/,
        `${relative} missing in-body WaaS anchor`,
      )
      const anchor = body.match(/\[([^\]]+)\]\(\/blog\/wallet-as-a-service\)/)?.[1] ?? ''
      assert.ok(
        /wallet[- ]as[- ]a[- ]service/i.test(anchor),
        `${relative} WaaS anchor is not descriptive: ${anchor}`,
      )
    }
    const hub = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-wallet/page.tsx'),
      'utf8',
    )
    assert.match(
      hub,
      /href=\{WALLET_AS_A_SERVICE_PATH\}[^>]*>\s*wallet as a service\s*</,
    )

    const blogDir = path.join(process.cwd(), 'content/blog')
    for (const filename of fs.readdirSync(blogDir).filter((name) => name.endsWith('.mdx'))) {
      const source = fs.readFileSync(path.join(blogDir, filename), 'utf8')
      const body = source.split('## What to read next')[0]
      const match = body.match(/\[([^\]]+)\]\(\/embedded-wallet\)/)
      assert.ok(match, `${filename} missing in-body /embedded-wallet link`)
      assert.match(
        match[1],
        /embedded wallet/i,
        `${filename} /embedded-wallet anchor is not descriptive: ${match[1]}`,
      )
    }
  })

  it('keeps the Kit 0.5.0 changelog title inside the SERP limit', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/cavos-kit-0-5-0.mdx'),
      'utf8',
    )
    const fields = parseBlogFrontmatter(source)
    assert.equal(fields.slug, 'cavos-kit-0-5-0')
    assert.equal(fields.category, 'Release')
    assert.equal(fields.title.includes('| Cavos'), false)
    const fullTitle = `${fields.title} | Cavos`
    assert.ok(
      fullTitle.length <= 60,
      `Kit 0.5.0 SERP title length ${fullTitle.length}: ${fullTitle}`,
    )
    assert.match(source, /\[embedded wallet\]\(\/embedded-wallet\)/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/hardware-isolated-recovery/)
    assert.match(source, /getGitHubOAuthUrl/)
    assert.match(source, /live and tested in production/)
    assert.match(source, /not recommended over Google, Apple, or email/)
    assert.doesNotMatch(source, /tag-protected/)
    assert.match(source, /required reviewers/)
    assert.match(source, /No production enclave has been accepted through this path yet/)
    assert.match(source, /encrypted at rest and never returned/)
    assert.doesNotMatch(source, /grandfathered/i)
    assert.doesNotMatch(source, /Horizon signer/i)
  })

  it('emits Article JSON-LD with dateModified, author, and breadcrumbs for every blog post', () => {
    const pageSource = fs.readFileSync(
      path.join(process.cwd(), 'app/blog/[slug]/page.tsx'),
      'utf8',
    )
    const blogLoader = fs.readFileSync(path.join(process.cwd(), 'lib/blog.ts'), 'utf8')
    assert.match(pageSource, /type:\s*'Article'/)
    assert.match(pageSource, /const dateModified = post\.meta\.updated \?\? post\.meta\.date/)
    assert.match(pageSource, /modifiedTime:\s*dateModified/)
    assert.match(pageSource, /dateModified,/)
    assert.match(blogLoader, /data\.updated/)
    assert.doesNotMatch(pageSource, /— Blog/)
    assert.doesNotMatch(pageSource, /type:\s*post\.meta\.faq/)

    const blogDir = path.join(process.cwd(), 'content/blog')
    const files = fs.readdirSync(blogDir).filter((name) => name.endsWith('.mdx'))
    assert.ok(files.length > 0)
    for (const filename of files) {
      const source = fs.readFileSync(path.join(blogDir, filename), 'utf8')
      const fields = parseBlogFrontmatter(source)
      const slug = fields.slug || filename.replace(/\.mdx$/, '')
      const datePublished = fields.date
      const dateModified = fields.updated || fields.dateModified || fields.date
      assert.ok(datePublished, `${filename} missing date`)
      const jsonLd = blogPostJsonLd({
        title: fields.title,
        description: fields.excerpt,
        path: `/blog/${slug}`,
        datePublished,
        dateModified,
        type: 'Article',
        crumbs: [
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: fields.title, path: `/blog/${slug}` },
        ],
      })
      const article = jsonLd['@graph'][0]
      assert.equal(article['@type'], 'Article', slug)
      assert.equal(article.datePublished, datePublished, slug)
      assert.equal(article.dateModified, dateModified, slug)
      assert.equal(article.author['@id'], ORGANIZATION_ID, slug)
      assert.equal(article.author.name, 'Cavos', slug)
      assert.equal(jsonLd['@graph'][1]['@type'], 'BreadcrumbList', slug)
    }
  })

  it('keeps provider-comparison titles and descriptions inside CTR limits', () => {
    const providersFull = `${EMBEDDED_WALLET_PROVIDERS_TITLE} | Cavos`
    const privyFull = `${PRIVY_VS_TURNKEY_TITLE} | Cavos`
    assert.ok(providersFull.length >= 50 && providersFull.length <= 60, providersFull)
    assert.ok(privyFull.length >= 50 && privyFull.length <= 60, privyFull)
    assert.match(EMBEDDED_WALLET_PROVIDERS_TITLE, /2026/)
    assert.match(PRIVY_VS_TURNKEY_TITLE, /2026/)
    assert.equal(EMBEDDED_WALLET_PROVIDERS_TITLE.includes('| Cavos'), false)
    assert.equal(PRIVY_VS_TURNKEY_TITLE.includes('| Cavos'), false)

    const providersSource = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/embedded-wallet-providers.mdx'),
      'utf8',
    )
    const privySource = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/privy-vs-turnkey.mdx'),
      'utf8',
    )
    const providers = parseBlogFrontmatter(providersSource)
    const privy = parseBlogFrontmatter(privySource)
    assert.equal(providers.title, EMBEDDED_WALLET_PROVIDERS_TITLE)
    assert.equal(privy.title, PRIVY_VS_TURNKEY_TITLE)
    assert.ok(providers.excerpt.length >= 140 && providers.excerpt.length <= 155)
    assert.ok(privy.excerpt.length >= 140 && privy.excerpt.length <= 155)
    assert.equal(providers.updated, '2026-10-30')
    assert.equal(privy.updated, '2026-10-30')
    assert.match(EMBEDDED_WALLET_PROVIDERS_TITLE, /Embedded Wallet Providers/)
    assert.match(PRIVY_VS_TURNKEY_TITLE, /Privy vs Turnkey/)
    assert.match(privy.excerpt, /Turnkey vs Privy/)
    assert.match(privy.excerpt, /Dfns/)
    assert.ok(
      providersSource.indexOf('<table>') <
        providersSource.indexOf('## How to evaluate providers'),
      'comparison table should sit above the evaluation checklist',
    )
    assert.equal((providersSource.match(/^\s+- question:/gm) ?? []).length, 6)
    assert.equal((privySource.match(/^\s+- question:/gm) ?? []).length, 9)
    assert.match(providersSource, /What are the best embedded wallet providers in 2026\?/)
    assert.match(providersSource, /How much do embedded wallet providers cost\?/)
    assert.match(providersSource, /Which embedded wallet providers are non-custodial\?/)
    assert.match(providersSource, /What is the difference between Privy, Turnkey, and Dynamic\?/)
    assert.match(
      providersSource,
      /Are there native embedded wallets for Midnight, Aleo, Stellar, Cosmos, or Sui\?/,
    )
    assert.match(providersSource, /Which embedded wallet provider supports the most chains\?/)
    assert.match(providersSource, /does not support Midnight, Aleo, Cosmos, or Sui/)
    assert.match(privySource, /Turnkey embedded wallet competitors/)
    assert.match(privySource, /What is the difference between Privy and Turnkey\?/)
    assert.match(privySource, /How does Privy vs Turnkey pricing compare\?/)
    assert.match(privySource, /Is Turnkey custodial\?/)
    assert.match(privySource, /When should I choose Privy vs Turnkey\?/)
    assert.match(
      privySource,
      /How do Privy's higher-level product abstractions differ from lower-level signing and key-management primitives\?/,
    )
    assert.match(
      privySource,
      /How does Privy's product scope compare with Turnkey's focus on low-level signing infrastructure\?/,
    )
    assert.match(
      privySource,
      /How do Privy's architecture and MPC compare when adding new chains or cryptographic curves\?/,
    )
    assert.match(
      privySource,
      /Because Turnkey provides lower-level primitives, does it necessarily offer developers more flexibility than Privy\?/,
    )
    assert.match(
      privySource,
      /How do Turnkey, Privy, and Dfns compare as embedded wallets\?/,
    )
    assert.match(privySource, /## Turnkey vs Privy vs Dfns/)
    assert.match(privySource, /docs\.dfns\.co\/core-concepts\/how-mpc-wallets-work/)
    assert.match(privySource, /docs\.dfns\.co\/advanced\/delegated-wallets/)
    assert.match(privySource, /docs\.dfns\.co\/solutions\/embed-user-wallets/)
    assert.match(privySource, /never reconstructed/)
    assert.match(privySource, /not stored on the user’s device/)
    assert.match(privySource, /does not document TSS-MPC/)
    assert.match(privySource, /secp256k1/)
    assert.match(privySource, /\]\(\/dynamic-alternatives\)/)
    assert.match(privySource, /\]\(\/magic-alternatives\)/)
    assert.match(privySource, /\]\(\/blog\/cavos-kit-0-5-0\)/)
    assert.match(providersSource, /\]\(\/blog\/cavos-kit-0-5-0\)/)
    assert.match(providersSource, /\[Turnkey alternatives\]\(\/turnkey-alternatives\)/)
    assert.match(providersSource, /\[Dynamic alternatives\]\(\/dynamic-alternatives\)/)
    assert.match(providersSource, /\[Magic alternatives\]\(\/magic-alternatives\)/)
    assert.match(providersSource, /\[Privy alternatives\]\(\/privy-alternatives\)/)
  })

  it('puts a non-footer in-text link to /embedded-wallet on ranking pages', () => {
    const pages = [
      ['app/compare/[slug]/page.tsx', 'embedded wallet'],
      ['app/pricing/page.tsx', 'self-custodial embedded wallet'],
      ['app/custody/page.tsx', 'self-custodial embedded wallet'],
      ['app/about/page.tsx', 'embedded wallet'],
    ] as const

    for (const [relative, anchor] of pages) {
      const source = fs.readFileSync(path.join(process.cwd(), relative), 'utf8')
      assert.match(
        source,
        /href=["']\/embedded-wallet["']/,
        `${relative} missing /embedded-wallet href`,
      )
      assert.match(
        source,
        new RegExp(
          `href=["']/embedded-wallet["'][^>]*>\\s*${anchor}\\s*<`,
        ),
        `${relative} missing in-text anchor "${anchor}"`,
      )
      assert.match(
        source,
        /font-semibold text-ink underline decoration-line underline-offset-4/,
        `${relative} missing compare-page underline link style`,
      )
    }

    const alternativesData = [
      'lib/privy-alternatives.ts',
      'lib/turnkey-alternatives.ts',
      'lib/dynamic-alternatives.ts',
      'lib/magic-alternatives.ts',
    ]
    for (const relative of alternativesData) {
      const source = fs.readFileSync(path.join(process.cwd(), relative), 'utf8')
      assert.match(
        source,
        /href: '\/embedded-wallet', label: 'embedded wallet'/,
        `${relative} missing embedded wallet intro link`,
      )
    }
    const template = fs.readFileSync(
      path.join(process.cwd(), 'components/AlternativesGuidePage.tsx'),
      'utf8',
    )
    assert.match(
      template,
      /font-semibold text-ink underline decoration-line underline-offset-4/,
    )
  })

  it('indexes the React integration guide as an Article with FAQ JSON-LD', () => {
    const postPath = path.join(
      process.cwd(),
      'content/blog/how-to-add-an-embedded-wallet.mdx',
    )
    assert.equal(fs.existsSync(postPath), true)
    const source = fs.readFileSync(postPath, 'utf8')
    assert.match(source, /\[embedded wallet\]\(\/embedded-wallet\)/)
    assert.match(source, /href="\/compare"|\]\(\/compare\)/)
    assert.match(source, /\]\(\/pricing\)/)
    assert.match(source, /embedded-starknet-wallet/)
    assert.match(source, /embedded-solana-wallet/)
    assert.match(source, /embedded-stellar-wallet/)
    assert.match(source, /CavosProvider/)
    assert.match(source, /@cavos\/kit/)
    assert.match(source, /@cavos\/kit` 0\.4\.2/)
    assert.match(source, /npm install @cavos\/kit/)
    assert.doesNotMatch(source, /0\.3\.\d/)
    assert.doesNotMatch(source, /category:\s*"Release"/)
    assert.doesNotMatch(source, /This device must be approved first/)
    assert.doesNotMatch(source, /on-chain approval/)
    assert.doesNotMatch(source, /audited Cavos/)

    const data = blogPostJsonLd({
      title: EMBEDDED_WALLET_INTEGRATION_TITLE,
      description: 'Install @cavos/kit and send a sponsored transaction.',
      path: EMBEDDED_WALLET_INTEGRATION_PATH,
      datePublished: '2026-10-12',
      type: 'Article',
      faq: [
        {
          question: 'What is an embedded wallet SDK?',
          answer: 'The library that provisions a wallet inside your application.',
        },
      ],
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: EMBEDDED_WALLET_INTEGRATION_TITLE, path: EMBEDDED_WALLET_INTEGRATION_PATH },
      ],
    })
    const json = JSON.stringify(data)
    JSON.parse(json)
    assert.equal(data['@graph'][0]['@type'], 'Article')
    assert.equal(data['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(data['@graph'][2]['@type'], 'FAQPage')
    assert.equal(
      data['@graph'][0].url,
      'https://cavos.xyz/blog/how-to-add-an-embedded-wallet',
    )
  })

  it('indexes the embedded-wallet vs extension guide as an Article with FAQ JSON-LD', () => {
    const postPath = path.join(
      process.cwd(),
      'content/blog/embedded-wallet-vs-browser-extension.mdx',
    )
    assert.equal(fs.existsSync(postPath), true)
    const source = fs.readFileSync(postPath, 'utf8')
    assert.equal(
      (source.match(/\]\(\/embedded-wallet\)/g) ?? []).length >= 3,
      true,
    )
    assert.match(source, /\]\(\/blog\/how-to-add-an-embedded-wallet\)/)
    assert.match(source, /embedded-starknet-wallet/)
    assert.match(source, /\]\(\/compare\)|\]\(\/compare\/dynamic\)/)
    assert.match(source, /\]\(\/custody\)/)
    assert.match(
      source,
      /What is the difference between an embedded wallet and a browser extension\?/,
    )
    assert.match(
      source,
      /When should an app use an embedded wallet instead of MetaMask-style extensions\?/,
    )
    assert.match(source, /audited OpenZeppelin AccountUpgradeable/)
    assert.match(source, /device-native/)
    assert.match(source, /Cavos, LLC/)
    assert.doesNotMatch(source, /audited Cavos/)
    assert.doesNotMatch(source, /Cavos custom account/)
    assert.match(source, /does not ship its own account implementation/)
    assert.doesNotMatch(source, /category:\s*"Release"/)
    assert.doesNotMatch(source, /robots:\s*noindex/)
    assert.equal(EMBEDDED_WALLET_VS_EXTENSION_PATH, '/blog/embedded-wallet-vs-browser-extension')
    assert.equal(
      EMBEDDED_WALLET_VS_EXTENSION_TITLE,
      'Embedded Wallet vs Browser Extension: Where Should Users Sign?',
    )

    const data = blogPostJsonLd({
      title: EMBEDDED_WALLET_VS_EXTENSION_TITLE,
      description:
        'When users should sign in an embedded wallet versus a browser extension.',
      path: EMBEDDED_WALLET_VS_EXTENSION_PATH,
      datePublished: '2026-10-14',
      type: 'Article',
      faq: [
        {
          question:
            'What is the difference between an embedded wallet and a browser extension?',
          answer:
            'A browser extension is a separate program the user installs. An embedded wallet is provisioned inside the application.',
        },
      ],
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        {
          name: EMBEDDED_WALLET_VS_EXTENSION_TITLE,
          path: EMBEDDED_WALLET_VS_EXTENSION_PATH,
        },
      ],
    })
    const json = JSON.stringify(data)
    JSON.parse(json)
    assert.equal(data['@graph'][0]['@type'], 'Article')
    assert.equal(data['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(data['@graph'][2]['@type'], 'FAQPage')
    assert.equal(
      data['@graph'][0].url,
      'https://cavos.xyz/blog/embedded-wallet-vs-browser-extension',
    )
    assert.equal(
      data['@graph'][0].mainEntityOfPage['@id'],
      'https://cavos.xyz/blog/embedded-wallet-vs-browser-extension',
    )
  })

  it('indexes the Stellar embedded wallet tutorial as an Article with FAQ JSON-LD', () => {
    const postPath = path.join(
      process.cwd(),
      'content/blog/stellar-embedded-wallet-tutorial.mdx',
    )
    assert.equal(fs.existsSync(postPath), true)
    const source = fs.readFileSync(postPath, 'utf8')
    assert.match(source, /\[embedded wallet\]\(\/embedded-wallet\)/)
    assert.match(source, /\]\(\/embedded-stellar-wallet\)/)
    assert.match(source, /\]\(\/blog\/how-to-add-an-embedded-wallet\)/)
    assert.match(source, /\]\(\/pricing\)/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/stellar/)
    assert.match(source, /@cavos\/kit` 0\.4\.2/)
    assert.match(source, /npm install @cavos\/kit/)
    assert.match(source, /login\("google"\)/)
    assert.match(source, /sendOtp/)
    assert.match(source, /verifyOtp/)
    assert.match(source, /10_000_000n/)
    assert.match(source, /wallet\.balance\(\)/)
    assert.match(source, /signMessage/)
    assert.match(source, /Expo Go is not supported/)
    assert.match(source, /classic G/)
    assert.match(source, /cavos-ed25519-stellar-v1/)
    assert.match(source, /HKDF/)
    assert.match(source, /sponsored, 0 XLM/)
    assert.match(source, /never a custodian/)
    assert.match(source, /audited OpenZeppelin account contract/)
    assert.match(source, /not a Soroban contract/)
    assert.match(source, /no on-chain device-signer list/)
    assert.match(source, /no on-chain social recovery/)
    assert.doesNotMatch(source, /audited Cavos/)
    assert.doesNotMatch(source, /adds a second Horizon signer/)
    assert.doesNotMatch(source, /second Horizon signer/)
    assert.doesNotMatch(source, /extra Horizon signer/)
    assert.doesNotMatch(source, /grandfathered/)
    assert.doesNotMatch(source, /nativeDek/)
    assert.doesNotMatch(source, /on-chain device approval/)
    assert.doesNotMatch(source, /category:\s*"Release"/)
    assert.doesNotMatch(source, /This device must be approved first/)
    assert.equal(
      STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH,
      '/blog/stellar-embedded-wallet-tutorial',
    )
    assert.equal(
      STELLAR_EMBEDDED_WALLET_TUTORIAL_TITLE,
      'How to Add an Embedded Stellar Wallet to Your App',
    )
    assert.ok(STELLAR_EMBEDDED_WALLET_TUTORIAL_TITLE.length <= 60)

    const hub = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-wallet/page.tsx'),
      'utf8',
    )
    assert.match(hub, /STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH/)
    assert.match(
      hub,
      /How to add an embedded Stellar wallet/,
    )

    const stellarPage = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-stellar-wallet/page.tsx'),
      'utf8',
    )
    assert.match(
      stellarPage,
      /href=["']\/blog\/stellar-embedded-wallet-tutorial["']/,
    )

    const data = blogPostJsonLd({
      title: STELLAR_EMBEDDED_WALLET_TUTORIAL_TITLE,
      description:
        'Install @cavos/kit, sign in with Google, Apple, or email, and send a sponsored Stellar payment.',
      path: STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH,
      datePublished: '2026-10-18',
      type: 'Article',
      faq: [
        {
          question: 'What is a Stellar embedded wallet SDK?',
          answer:
            'A library that provisions a classic G… account inside your application.',
        },
      ],
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        {
          name: STELLAR_EMBEDDED_WALLET_TUTORIAL_TITLE,
          path: STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH,
        },
      ],
    })
    const json = JSON.stringify(data)
    JSON.parse(json)
    assert.equal(data['@graph'][0]['@type'], 'Article')
    assert.equal(data['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(data['@graph'][2]['@type'], 'FAQPage')
    assert.equal(
      data['@graph'][0].url,
      'https://cavos.xyz/blog/stellar-embedded-wallet-tutorial',
    )
    assert.equal(
      data['@graph'][0].mainEntityOfPage['@id'],
      'https://cavos.xyz/blog/stellar-embedded-wallet-tutorial',
    )
  })

  it('indexes the gasless Starknet transactions guide as an Article with FAQ JSON-LD', () => {
    const postPath = path.join(
      process.cwd(),
      'content/blog/gasless-starknet-transactions.mdx',
    )
    assert.equal(fs.existsSync(postPath), true)
    const source = fs.readFileSync(postPath, 'utf8')
    assert.match(source, /\[embedded wallet\]\(\/embedded-wallet\)/)
    assert.match(source, /\]\(\/embedded-starknet-wallet\)/)
    assert.match(source, /\]\(\/blog\/how-to-add-an-embedded-wallet\)/)
    assert.match(source, /\]\(\/pricing\)/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/starknet/)
    assert.match(source, /@cavos\/kit` 0\.4\.4/)
    assert.match(source, /npm install @cavos\/kit/)
    assert.match(source, /login\("google"\)/)
    assert.match(source, /sendOtp/)
    assert.match(source, /verifyOtp/)
    assert.match(source, /paymasterApiKey/)
    assert.match(source, /SNIP-29/)
    assert.match(source, /fee: "self"/)
    assert.match(source, /signMessage/)
    assert.match(source, /Expo Go is not supported/)
    assert.match(source, /audited OpenZeppelin account contract/)
    assert.match(source, /AccountUpgradeable v3\.0\.0/)
    assert.match(source, /cavos-stark-starknet-v1/)
    assert.match(source, /grindKey/)
    assert.match(source, /HKDF/)
    assert.match(source, /MasterDEK/)
    assert.match(source, /0x01d1777db36cdd06dd62cfde77b1b6ae06412af95d57a13dc40ac77b8a702381/)
    assert.match(source, /no on-chain device-signer list/)
    assert.match(source, /no on-chain social recovery/)
    assert.doesNotMatch(source, /audited Cavos/)
    assert.doesNotMatch(source, /session key|sessionKey|session-key/)
    assert.doesNotMatch(source, /on-chain device approval/)
    assert.doesNotMatch(source, /Horizon signer/)
    assert.doesNotMatch(source, /category:\s*"Release"/)
    assert.doesNotMatch(source, /This device must be approved first/)
    assert.equal(
      GASLESS_STARKNET_TRANSACTIONS_PATH,
      '/blog/gasless-starknet-transactions',
    )
    assert.equal(
      GASLESS_STARKNET_TRANSACTIONS_TITLE,
      'How to Send Gasless Starknet Transactions',
    )
    assert.ok(GASLESS_STARKNET_TRANSACTIONS_TITLE.length <= 60)

    const hub = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-wallet/page.tsx'),
      'utf8',
    )
    assert.match(hub, /GASLESS_STARKNET_TRANSACTIONS_PATH/)
    assert.match(hub, /How to send gasless Starknet transactions/)

    const starknetPage = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-starknet-wallet/page.tsx'),
      'utf8',
    )
    assert.match(
      starknetPage,
      /href=["']\/blog\/gasless-starknet-transactions["']/,
    )

    const data = blogPostJsonLd({
      title: GASLESS_STARKNET_TRANSACTIONS_TITLE,
      description:
        'Install @cavos/kit, sign in with Google, Apple, or email, and send a paymaster-sponsored Starknet transaction.',
      path: GASLESS_STARKNET_TRANSACTIONS_PATH,
      datePublished: '2026-10-25',
      type: 'Article',
      faq: [
        {
          question: 'What are gasless Starknet transactions?',
          answer:
            'Invokes whose fee is paid by a paymaster instead of the user’s ETH or STRK.',
        },
      ],
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        {
          name: GASLESS_STARKNET_TRANSACTIONS_TITLE,
          path: GASLESS_STARKNET_TRANSACTIONS_PATH,
        },
      ],
    })
    const json = JSON.stringify(data)
    JSON.parse(json)
    assert.equal(data['@graph'][0]['@type'], 'Article')
    assert.equal(data['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(data['@graph'][2]['@type'], 'FAQPage')
    assert.equal(
      data['@graph'][0].url,
      'https://cavos.xyz/blog/gasless-starknet-transactions',
    )
    assert.equal(
      data['@graph'][0].mainEntityOfPage['@id'],
      'https://cavos.xyz/blog/gasless-starknet-transactions',
    )
  })

  it('indexes the embedded wallet providers guide as an Article with FAQ JSON-LD', () => {
    const postPath = path.join(
      process.cwd(),
      'content/blog/embedded-wallet-providers.mdx',
    )
    assert.equal(fs.existsSync(postPath), true)
    const source = fs.readFileSync(postPath, 'utf8')
    assert.match(source, /\[embedded wallet\]\(\/embedded-wallet\)/)
    assert.match(source, /\[Privy alternatives\]\(\/privy-alternatives\)/)
    assert.match(source, /\]\(\/compare\)/)
    assert.match(source, /\]\(\/compare\/privy\)/)
    assert.match(source, /\]\(\/compare\/dynamic\)/)
    assert.match(source, /\]\(\/compare\/turnkey\)/)
    assert.match(source, /\]\(\/compare\/web3auth\)/)
    assert.match(source, /\]\(\/compare\/magic\)|<a href="\/compare\/magic">/)
    assert.match(source, /<table>/)
    assert.match(source, /embedded-starknet-wallet/)
    assert.match(source, /embedded-solana-wallet/)
    assert.match(source, /embedded-stellar-wallet/)
    assert.match(source, /\]\(\/pricing\)/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/quickstart/)
    assert.match(source, /audited OpenZeppelin AccountUpgradeable/)
    assert.match(source, /device-native/)
    assert.match(source, /Cavos, LLC/)
    assert.match(source, /Stripe acquired Privy/)
    assert.match(source, /Fireblocks acquired Dynamic/)
    assert.match(source, /Consensys acquired Web3Auth/)
    assert.match(source, /Payward/)
    assert.match(source, /Privy vs Turnkey/)
    assert.match(source, /no on-chain device-signer list/)
    assert.match(source, /no on-chain social recovery/)
    assert.doesNotMatch(source, /audited Cavos/)
    assert.doesNotMatch(source, /Cavos custom account/)
    assert.match(source, /does not ship its own account implementation/)
    assert.doesNotMatch(source, /category:\s*"Release"/)
    assert.doesNotMatch(source, /robots:\s*noindex/)
    assert.equal(EMBEDDED_WALLET_PROVIDERS_PATH, '/blog/embedded-wallet-providers')
    assert.equal(
      EMBEDDED_WALLET_PROVIDERS_TITLE,
      'Embedded Wallet Providers: Who Fits in 2026',
    )

    const hub = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-wallet/page.tsx'),
      'utf8',
    )
    assert.match(hub, /EMBEDDED_WALLET_PROVIDERS_PATH/)

    const compareHub = fs.readFileSync(
      path.join(process.cwd(), 'app/compare/page.tsx'),
      'utf8',
    )
    assert.match(compareHub, /EMBEDDED_WALLET_PROVIDERS_PATH/)

    const data = blogPostJsonLd({
      title: EMBEDDED_WALLET_PROVIDERS_TITLE,
      description:
        'A neutral 2026 comparison of embedded wallet providers and wallet-as-a-service.',
      path: EMBEDDED_WALLET_PROVIDERS_PATH,
      datePublished: '2026-10-19',
      type: 'Article',
      faq: [
        {
          question: 'What is an embedded wallet provider or wallet-as-a-service?',
          answer:
            'An embedded wallet lives inside the application. Wallet-as-a-service is the commercial label for provisioning that wallet through an API or SDK.',
        },
      ],
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        {
          name: EMBEDDED_WALLET_PROVIDERS_TITLE,
          path: EMBEDDED_WALLET_PROVIDERS_PATH,
        },
      ],
    })
    const json = JSON.stringify(data)
    JSON.parse(json)
    assert.equal(data['@graph'][0]['@type'], 'Article')
    assert.equal(data['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(data['@graph'][2]['@type'], 'FAQPage')
    assert.equal(
      data['@graph'][0].url,
      'https://cavos.xyz/blog/embedded-wallet-providers',
    )
    assert.equal(
      data['@graph'][0].mainEntityOfPage['@id'],
      'https://cavos.xyz/blog/embedded-wallet-providers',
    )
  })

  it('indexes the Privy vs Turnkey guide as an Article with FAQ JSON-LD', () => {
    const postPath = path.join(process.cwd(), 'content/blog/privy-vs-turnkey.mdx')
    assert.equal(fs.existsSync(postPath), true)
    const source = fs.readFileSync(postPath, 'utf8')
    assert.match(source, /\[embedded wallet\]\(\/embedded-wallet\)/)
    assert.match(source, /\]\(\/compare\/privy\)/)
    assert.match(source, /\]\(\/compare\/turnkey\)/)
    assert.match(source, /\[Privy alternatives\]\(\/privy-alternatives\)/)
    assert.match(source, /\]\(\/turnkey-alternatives\)/)
    assert.match(source, /\]\(\/dynamic-alternatives\)/)
    assert.match(source, /\]\(\/magic-alternatives\)/)
    assert.match(source, /\]\(\/blog\/cavos-kit-0-5-0\)/)
    assert.match(source, /\]\(\/blog\/embedded-wallet-providers\)/)
    assert.match(source, /<table>/)
    assert.doesNotMatch(source, /\|---/)
    assert.match(source, /audited OpenZeppelin account contract/)
    assert.match(source, /device-native/)
    assert.match(source, /Cavos, LLC/)
    assert.match(source, /no on-chain device-signer list/)
    assert.match(source, /no on-chain social recovery/)
    assert.match(source, /does not ship its own account implementation/)
    assert.match(source, /Stripe/)
    assert.match(source, /Bridge/)
    assert.match(source, /AWS Nitro Enclaves/)
    assert.match(source, /Embedded Wallet Kit/)
    assert.doesNotMatch(source, /audited Cavos/)
    assert.doesNotMatch(source, /Cavos custom account/)
    assert.doesNotMatch(source, /on-chain device approval/)
    assert.doesNotMatch(source, /category:\s*"Release"/)
    assert.doesNotMatch(source, /robots:\s*noindex/)
    assert.equal(PRIVY_VS_TURNKEY_PATH, '/blog/privy-vs-turnkey')
    assert.equal(
      PRIVY_VS_TURNKEY_TITLE,
      'Privy vs Turnkey (2026): Auth vs Enclave Keys',
    )

    const compareSource = fs.readFileSync(
      path.join(process.cwd(), 'app/compare/[slug]/page.tsx'),
      'utf8',
    )
    assert.match(compareSource, /PRIVY_VS_TURNKEY_PATH/)
    assert.match(compareSource, /slug === 'turnkey'/)

    const data = blogPostJsonLd({
      title: PRIVY_VS_TURNKEY_TITLE,
      description:
        'A 2026 comparison of Privy and Turnkey as embedded wallet SDKs.',
      path: PRIVY_VS_TURNKEY_PATH,
      datePublished: '2026-10-20',
      type: 'Article',
      faq: [
        {
          question: 'What is the difference between Privy and Turnkey?',
          answer:
            'Privy is a finished authentication and embedded wallet product. Turnkey is lower-level key-management and signing infrastructure.',
        },
      ],
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        {
          name: PRIVY_VS_TURNKEY_TITLE,
          path: PRIVY_VS_TURNKEY_PATH,
        },
      ],
    })
    const json = JSON.stringify(data)
    JSON.parse(json)
    assert.equal(data['@graph'][0]['@type'], 'Article')
    assert.equal(data['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(data['@graph'][2]['@type'], 'FAQPage')
    assert.equal(data['@graph'][0].url, 'https://cavos.xyz/blog/privy-vs-turnkey')
    assert.equal(
      data['@graph'][0].mainEntityOfPage['@id'],
      'https://cavos.xyz/blog/privy-vs-turnkey',
    )
  })

  it('indexes the embedded wallet API guide as an Article with FAQ JSON-LD', () => {
    const postPath = path.join(
      process.cwd(),
      'content/blog/embedded-wallet-api.mdx',
    )
    assert.equal(fs.existsSync(postPath), true)
    const source = fs.readFileSync(postPath, 'utf8')
    const excerptMatch = source.match(/^excerpt:\s*"(.*)"$/m)
    assert.ok(excerptMatch)
    assert.ok(excerptMatch[1].length <= 160, excerptMatch[1].length)
    assert.match(source, /\[embedded wallet\]\(\/embedded-wallet\)/)
    assert.match(source, /\]\(\/blog\/how-to-add-an-embedded-wallet\)/)
    assert.match(source, /\]\(\/blog\/embedded-wallet-providers\)/)
    assert.match(source, /embedded-starknet-wallet/)
    assert.match(source, /embedded-solana-wallet/)
    assert.match(source, /embedded-stellar-wallet/)
    assert.match(source, /\]\(\/pricing\)/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/api-reference/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/quickstart/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/auth/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/wallet-actions/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/recovery/)
    assert.match(source, /@cavos\/kit` 0\.5\.0/)
    assert.match(source, /CavosProvider/)
    assert.match(source, /Cavos\.connect/)
    assert.match(source, /useCavos/)
    assert.match(source, /login\("google"\)/)
    assert.match(source, /sendOtp/)
    assert.match(source, /verifyOtp/)
    assert.match(source, /signMessage/)
    assert.match(source, /enrollPasskeyDefault/)
    assert.match(source, /approveDeviceWithPasskey/)
    assert.match(source, /prefixedMessageBytes/)
    assert.match(source, /executeInstructions/)
    assert.match(source, /invokeContract/)
    assert.match(source, /audited OpenZeppelin account contract/)
    assert.match(source, /AccountUpgradeable v3\.0\.0/)
    assert.match(source, /does not ship its own account implementation/)
    assert.match(source, /no on-chain device signers/)
    assert.match(source, /no on-chain social recovery/)
    assert.match(source, /classic G/)
    assert.match(source, /native Ed25519 system account/)
    assert.match(source, /device-native/)
    assert.match(source, /Cavos, LLC/)
    assert.match(source, /What is an embedded wallet API\?/)
    assert.match(source, /Client SDK vs REST/)
    assert.doesNotMatch(source, /audited Cavos/)
    assert.doesNotMatch(source, /Cavos custom account/)
    assert.doesNotMatch(source, /on-chain device approval/)
    assert.doesNotMatch(source, /on-chain approval/)
    assert.doesNotMatch(source, /This device must be approved first/)
    assert.doesNotMatch(source, /category:\s*"Release"/)
    assert.doesNotMatch(source, /robots:\s*noindex/)
    assert.match(source, /\*\*embedded wallet API\*\*/)
    assert.match(source, /SDK methods \(what people call the API\)/)
    assert.match(source, /Which SDK methods make up the Cavos embedded wallet API\?/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/react/)
    assert.match(source, /\]\(\/blog\/embedded-wallet-react-sdk\)/)
    assert.match(source, /no public “create wallet” REST endpoint|not a public REST create-wallet endpoint/)
    assert.doesNotMatch(source, /grandfather/)
    assert.doesNotMatch(source, /Horizon signer/)
    assert.equal(EMBEDDED_WALLET_API_PATH, '/blog/embedded-wallet-api')
    assert.equal(
      EMBEDDED_WALLET_API_TITLE,
      'Embedded Wallet API (2026): SDK Methods & Auth',
    )
    assert.ok(`${EMBEDDED_WALLET_API_TITLE} | Cavos`.length <= 60)
    assert.ok(
      excerptMatch[1].length >= 140 && excerptMatch[1].length <= 155,
      String(excerptMatch[1].length),
    )
    const apiFields = parseBlogFrontmatter(source)
    assert.equal(apiFields.title, EMBEDDED_WALLET_API_TITLE)
    assert.equal(apiFields.updated, '2026-10-30')

    const hub = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-wallet/page.tsx'),
      'utf8',
    )
    assert.match(hub, /EMBEDDED_WALLET_API_PATH/)
    assert.match(hub, /PRIVY_VS_TURNKEY_PATH/)
    assert.match(hub, /Related guides/)

    const reactGuide = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/how-to-add-an-embedded-wallet.mdx'),
      'utf8',
    )
    assert.match(reactGuide, /\]\(\/blog\/embedded-wallet-api\)/)

    const data = blogPostJsonLd({
      title: EMBEDDED_WALLET_API_TITLE,
      description:
        'What an embedded wallet API covers — auth, create, keys, signing, gas, recovery — and how Cavos exposes that surface in @cavos/kit.',
      path: EMBEDDED_WALLET_API_PATH,
      datePublished: '2026-10-21',
      type: 'Article',
      faq: [
        {
          question: 'What is an embedded wallet API?',
          answer:
            'The developer surface that provisions a wallet inside an application.',
        },
      ],
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        {
          name: EMBEDDED_WALLET_API_TITLE,
          path: EMBEDDED_WALLET_API_PATH,
        },
      ],
    })
    const json = JSON.stringify(data)
    JSON.parse(json)
    assert.equal(data['@graph'][0]['@type'], 'Article')
    assert.equal(data['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(data['@graph'][2]['@type'], 'FAQPage')
    assert.equal(data['@graph'][0].url, 'https://cavos.xyz/blog/embedded-wallet-api')
    assert.equal(
      data['@graph'][0].mainEntityOfPage['@id'],
      'https://cavos.xyz/blog/embedded-wallet-api',
    )
  })

  it('indexes the non-custodial embedded wallet guide as an Article with FAQ JSON-LD', () => {
    const postPath = path.join(
      process.cwd(),
      'content/blog/non-custodial-embedded-wallet.mdx',
    )
    assert.equal(fs.existsSync(postPath), true)
    const source = fs.readFileSync(postPath, 'utf8')
    const excerptMatch = source.match(/^excerpt:\s*"(.*)"$/m)
    assert.ok(excerptMatch)
    assert.ok(excerptMatch[1].length <= 160, excerptMatch[1].length)
    assert.match(source, /\[embedded wallet\]\(\/embedded-wallet\)/)
    assert.match(source, /\]\(\/custody\)/)
    assert.match(source, /\]\(\/compare\)/)
    assert.match(source, /\]\(\/blog\/embedded-wallet-api\)/)
    assert.match(source, /\]\(\/blog\/how-to-add-an-embedded-wallet\)/)
    assert.match(source, /\]\(\/blog\/embedded-wallet-providers\)/)
    assert.match(source, /embedded-starknet-wallet/)
    assert.match(source, /embedded-solana-wallet/)
    assert.match(source, /embedded-stellar-wallet/)
    assert.match(source, /audited OpenZeppelin account contract/)
    assert.match(source, /AccountUpgradeable/)
    assert.match(source, /does not ship its own account implementation/)
    assert.match(source, /no on-chain device signers/)
    assert.match(source, /no on-chain social recovery/)
    assert.match(source, /classic G/)
    assert.match(source, /native Ed25519 system account/)
    assert.match(source, /device-native/)
    assert.match(source, /Cavos, LLC/)
    assert.match(source, /MasterDEK/)
    assert.match(source, /What is a non-custodial embedded wallet\?/)
    assert.match(source, /Is an embedded wallet automatically self-custodial\?/)
    assert.match(source, /How do I verify a vendor/)
    assert.match(source, /How does Cavos keep wallets non-custodial\?/)
    assert.doesNotMatch(source, /audited Cavos/)
    assert.doesNotMatch(source, /Cavos custom account/)
    assert.doesNotMatch(source, /on-chain device approval/)
    assert.doesNotMatch(source, /on-chain approval/)
    assert.doesNotMatch(source, /This device must be approved first/)
    assert.doesNotMatch(source, /category:\s*"Release"/)
    assert.doesNotMatch(source, /robots:\s*noindex/)
    assert.equal(
      NON_CUSTODIAL_EMBEDDED_WALLET_PATH,
      '/blog/non-custodial-embedded-wallet',
    )
    assert.equal(
      NON_CUSTODIAL_EMBEDDED_WALLET_TITLE,
      'Non-Custodial Embedded Wallets: How Self-Custody Works (2026)',
    )

    const hub = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-wallet/page.tsx'),
      'utf8',
    )
    assert.match(hub, /NON_CUSTODIAL_EMBEDDED_WALLET_PATH/)
    assert.match(hub, /Related guides/)

    const apiGuide = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/embedded-wallet-api.mdx'),
      'utf8',
    )
    assert.match(apiGuide, /\]\(\/blog\/non-custodial-embedded-wallet\)/)

    const reactGuide = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/how-to-add-an-embedded-wallet.mdx'),
      'utf8',
    )
    assert.match(reactGuide, /\]\(\/blog\/non-custodial-embedded-wallet\)/)

    const providersGuide = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/embedded-wallet-providers.mdx'),
      'utf8',
    )
    assert.match(providersGuide, /\]\(\/blog\/non-custodial-embedded-wallet\)/)

    const data = blogPostJsonLd({
      title: NON_CUSTODIAL_EMBEDDED_WALLET_TITLE,
      description:
        'What makes a non-custodial embedded wallet actually self-custodial: who can sign, key models, a vendor checklist, and how Cavos does it.',
      path: NON_CUSTODIAL_EMBEDDED_WALLET_PATH,
      datePublished: '2026-10-22',
      type: 'Article',
      faq: [
        {
          question: 'What is a non-custodial embedded wallet?',
          answer:
            'A non-custodial embedded wallet is one the provider cannot spend from.',
        },
      ],
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        {
          name: NON_CUSTODIAL_EMBEDDED_WALLET_TITLE,
          path: NON_CUSTODIAL_EMBEDDED_WALLET_PATH,
        },
      ],
    })
    const json = JSON.stringify(data)
    JSON.parse(json)
    assert.equal(data['@graph'][0]['@type'], 'Article')
    assert.equal(data['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(data['@graph'][2]['@type'], 'FAQPage')
    assert.equal(
      data['@graph'][0].url,
      'https://cavos.xyz/blog/non-custodial-embedded-wallet',
    )
    assert.equal(
      data['@graph'][0].mainEntityOfPage['@id'],
      'https://cavos.xyz/blog/non-custodial-embedded-wallet',
    )
  })

  it('indexes the wallet-as-a-service guide as an Article with FAQ JSON-LD', () => {
    const postPath = path.join(
      process.cwd(),
      'content/blog/wallet-as-a-service.mdx',
    )
    assert.equal(fs.existsSync(postPath), true)
    const source = fs.readFileSync(postPath, 'utf8')
    const excerptMatch = source.match(/^excerpt:\s*"(.*)"$/m)
    assert.ok(excerptMatch)
    assert.ok(excerptMatch[1].length <= 160, excerptMatch[1].length)
    assert.match(source, /\[embedded wallet\]\(\/embedded-wallet\)/)
    assert.match(source, /\]\(\/custody\)/)
    assert.match(source, /\]\(\/compare\)/)
    assert.match(source, /\]\(\/compare\/privy\)/)
    assert.match(source, /\]\(\/compare\/dynamic\)/)
    assert.match(source, /\]\(\/compare\/turnkey\)/)
    assert.match(source, /\]\(\/compare\/web3auth\)/)
    assert.match(source, /\]\(\/compare\/magic\)/)
    assert.match(source, /\]\(\/pricing\)/)
    assert.match(source, /\]\(\/blog\/embedded-wallet-api\)/)
    assert.match(source, /\]\(\/blog\/how-to-add-an-embedded-wallet\)/)
    assert.match(source, /\]\(\/blog\/embedded-wallet-providers\)/)
    assert.match(source, /\]\(\/blog\/non-custodial-embedded-wallet\)/)
    assert.match(source, /\]\(\/blog\/privy-vs-turnkey\)/)
    assert.match(source, /embedded-starknet-wallet/)
    assert.match(source, /embedded-solana-wallet/)
    assert.match(source, /embedded-stellar-wallet/)
    assert.match(source, /audited OpenZeppelin account contract/)
    assert.match(source, /AccountUpgradeable/)
    assert.match(source, /does not ship its own account implementation/)
    assert.match(source, /no on-chain device signers/)
    assert.match(source, /no on-chain social recovery/)
    assert.match(source, /classic G/)
    assert.match(source, /native Ed25519 system account/)
    assert.match(source, /device-native/)
    assert.match(source, /Cavos, LLC/)
    assert.match(source, /Google/)
    assert.match(source, /Apple/)
    assert.match(source, /passkey/)
    assert.match(source, /What is wallet-as-a-service/)
    assert.match(source, /What is an embedded wallet platform\?/)
    assert.match(source, /How does wallet-as-a-service pricing usually work\?/)
    assert.match(source, /Should I build or buy/)
    assert.match(source, /Monthly active users/)
    assert.match(source, /Monthly active wallets/)
    assert.match(source, /Per signature/)
    assert.doesNotMatch(source, /audited Cavos/)
    assert.doesNotMatch(source, /Cavos custom account/)
    assert.doesNotMatch(source, /on-chain device approval/)
    assert.doesNotMatch(source, /on-chain approval/)
    assert.doesNotMatch(source, /This device must be approved first/)
    assert.doesNotMatch(source, /category:\s*"Release"/)
    assert.doesNotMatch(source, /robots:\s*noindex/)
    assert.equal(WALLET_AS_A_SERVICE_PATH, '/blog/wallet-as-a-service')
    assert.equal(
      WALLET_AS_A_SERVICE_TITLE,
      'Wallet-as-a-Service (WaaS): How It Works (2026)',
    )

    const hub = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-wallet/page.tsx'),
      'utf8',
    )
    assert.match(hub, /WALLET_AS_A_SERVICE_PATH/)
    assert.match(hub, /Related guides/)

    const apiGuide = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/embedded-wallet-api.mdx'),
      'utf8',
    )
    assert.match(apiGuide, /\]\(\/blog\/wallet-as-a-service\)/)

    const providersGuide = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/embedded-wallet-providers.mdx'),
      'utf8',
    )
    assert.match(providersGuide, /\]\(\/blog\/wallet-as-a-service\)/)

    const data = blogPostJsonLd({
      title: WALLET_AS_A_SERVICE_TITLE,
      description:
        'What a wallet-as-a-service platform is: login, keys, signing, gas, recovery, pricing — and how Cavos compares to Privy, Dynamic, Turnkey, Magic, and Web3Auth.',
      path: WALLET_AS_A_SERVICE_PATH,
      datePublished: '2026-10-23',
      type: 'Article',
      faq: [
        {
          question: 'What is wallet-as-a-service (WaaS)?',
          answer:
            'The commercial name for provisioning a crypto wallet through an API or SDK.',
        },
      ],
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        {
          name: WALLET_AS_A_SERVICE_TITLE,
          path: WALLET_AS_A_SERVICE_PATH,
        },
      ],
    })
    const json = JSON.stringify(data)
    JSON.parse(json)
    assert.equal(data['@graph'][0]['@type'], 'Article')
    assert.equal(data['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(data['@graph'][2]['@type'], 'FAQPage')
    assert.equal(
      data['@graph'][0].url,
      'https://cavos.xyz/blog/wallet-as-a-service',
    )
    assert.equal(
      data['@graph'][0].mainEntityOfPage['@id'],
      'https://cavos.xyz/blog/wallet-as-a-service',
    )
  })

  it('indexes the embedded wallet React SDK guide as an Article with FAQ JSON-LD', () => {
    const postPath = path.join(
      process.cwd(),
      'content/blog/embedded-wallet-react-sdk.mdx',
    )
    assert.equal(fs.existsSync(postPath), true)
    const source = fs.readFileSync(postPath, 'utf8')
    const excerptMatch = source.match(/^excerpt:\s*"(.*)"$/m)
    assert.ok(excerptMatch)
    assert.ok(excerptMatch[1].length <= 155, excerptMatch[1].length)
    assert.ok(excerptMatch[1].length >= 140, excerptMatch[1].length)
    assert.match(source, /\[embedded wallet\]\(\/embedded-wallet\)/)
    assert.match(source, /\]\(\/blog\/how-to-add-an-embedded-wallet\)/)
    assert.match(source, /\]\(\/blog\/embedded-wallet-api\)/)
    assert.match(source, /embedded-starknet-wallet/)
    assert.match(source, /embedded-solana-wallet/)
    assert.match(source, /embedded-stellar-wallet/)
    assert.match(source, /\]\(\/pricing\)/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/react/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/quickstart/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/passkeys/)
    assert.match(source, /docs\.cavos\.xyz\/docs\/troubleshooting/)
    assert.match(source, /@cavos\/kit` 0\.4\.4/)
    assert.match(source, /npm install @cavos\/kit/)
    assert.match(source, /CavosProvider/)
    assert.match(source, /useCavos/)
    assert.match(source, /login\("google"\)/)
    assert.match(source, /sendOtp/)
    assert.match(source, /verifyOtp/)
    assert.match(source, /enrollPasskeyDefault/)
    assert.match(source, /approveDeviceWithPasskey/)
    assert.match(source, /paymasterApiKey/)
    assert.match(source, /network: "testnet"/)
    assert.match(source, /environment: "development"/)
    assert.match(source, /Gas Sponsorship in Any Token/)
    assert.match(source, /audited OpenZeppelin account contract/)
    assert.match(source, /AccountUpgradeable v3\.0\.0/)
    assert.match(source, /does not ship its own account implementation/)
    assert.match(source, /no on-chain device-signer list/)
    assert.match(source, /no on-chain social recovery/)
    assert.match(source, /device-native/)
    assert.match(source, /Cavos, LLC/)
    assert.match(source, /Free up to 1,000 wallets/)
    assert.match(source, /Essential at \$59\/mo/)
    assert.match(source, /Complete at \$139\/mo/)
    assert.match(source, /What is an embedded wallet React SDK\?/)
    assert.match(source, /How do I add an embedded wallet SDK to a React app\?/)
    assert.match(
      source,
      /What are best practices for embedding a wallet SDK in an app\?/,
    )
    assert.match(source, /Does the Cavos React SDK sponsor gas in any token\?/)
    assert.equal((source.match(/^\s+- question:/gm) ?? []).length, 4)
    assert.doesNotMatch(source, /audited Cavos/)
    assert.doesNotMatch(source, /Cavos custom account/)
    assert.doesNotMatch(source, /on-chain device approval/)
    assert.doesNotMatch(source, /This device must be approved first/)
    assert.doesNotMatch(source, /category:\s*"Release"/)
    assert.doesNotMatch(source, /robots:\s*noindex/)
    assert.equal(EMBEDDED_WALLET_REACT_SDK_PATH, '/blog/embedded-wallet-react-sdk')
    assert.equal(
      EMBEDDED_WALLET_REACT_SDK_TITLE,
      'Embedded Wallet React SDK: Best Practices (2026)',
    )
    assert.ok(`${EMBEDDED_WALLET_REACT_SDK_TITLE} | Cavos`.length <= 60)
    assert.equal(EMBEDDED_WALLET_REACT_SDK_TITLE.includes('| Cavos'), false)

    const fields = parseBlogFrontmatter(source)
    assert.equal(fields.title, EMBEDDED_WALLET_REACT_SDK_TITLE)
    assert.equal(fields.updated, '2026-10-30')
    assert.equal(fields.date, '2026-10-27')

    const hub = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-wallet/page.tsx'),
      'utf8',
    )
    assert.match(hub, /EMBEDDED_WALLET_REACT_SDK_PATH/)

    const reactGuide = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/how-to-add-an-embedded-wallet.mdx'),
      'utf8',
    )
    assert.match(reactGuide, /\]\(\/blog\/embedded-wallet-react-sdk\)/)
    const apiGuide = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/embedded-wallet-api.mdx'),
      'utf8',
    )
    assert.match(apiGuide, /\]\(\/blog\/embedded-wallet-react-sdk\)/)

    const data = blogPostJsonLd({
      title: EMBEDDED_WALLET_REACT_SDK_TITLE,
      description: excerptMatch[1],
      path: EMBEDDED_WALLET_REACT_SDK_PATH,
      datePublished: '2026-10-27',
      dateModified: '2026-10-27',
      type: 'Article',
      faq: [
        {
          question: 'What is an embedded wallet React SDK?',
          answer:
            'The library that provisions a wallet inside a React or Next.js app.',
        },
        {
          question: 'How do I add an embedded wallet SDK to a React app?',
          answer: 'Install @cavos/kit and wrap CavosProvider.',
        },
        {
          question: 'What are best practices for embedding a wallet SDK in an app?',
          answer: 'Keep keys on the device, enroll a passkey, sponsor gas, handle errors, test on testnet.',
        },
        {
          question: 'Does the Cavos React SDK sponsor gas in any token?',
          answer: 'Cavos frames this as Gas Sponsorship in Any Token.',
        },
      ],
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        {
          name: EMBEDDED_WALLET_REACT_SDK_TITLE,
          path: EMBEDDED_WALLET_REACT_SDK_PATH,
        },
      ],
    })
    const json = JSON.stringify(data)
    JSON.parse(json)
    assert.equal(data['@graph'][0]['@type'], 'Article')
    assert.equal(data['@graph'][0].dateModified, '2026-10-27')
    assert.equal(data['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(data['@graph'][2]['@type'], 'FAQPage')
    assert.equal(data['@graph'][2].mainEntity.length, 4)
    assert.equal(
      data['@graph'][0].url,
      'https://cavos.xyz/blog/embedded-wallet-react-sdk',
    )
    assert.equal(
      data['@graph'][0].mainEntityOfPage['@id'],
      'https://cavos.xyz/blog/embedded-wallet-react-sdk',
    )
  })

  it('indexes the Alchemy vs Privy guide as an Article with FAQ JSON-LD', () => {
    const postPath = path.join(process.cwd(), 'content/blog/alchemy-vs-privy.mdx')
    assert.equal(fs.existsSync(postPath), true)
    const source = fs.readFileSync(postPath, 'utf8')
    const excerptMatch = source.match(/^excerpt:\s*"(.*)"$/m)
    assert.ok(excerptMatch)
    assert.ok(excerptMatch[1].length <= 155, excerptMatch[1].length)
    assert.ok(excerptMatch[1].length >= 140, excerptMatch[1].length)
    assert.match(source, /\[embedded wallet\]\(\/embedded-wallet\)/)
    assert.match(source, /\]\(\/compare\/alchemy\)/)
    assert.match(source, /\]\(\/compare\/privy\)/)
    assert.match(source, /\[Privy alternatives\]\(\/privy-alternatives\)/)
    assert.match(source, /\]\(\/blog\/privy-vs-turnkey\)/)
    assert.match(source, /<table>/)
    assert.doesNotMatch(source, /\|---/)
    assert.match(source, /Account Kit/)
    assert.match(source, /deprecated/)
    assert.match(source, /Wallet APIs/)
    assert.match(source, /recommend Privy/)
    assert.match(source, /18 June 2026/)
    assert.match(source, /alchemy\.com\/docs\/wallets\/account-kit-deprecated/)
    assert.match(source, /alchemy\.com\/docs\/wallets/)
    assert.match(source, /alchemy\.com\/docs\/changelog\/2026\/6\/18/)
    assert.match(source, /alchemy\.com\/docs\/reference\/pricing-plans/)
    assert.match(source, /audited OpenZeppelin account contract/)
    assert.match(source, /device-native/)
    assert.match(source, /Cavos, LLC/)
    assert.match(source, /no on-chain device-signer list/)
    assert.match(source, /no on-chain social recovery/)
    assert.match(source, /does not ship its own account implementation/)
    assert.match(source, /Free up to 1,000 wallets/)
    assert.match(source, /Essential at \$59\/mo/)
    assert.match(source, /Complete at \$139\/mo/)
    assert.match(source, /What is the difference between Alchemy and Privy\?/)
    assert.match(source, /Is Alchemy Account Kit still supported\?/)
    assert.match(source, /Does Alchemy recommend Privy as a signer\?/)
    assert.match(source, /When should I choose Cavos instead of Alchemy or Privy\?/)
    assert.equal((source.match(/^\s+- question:/gm) ?? []).length, 4)
    assert.doesNotMatch(source, /audited Cavos/)
    assert.doesNotMatch(source, /Cavos custom account/)
    assert.doesNotMatch(source, /on-chain device approval/)
    assert.doesNotMatch(source, /category:\s*"Release"/)
    assert.doesNotMatch(source, /robots:\s*noindex/)
    assert.equal(ALCHEMY_VS_PRIVY_PATH, '/blog/alchemy-vs-privy')
    assert.equal(
      ALCHEMY_VS_PRIVY_TITLE,
      'Alchemy vs Privy: Pricing & Custody (2026)',
    )
    assert.ok(`${ALCHEMY_VS_PRIVY_TITLE} | Cavos`.length <= 60)
    assert.equal(ALCHEMY_VS_PRIVY_TITLE.includes('| Cavos'), false)

    const fields = parseBlogFrontmatter(source)
    assert.equal(fields.title, ALCHEMY_VS_PRIVY_TITLE)
    assert.equal(fields.updated, '2026-10-30')
    assert.equal(fields.date, '2026-10-27')

    const compareSource = fs.readFileSync(
      path.join(process.cwd(), 'app/compare/[slug]/page.tsx'),
      'utf8',
    )
    assert.match(compareSource, /ALCHEMY_VS_PRIVY_PATH/)
    assert.match(compareSource, /slug === 'alchemy'/)

    const privyVsTurnkey = fs.readFileSync(
      path.join(process.cwd(), 'content/blog/privy-vs-turnkey.mdx'),
      'utf8',
    )
    assert.match(privyVsTurnkey, /\]\(\/blog\/alchemy-vs-privy\)/)

    const data = blogPostJsonLd({
      title: ALCHEMY_VS_PRIVY_TITLE,
      description: excerptMatch[1],
      path: ALCHEMY_VS_PRIVY_PATH,
      datePublished: '2026-10-27',
      dateModified: '2026-10-27',
      type: 'Article',
      faq: [
        {
          question: 'What is the difference between Alchemy and Privy?',
          answer:
            'Alchemy Wallet APIs are a transaction layer. Privy is a finished auth and embedded wallet product.',
        },
        {
          question: 'Is Alchemy Account Kit still supported?',
          answer: 'No. Account Kit is deprecated. Wallet APIs are the successor.',
        },
        {
          question: 'Does Alchemy recommend Privy as a signer?',
          answer: 'Yes. Alchemy recommends Privy or another provider for signer support.',
        },
        {
          question: 'When should I choose Cavos instead of Alchemy or Privy?',
          answer:
            'When the chain is Starknet, Solana, or Stellar and the review requires a device-native key.',
        },
      ],
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        {
          name: ALCHEMY_VS_PRIVY_TITLE,
          path: ALCHEMY_VS_PRIVY_PATH,
        },
      ],
    })
    const json = JSON.stringify(data)
    JSON.parse(json)
    assert.equal(data['@graph'][0]['@type'], 'Article')
    assert.equal(data['@graph'][0].dateModified, '2026-10-27')
    assert.equal(data['@graph'][1]['@type'], 'BreadcrumbList')
    assert.equal(data['@graph'][2]['@type'], 'FAQPage')
    assert.equal(data['@graph'][2].mainEntity.length, 4)
    assert.equal(data['@graph'][0].url, 'https://cavos.xyz/blog/alchemy-vs-privy')
    assert.equal(
      data['@graph'][0].mainEntityOfPage['@id'],
      'https://cavos.xyz/blog/alchemy-vs-privy',
    )
  })

  it('makes /blog an indexable landing page with crawlable guide links', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'app/blog/page.tsx'),
      'utf8',
    )
    assert.match(source, /Embedded Wallet Guides/)
    assert.match(source, /href: '\/embedded-wallet'/)
    assert.match(source, /title: 'Embedded wallet'/)
    assert.match(source, /EMBEDDED_WALLET_INTEGRATION_PATH/)
    assert.match(source, /EMBEDDED_WALLET_VS_EXTENSION_PATH/)
    assert.match(source, /STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH/)
    assert.match(source, /GASLESS_STARKNET_TRANSACTIONS_PATH/)
    assert.match(source, /EMBEDDED_WALLET_PROVIDERS_PATH/)
    assert.match(source, /PRIVY_VS_TURNKEY_PATH/)
    assert.match(source, /EMBEDDED_WALLET_API_PATH/)
    assert.match(source, /NON_CUSTODIAL_EMBEDDED_WALLET_PATH/)
    assert.match(source, /WALLET_AS_A_SERVICE_PATH/)
    assert.match(source, /EMBEDDED_WALLET_REACT_SDK_PATH/)
    assert.match(source, /ALCHEMY_VS_PRIVY_PATH/)
    assert.match(source, /href: '\/compare'/)
    assert.match(source, /href: '\/custody'/)
    assert.match(source, /href: '\/privy-alternatives'/)
    assert.match(source, /href: '\/turnkey-alternatives'/)
    assert.match(source, /href: '\/dynamic-alternatives'/)
    assert.match(source, /href: '\/magic-alternatives'/)
    assert.match(source, /href: '\/embedded-starknet-wallet'/)
    assert.match(source, /href: '\/embedded-solana-wallet'/)
    assert.match(source, /href: '\/embedded-stellar-wallet'/)
    assert.match(source, /href="\/blog\/cavos-kit-0-5-0"/)
    assert.match(
      source,
      /Classic G… account, one Ed25519 key from the MasterDEK, sponsored reserves and fees\./,
    )
    assert.doesNotMatch(source, /Horizon ed25519 signers/)
    const meta = marketingPageMetadata({
      title: 'Embedded Wallet Guides & Product Updates',
      description:
        'How to add an embedded wallet to a React app, plus Cavos product updates for the self-custodial SDK on Starknet, Solana, and Stellar.',
      path: '/blog',
    })
    assert.equal(meta.alternates?.canonical, 'https://cavos.xyz/blog')
  })

  it('deepens chain landing pages with FAQPage JSON-LD and cluster links', () => {
    const chains = [
      {
        name: 'Starknet',
        relative: 'app/embedded-starknet-wallet/page.tsx',
        path: STARKNET_WALLET_PATH,
        title: STARKNET_WALLET_TITLE,
        description: STARKNET_WALLET_DESCRIPTION,
        faq: STARKNET_FAQ,
        otherChains: ['/embedded-solana-wallet', '/embedded-stellar-wallet'],
        requiredClaims: [/OpenZeppelin/, /MasterDEK/, /paymaster/],
        guideHref: '/blog/gasless-starknet-transactions',
      },
      {
        name: 'Solana',
        relative: 'app/embedded-solana-wallet/page.tsx',
        path: SOLANA_WALLET_PATH,
        title: SOLANA_WALLET_TITLE,
        description: SOLANA_WALLET_DESCRIPTION,
        faq: SOLANA_FAQ,
        otherChains: ['/embedded-starknet-wallet', '/embedded-stellar-wallet'],
        requiredClaims: [/Ed25519/, /MasterDEK/, /executeInstructions/],
        guideHref: '/blog/how-to-add-an-embedded-wallet',
      },
      {
        name: 'Stellar',
        relative: 'app/embedded-stellar-wallet/page.tsx',
        path: STELLAR_WALLET_PATH,
        title: STELLAR_WALLET_TITLE,
        description: STELLAR_WALLET_DESCRIPTION,
        faq: STELLAR_FAQ,
        otherChains: ['/embedded-starknet-wallet', '/embedded-solana-wallet'],
        requiredClaims: [/MasterDEK/, /classic G/, /invokeContract/, /Gas Sponsorship in Any Token/],
        guideHref: '/blog/stellar-embedded-wallet-tutorial',
      },
    ] as const

    for (const chain of chains) {
      const source = fs.readFileSync(path.join(process.cwd(), chain.relative), 'utf8')
      assert.match(source, /chainWalletPageJsonLd/)
      assert.match(source, /type: 'article'/)
      assert.match(source, /CHAIN_WALLET_MODIFIED/)
      assert.match(
        source,
        /href=["']\/embedded-wallet["'][^>]*>\s*embedded wallet\s*</,
        `${chain.name} missing embedded wallet hub link`,
      )
      assert.match(source, /href=["']\/blog\/how-to-add-an-embedded-wallet["']/)
      assert.match(source, /href=["']\/blog\/embedded-wallet-api["']/)
      assert.match(source, /href=["']\/blog\/wallet-as-a-service["']/)
      assert.match(source, /href=["']\/compare["']/)
      assert.match(source, /href=["']\/pricing["']/)
      assert.match(
        source,
        /href=["']\/privy-alternatives["']/,
        `${chain.name} missing /privy-alternatives link`,
      )
      assert.match(source, new RegExp(`href=["']${chain.guideHref}["']`))
      for (const href of chain.otherChains) {
        assert.match(source, new RegExp(`href=["']${href}["']`))
      }
      assert.doesNotMatch(source, /needs-device-approval/)
      assert.doesNotMatch(source, /session key|sessionKey|session-key/)
      assert.doesNotMatch(source, /DeviceAccount|add_signer|removeDevice|sendMagicLink/)
      assert.doesNotMatch(source, /Cavos custom account/)
      assert.doesNotMatch(source, /audited Cavos/)
      assert.doesNotMatch(source, /Horizon signer|grandfathered/)
      for (const claim of chain.requiredClaims) {
        assert.match(source, claim, `${chain.name} missing ${claim}`)
      }

      assert.equal(chain.faq.length, 4)
      const data = chainWalletPageJsonLd({
        title: chain.title,
        description: chain.description,
        path: chain.path,
        softwareName: `Cavos Embedded ${chain.name} Wallet`,
        softwareDescription: chain.description,
        applicationSubCategory: `Embedded ${chain.name} Wallet SDK`,
        featureList: ['React and React Native SDKs'],
        datePublished: CHAIN_WALLET_PUBLISHED,
        dateModified: CHAIN_WALLET_MODIFIED,
        crumbName: `Embedded ${chain.name} Wallet`,
        faq: [...chain.faq],
      })
      const graph = data['@graph']
      assert.equal(graph[0]['@type'], 'WebPage')
      assert.equal(graph[0].dateModified, CHAIN_WALLET_MODIFIED)
      assert.equal(graph[1]['@type'], 'SoftwareApplication')
      assert.equal(graph[2]['@type'], 'BreadcrumbList')
      assert.equal(graph[3]['@type'], 'FAQPage')
      assert.deepEqual(
        graph[3].mainEntity.map((item: { name: string; acceptedAnswer: { text: string } }) => ({
          question: item.name,
          answer: item.acceptedAnswer.text,
        })),
        chain.faq,
      )
    }

    const hub = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-wallet/page.tsx'),
      'utf8',
    )
    assert.match(hub, /href=["']\/embedded-starknet-wallet["']/)
    assert.match(hub, /href=["']\/embedded-solana-wallet["']/)
    assert.match(hub, /href=["']\/embedded-stellar-wallet["']/)
    assert.match(hub, /Chain considerations/)
    assert.match(hub, /Gas Sponsorship in Any Token/)
    assert.ok(
      !STELLAR_FAQ.some((item) => /Horizon signer/i.test(item.question)),
      'Stellar FAQ must not mention Horizon signers',
    )
    assert.ok(
      !STELLAR_FAQ.some((item) => /grandfathered|Horizon signer/i.test(item.answer)),
      'Stellar FAQ answers must not mention grandfathered wallets or Horizon signers',
    )
    assert.deepEqual(STARKNET_FAQ, STARKNET_WALLET_FAQ)
    assert.deepEqual(SOLANA_FAQ, SOLANA_WALLET_FAQ)
    assert.deepEqual(STELLAR_FAQ, STELLAR_WALLET_FAQ)
  })

  it('rewrites /pricing title, FAQ, and Product Offer JSON-LD for CTR', () => {
    assert.equal(PRICING_PATH, '/pricing')
    assert.equal(PRICING_TITLE, 'Embedded Wallet Pricing (2026): Free to $139')
    assert.equal(PRICING_TITLE.includes('| Cavos'), false)
    assert.match(PRICING_TITLE, /Embedded Wallet Pricing/)
    assert.match(PRICING_TITLE, /2026/)
    const fullTitle = `${PRICING_TITLE} | Cavos`
    assert.ok(fullTitle.length <= 60, `pricing SERP title length ${fullTitle.length}: ${fullTitle}`)
    assert.ok(
      PRICING_DESCRIPTION.length >= 140 && PRICING_DESCRIPTION.length <= 155,
      String(PRICING_DESCRIPTION.length),
    )
    assert.match(PRICING_DESCRIPTION, /^Embedded wallet pricing/)
    assert.match(PRICING_DESCRIPTION, /2026/)
    assert.match(PRICING_DESCRIPTION, /Free up to 1,000 wallets/)
    assert.match(PRICING_DESCRIPTION, /Essential \$59\/month/)
    assert.match(PRICING_DESCRIPTION, /Complete \$139\/month/)
    assert.doesNotMatch(PRICING_DESCRIPTION, /—/)

    const meta = marketingPageMetadata({
      title: PRICING_TITLE,
      description: PRICING_DESCRIPTION,
      path: PRICING_PATH,
    })
    assert.equal(meta.title, PRICING_TITLE)
    assert.equal(meta.openGraph?.title, fullTitle)
    assert.equal(meta.twitter?.title, fullTitle)
    assert.equal(meta.description, PRICING_DESCRIPTION)
    assert.equal(meta.alternates?.canonical, 'https://cavos.xyz/pricing')

    assert.equal(PRICING_FAQ.length, 6)
    const joined = PRICING_FAQ.map((item) => `${item.q} ${item.a}`).join(' ')
    assert.match(joined, /Free covers up to 1,000 wallets/)
    assert.match(joined, /Essential is \$59\/month/)
    assert.match(joined, /Complete is \$139\/month/)
    assert.match(joined, /cheapest way to create wallets for millions/)
    assert.match(joined, /pricing transparency in embedded wallets/)
    assert.match(joined, /This page does not claim a lowest market price/)

    const source = fs.readFileSync(path.join(process.cwd(), 'app/pricing/page.tsx'), 'utf8')
    assert.match(source, /PRICING_TITLE/)
    assert.match(source, /PRICING_FAQ/)
    assert.match(source, /pricingPageJsonLd/)
    assert.match(source, /href=["']\/embedded-wallet["']/)
    assert.match(source, /href=["']\/embedded-starknet-wallet["']/)
    assert.match(source, /href=["']\/embedded-solana-wallet["']/)
    assert.match(source, /href=["']\/embedded-stellar-wallet["']/)
    assert.match(source, /href=["']\/privy-alternatives["']/)
    assert.doesNotMatch(source, /session key|sessionKey|session-key/)
    assert.doesNotMatch(source, /audited Cavos/)
    assert.doesNotMatch(source, /Horizon signer|grandfathered/)

    const jsonLd = pricingPageJsonLd({
      plans: [
        { name: 'Free', feeUsdPerMonth: 0, createCap: 1000 },
        { name: 'Essential', feeUsdPerMonth: 59, createCap: 'unlimited' },
        { name: 'Complete', feeUsdPerMonth: 139, createCap: 'unlimited' },
      ],
      faq: [...PRICING_FAQ],
    })
    const product = jsonLd['@graph'].find(
      (node: { '@type'?: string }) => node['@type'] === 'Product',
    )
    assert.ok(product)
    assert.equal(product.offers.length, 3)
    assert.equal(product.offers[0].price, '0')
    assert.equal(product.offers[1].price, '59')
    assert.equal(product.offers[2].price, '139')
    assert.equal(product.offers[0].priceCurrency, 'USD')
    const faq = jsonLd['@graph'].find((node: { '@type'?: string }) => node['@type'] === 'FAQPage')
    assert.ok(faq)
    assert.equal(faq.mainEntity.length, 6)
    assert.equal(faq.mainEntity[0].name, PRICING_FAQ[0].q)
    assert.equal(faq.mainEntity[0].acceptedAnswer.text, PRICING_FAQ[0].a)
  })

  it('gives each Product/SoftwareApplication node offers.price and priceCurrency, or no offers', () => {
    const offer = freeTierOfferJsonLd({
      url: 'https://cavos.xyz/pricing',
      description: 'Free tier covers the first 1,000 wallet creates.',
    })
    assert.equal(offer.price, '0')
    assert.equal(offer.priceCurrency, 'USD')
    assert.equal(offer.availability, OFFER_AVAILABILITY)

    const pricing = pricingPageJsonLd({
      plans: [
        { name: 'Free', feeUsdPerMonth: 0, createCap: 1000 },
        { name: 'Essential', feeUsdPerMonth: 59, createCap: 'unlimited' },
        { name: 'Complete', feeUsdPerMonth: 139, createCap: 'unlimited' },
      ],
      faq: [{ q: 'Can I cancel anytime?', a: 'Yes. Paid plans are month-to-month.' }],
    })

    const graphs: unknown[] = [
      homepageJsonLd(),
      aboutPageJsonLd(),
      sitewideJsonLd(),
      walletSoftwareApplicationJsonLd(),
      ...cavosProductApplicationsJsonLd(),
      compareIndexJsonLd({
        title: 'Cavos vs Embedded Wallet Providers',
        description: 'Compare embedded wallet approaches.',
        faq: [{ question: 'Does Cavos use MPC?', answer: 'No.' }],
        comparisons: COMPETITORS.map((competitor) => ({
          name: competitor.name,
          slug: competitor.slug,
          summary: competitor.summary,
        })),
      }),
      ...COMPETITORS.map((competitor) => compareCompetitorPageJsonLd(competitor)),
      chainWalletPageJsonLd({
        title: STARKNET_WALLET_TITLE,
        description: STARKNET_WALLET_DESCRIPTION,
        path: STARKNET_WALLET_PATH,
        softwareName: 'Cavos Embedded Starknet Wallet',
        softwareDescription: STARKNET_WALLET_DESCRIPTION,
        applicationSubCategory: 'Embedded Starknet Wallet SDK',
        featureList: ['React and React Native SDKs'],
        datePublished: CHAIN_WALLET_PUBLISHED,
        dateModified: CHAIN_WALLET_MODIFIED,
        crumbName: 'Embedded Starknet Wallet',
        faq: [...STARKNET_FAQ],
      }),
      pricing,
    ]

    let productLikeCount = 0
    for (const graph of graphs) {
      const nodes = walkJsonLdNodes(graph)
      for (const node of nodes) {
        const types = jsonLdTypes(node)
        const label = `${types.join(',')} ${String(node.name ?? node['@id'] ?? '')}`
        assertProductLikeOffers(node, label)
        if (!types.some((type) => PRODUCT_LIKE_TYPES.has(type))) continue
        productLikeCount += 1
        assert.equal('aggregateRating' in node, false, `${label} must not invent aggregateRating`)
        assert.equal('review' in node, false, `${label} must not invent review`)
        const names = [node.name, ...(Array.isArray(node.alternateName) ? node.alternateName : [node.alternateName])]
          .filter(Boolean)
          .map(String)
        for (const competitor of COMPETITORS) {
          assert.equal(
            names.includes(competitor.name),
            false,
            `competitor ${competitor.name} must not be a Product/SoftwareApplication`,
          )
        }
      }
    }
    assert.ok(productLikeCount > 0)

    const product = pricing['@graph'].find(
      (node: { '@type'?: string }) => node['@type'] === 'Product',
    )
    assert.ok(product)
    assert.equal(
      pricing['@graph'].filter((node: { '@type'?: string }) => node['@type'] === 'Brand').length,
      2,
    )
    assert.equal(product.offers.length, 3)
    assert.equal(product.offers[0].price, '0')
    assert.equal(product.offers[0].priceCurrency, 'USD')
    assert.equal(product.offers[0].availability, OFFER_AVAILABILITY)
    assert.equal(product.offers[1].price, '59')
    assert.equal(product.offers[1].availability, OFFER_AVAILABILITY)
    assert.equal(product.offers[2].price, '139')
    assert.equal(product.offers[2].availability, OFFER_AVAILABILITY)
  })

  it('lists comparison subjects as ItemList entries without Product fields', () => {
    const privy = getCompetitor('privy')
    assert.ok(privy)
    assert.ok(getCompetitor('alchemy'))
    const turnkeyCompetitor = getCompetitor('turnkey')
    assert.ok(turnkeyCompetitor)
    assert.match(turnkeyCompetitor.pageTitle ?? '', /Cavos vs Turnkey \(2026\): Embedded Wallet/)
    assert.match(turnkeyCompetitor.pageH1 ?? '', /embedded wallet compared/)
    assert.match(turnkeyCompetitor.pageDescription ?? '', /Turnkey vs Privy/)
    assert.match(turnkeyCompetitor.pageDescription ?? '', /Turnkey alternatives/)
    assert.ok(
      turnkeyCompetitor.faq.some(
        (item) => item.question === 'Who are Turnkey embedded wallet competitors?',
      ),
    )
    assert.ok(
      turnkeyCompetitor.faq.some((item) => item.question === 'What is Turnkey vs Privy?'),
    )
    const web3auth = getCompetitor('web3auth')
    const dynamicCompetitor = getCompetitor('dynamic')
    assert.ok(web3auth)
    assert.ok(dynamicCompetitor)
    assert.ok(
      web3auth.faq.some(
        (item) => item.question === 'How do Web3Auth and Dynamic embedded wallets compare?',
      ),
    )
    assert.ok(
      dynamicCompetitor.faq.some(
        (item) => item.question === 'How do Web3Auth and Dynamic embedded wallets compare?',
      ),
    )
    for (const competitor of COMPETITORS) {
      const title = competitor.pageTitle ?? `Cavos vs ${competitor.name} (2026): Pricing, Chains, Custody`
      const description =
        competitor.pageDescription ??
        `Cavos vs ${competitor.name} on pricing, chains, and custody. Free up to 1,000 wallets on Starknet, Solana, and Stellar.`
      const fullTitle = `${title} | Cavos`
      assert.ok(title.length <= 60, `${competitor.slug} title ${title.length}: ${title}`)
      assert.ok(fullTitle.length <= 60, `${competitor.slug} full title ${fullTitle.length}: ${fullTitle}`)
      assert.ok(description.length <= 155, `${competitor.slug} description ${description.length}`)
      assert.match(description, /1,000 wallets/)
      assert.ok(competitor.faq.length >= 3 && competitor.faq.length <= 6, `${competitor.slug} faq count ${competitor.faq.length}`)
      const jsonLd = compareCompetitorPageJsonLd(competitor)
      const faq = jsonLd['@graph'].find((node: { '@type'?: string }) => node['@type'] === 'FAQPage')
      assert.ok(faq)
      assert.equal(faq.mainEntity.length, competitor.faq.length)
    }
    const page = compareCompetitorPageJsonLd(privy)
    const json = JSON.stringify(page)
    JSON.parse(json)
    assert.doesNotMatch(json, /"@type":"Product"/)
    assert.doesNotMatch(json, /aggregateRating/)
    assert.doesNotMatch(json, /"@type":"Review"/)

    const list = page['@graph'].find(
      (node: { '@type'?: string }) => node['@type'] === 'ItemList',
    )
    assert.ok(list)
    assert.equal(list.itemListElement[0].name, 'Cavos')
    assert.equal(list.itemListElement[1].name, 'Privy')
    assert.equal('offers' in list.itemListElement[1], false)
    assert.equal('@type' in (list.itemListElement[1].item ?? {}), false)

    const index = compareIndexJsonLd({
      title: 'Cavos vs Embedded Wallet Providers',
      description: 'Compare providers.',
      faq: [{ question: 'Which blockchains does Cavos support?', answer: 'Starknet, Solana, and Stellar.' }],
      comparisons: COMPETITORS.map((competitor) => ({
        name: competitor.name,
        slug: competitor.slug,
        summary: competitor.summary,
      })),
    })
    const indexList = index['@graph'].find(
      (node: { '@type'?: string }) => node['@type'] === 'ItemList',
    )
    assert.ok(indexList)
    assert.deepEqual(
      indexList.itemListElement.map((item: { name: string; url: string }) => item.url),
      COMPETITORS.map((competitor) => `https://cavos.xyz/compare/${competitor.slug}`),
    )
    for (const item of indexList.itemListElement) {
      assert.equal(item['@type'], 'ListItem')
      assert.equal(item.item, undefined)
    }

    const compareIndexSource = fs.readFileSync(
      path.join(process.cwd(), 'app/compare/page.tsx'),
      'utf8',
    )
    const compareSlugSource = fs.readFileSync(
      path.join(process.cwd(), 'app/compare/[slug]/page.tsx'),
      'utf8',
    )
    const layoutSource = fs.readFileSync(path.join(process.cwd(), 'app/layout.tsx'), 'utf8')
    assert.match(compareIndexSource, /compareIndexJsonLd/)
    assert.match(compareSlugSource, /compareCompetitorPageJsonLd/)
    assert.match(layoutSource, /sitewideJsonLd/)
    assert.doesNotMatch(layoutSource, /SoftwareApplication.*Product|Product.*SoftwareApplication/)
  })

  it('gives each compare-page Product/SoftwareApplication node offers with price and priceCurrency', () => {
    assert.ok(COMPETITORS.some((competitor) => competitor.slug === 'magic'))
    assert.ok(COMPETITORS.some((competitor) => competitor.slug === 'alchemy'))

    const pages: unknown[] = [
      compareIndexJsonLd({
        title: 'Cavos vs Embedded Wallet Providers',
        description: 'Compare embedded wallet approaches.',
        faq: [{ question: 'Does Cavos use MPC?', answer: 'No.' }],
        comparisons: COMPETITORS.map((competitor) => ({
          name: competitor.name,
          slug: competitor.slug,
          summary: competitor.summary,
        })),
      }),
      ...COMPETITORS.map((competitor) => compareCompetitorPageJsonLd(competitor)),
    ]

    for (const page of pages) {
      const nodes = walkJsonLdNodes(page)
      const productLike = nodes.filter((node) =>
        jsonLdTypes(node).some((type) => PRODUCT_LIKE_TYPES.has(type)),
      )
      assert.ok(
        productLike.length > 0,
        'compare JSON-LD must emit a Cavos SoftwareApplication with offers',
      )
      for (const node of productLike) {
        const types = jsonLdTypes(node)
        const label = `${types.join(',')} ${String(node.name ?? node['@id'] ?? '')}`
        assert.equal(
          types.includes('SoftwareApplication'),
          true,
          `${label} should be SoftwareApplication`,
        )
        assert.equal(types.includes('Product'), false, `${label} should not also be Product`)
        assert.equal(
          node.applicationCategory,
          'DeveloperApplication',
          `${label} applicationCategory`,
        )
        assert.equal('aggregateRating' in node, false, `${label} must not invent aggregateRating`)
        assert.equal('review' in node, false, `${label} must not invent review`)
        assert.ok(node.offers != null, `${label} missing offers`)
        const offers = Array.isArray(node.offers) ? node.offers : [node.offers]
        assert.ok(offers.length > 0, `${label} has empty offers`)
        for (const offer of offers) {
          assert.equal(typeof offer, 'object', `${label} offer is not an object`)
          const fields = offer as Record<string, unknown>
          assert.ok(
            fields.price !== undefined && fields.price !== '',
            `${label} missing offers.price`,
          )
          assert.equal(
            typeof fields.priceCurrency,
            'string',
            `${label} missing offers.priceCurrency`,
          )
          assert.equal(fields.priceCurrency, 'USD', `${label} priceCurrency must be USD`)
        }
        assert.deepEqual(
          offers.map((offer) => String((offer as { price: unknown }).price)),
          ['0', '59', '139'],
        )
        const names = [
          node.name,
          ...(Array.isArray(node.alternateName) ? node.alternateName : [node.alternateName]),
        ]
          .filter(Boolean)
          .map(String)
        for (const competitor of COMPETITORS) {
          assert.equal(
            names.includes(competitor.name),
            false,
            `competitor ${competitor.name} must not be a Product/SoftwareApplication`,
          )
        }
      }
    }
  })

  it('adds crawlable docs links to the embedded-wallet cluster', () => {
    const docsRoot = path.join(process.cwd(), '..', 'docs')
    const shared = [
      ['[embedded wallet](https://cavos.xyz/embedded-wallet)', 'embedded wallet hub'],
      [
        '](https://cavos.xyz/blog/how-to-add-an-embedded-wallet)',
        'React integration guide',
      ],
      [
        '](https://cavos.xyz/blog/embedded-wallet-vs-browser-extension)',
        'vs-extension guide',
      ],
    ] as const
    const pages = [
      {
        relative: 'content/docs/index.mdx',
        extras: [
          'https://cavos.xyz/embedded-starknet-wallet',
          'https://cavos.xyz/embedded-solana-wallet',
          'https://cavos.xyz/embedded-stellar-wallet',
        ],
      },
      {
        relative: 'content/docs/quickstart.mdx',
        extras: [
          'https://cavos.xyz/embedded-starknet-wallet',
          'https://cavos.xyz/embedded-solana-wallet',
          'https://cavos.xyz/embedded-stellar-wallet',
        ],
      },
      {
        relative: 'content/docs/concepts.mdx',
        extras: [
          'https://cavos.xyz/embedded-starknet-wallet',
          'https://cavos.xyz/embedded-solana-wallet',
          'https://cavos.xyz/embedded-stellar-wallet',
        ],
      },
      {
        relative: 'content/docs/starknet.mdx',
        extras: ['https://cavos.xyz/embedded-starknet-wallet'],
      },
      {
        relative: 'content/docs/solana.mdx',
        extras: ['https://cavos.xyz/embedded-solana-wallet'],
      },
      {
        relative: 'content/docs/stellar.mdx',
        extras: ['https://cavos.xyz/embedded-stellar-wallet'],
      },
    ] as const

    for (const page of pages) {
      const source = fs.readFileSync(path.join(docsRoot, page.relative), 'utf8')
      for (const [needle, label] of shared) {
        assert.match(source, new RegExp(escapeRegExp(needle)), `${page.relative} missing ${label}`)
      }
      for (const href of page.extras) {
        assert.match(source, new RegExp(escapeRegExp(href)), `${page.relative} missing ${href}`)
      }
      assert.doesNotMatch(source, /audited Cavos/)
    }

    const home = fs.readFileSync(path.join(docsRoot, 'app/(home)/page.tsx'), 'utf8')
    assert.match(home, /href="https:\/\/cavos\.xyz\/embedded-wallet"/)
    assert.match(home, />\s*embedded wallet\s*</)
    assert.match(home, /href="https:\/\/cavos\.xyz\/embedded-starknet-wallet"/)
    assert.match(home, /href="https:\/\/cavos\.xyz\/embedded-solana-wallet"/)
    assert.match(home, /href="https:\/\/cavos\.xyz\/embedded-stellar-wallet"/)
    assert.match(home, /href="https:\/\/cavos\.xyz\/blog\/how-to-add-an-embedded-wallet"/)
    assert.match(home, /href="https:\/\/cavos\.xyz\/blog\/embedded-wallet-vs-browser-extension"/)
    const homeH1 = home.match(/<h1[\s\S]*?<\/h1>/)
    assert.ok(homeH1)
    assert.doesNotMatch(homeH1[0], /href=/)

    const layout = fs.readFileSync(path.join(docsRoot, 'app/layout.tsx'), 'utf8')
    assert.match(layout, /availability:\s*'https:\/\/schema\.org\/InStock'/)
  })

  it('lazy-loads the homepage 3D orb and pauses it offscreen without a poster', () => {
    const shell = fs.readFileSync(path.join(process.cwd(), 'components/HeroOrb.tsx'), 'utf8')
    const canvas = fs.readFileSync(path.join(process.cwd(), 'components/HeroOrbCanvas.tsx'), 'utf8')
    assert.match(shell, /next\/dynamic/)
    assert.match(shell, /ssr:\s*false/)
    assert.match(shell, /IntersectionObserver/)
    assert.match(shell, /visibilitychange/)
    assert.match(shell, /prefers-reduced-motion/)
    assert.doesNotMatch(shell, /HeroOrbPoster|SilkOrb|requestIdleCallback/)
    assert.doesNotMatch(shell, /@react-three\/fiber|from 'three'/)
    assert.match(canvas, /args=\{\[1\.5, 256, 256\]\}/)
    assert.match(canvas, /dpr=\{\[1, 2\]\}/)
    assert.match(canvas, /frameloop=\{playing \? 'always' : 'demand'\}/)
    assert.match(canvas, /resolution=\{256\}/)
    assert.match(canvas, /anisotropy = 8/)
    assert.doesNotMatch(canvas, /audited Cavos/)
  })

  it('rejects grandfathered Stellar copy and extra Horizon-signer language in marketing content', () => {
    const banned = [
      /grandfather/i,
      /extra Horizon signer/i,
      /second Horizon signer/i,
      /weight-1/,
      /nativeDek/,
      /generateRecoveryCode/,
      /setupRecovery\(/,
    ]
    const skipDir = new Set([
      'node_modules',
      '.next',
      'dashboard',
      'api',
      'stellar',
      'recovery',
      'oauth',
      'vault',
      'docs',
    ])
    const hits: string[] = []
    const stack = [process.cwd()]
    while (stack.length > 0) {
      const dir = stack.pop() as string
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (!skipDir.has(entry.name)) stack.push(full)
          continue
        }
        if (!/\.(tsx|ts|mdx|txt)$/.test(entry.name)) continue
        if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue
        const relative = path.relative(process.cwd(), full)
        if (relative.startsWith('lib/stellar/')) continue
        const text = fs.readFileSync(full, 'utf8')
        for (const pattern of banned) {
          if (pattern.test(text)) {
            hits.push(`${relative} matches ${pattern}`)
          }
        }
      }
    }
    assert.deepEqual(hits, [])

    const software = walletSoftwareApplicationJsonLd()
    assert.ok(software.featureList.includes('Gas Sponsorship in Any Token'))
    assert.equal(
      software.featureList.includes('Chain-specific gas sponsorship'),
      false,
    )

    const llms = fs.readFileSync(path.join(process.cwd(), 'public/llms.txt'), 'utf8')
    assert.match(llms, /Gas Sponsorship in Any Token/)
    assert.match(llms, /cavos-ed25519-stellar-v1/)
    assert.doesNotMatch(llms, /multisig account/)
    assert.doesNotMatch(llms, /recovery code/)
  })
})

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const GUIDE_PATH_CONSTANTS: Record<string, string> = {
  EMBEDDED_WALLET_INTEGRATION_PATH: '/blog/how-to-add-an-embedded-wallet',
  EMBEDDED_WALLET_VS_EXTENSION_PATH: '/blog/embedded-wallet-vs-browser-extension',
  STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH: '/blog/stellar-embedded-wallet-tutorial',
  GASLESS_STARKNET_TRANSACTIONS_PATH: '/blog/gasless-starknet-transactions',
  EMBEDDED_WALLET_PROVIDERS_PATH: '/blog/embedded-wallet-providers',
  PRIVY_VS_TURNKEY_PATH: '/blog/privy-vs-turnkey',
  EMBEDDED_WALLET_API_PATH: '/blog/embedded-wallet-api',
  NON_CUSTODIAL_EMBEDDED_WALLET_PATH: '/blog/non-custodial-embedded-wallet',
  WALLET_AS_A_SERVICE_PATH: '/blog/wallet-as-a-service',
  EMBEDDED_WALLET_REACT_SDK_PATH: '/blog/embedded-wallet-react-sdk',
  ALCHEMY_VS_PRIVY_PATH: '/blog/alchemy-vs-privy',
}

const SELF_PAGE_FOR_HREF: Record<string, string> = {
  '/blog/embedded-wallet-api': 'content/blog/embedded-wallet-api.mdx',
  '/blog/embedded-wallet-providers': 'content/blog/embedded-wallet-providers.mdx',
  '/blog/embedded-wallet-vs-browser-extension':
    'content/blog/embedded-wallet-vs-browser-extension.mdx',
  '/blog/how-to-add-an-embedded-wallet': 'content/blog/how-to-add-an-embedded-wallet.mdx',
  '/blog/non-custodial-embedded-wallet': 'content/blog/non-custodial-embedded-wallet.mdx',
  '/blog/privy-vs-turnkey': 'content/blog/privy-vs-turnkey.mdx',
  '/blog/stellar-embedded-wallet-tutorial': 'content/blog/stellar-embedded-wallet-tutorial.mdx',
  '/blog/gasless-starknet-transactions':
    'content/blog/gasless-starknet-transactions.mdx',
  '/blog/wallet-as-a-service': 'content/blog/wallet-as-a-service.mdx',
  '/blog/embedded-wallet-react-sdk': 'content/blog/embedded-wallet-react-sdk.mdx',
  '/blog/alchemy-vs-privy': 'content/blog/alchemy-vs-privy.mdx',
  '/privacy': 'app/privacy/page.tsx',
  '/dpa': 'app/dpa/page.tsx',
  '/user-privacy': 'app/user-privacy/page.tsx',
  '/user-terms': 'app/user-terms/page.tsx',
}

function marketingInlinkSources(target: string): string[] {
  const skipDir = new Set(['node_modules', '.next', 'dashboard', 'api'])
  const sources: string[] = []
  const stack = [process.cwd()]
  while (stack.length > 0) {
    const dir = stack.pop() as string
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!skipDir.has(entry.name)) stack.push(full)
        continue
      }
      if (!/\.(tsx|ts|mdx)$/.test(entry.name)) continue
      if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue
      if (
        ['marketing-sitemap.ts', 'marketing-seo.ts', 'sitemap.ts', 'robots.ts'].includes(
          entry.name,
        )
      ) {
        continue
      }
      const relative = path.relative(process.cwd(), full)
      if (SELF_PAGE_FOR_HREF[target] === relative) continue
      const text = fs.readFileSync(full, 'utf8')
      if (fileLinksTo(text, target)) sources.push(relative)
    }
  }
  return sources.sort()
}

function fileLinksTo(text: string, target: string): boolean {
  const escaped = escapeRegExp(target)
  const literals = [
    new RegExp(`href=["']${escaped}["']`),
    new RegExp(`href=\\{["']${escaped}["']\\}`),
    new RegExp(`\\]\\(${escaped}\\)`),
    new RegExp(`href:\\s*["']${escaped}["']`),
  ]
  if (literals.some((pattern) => pattern.test(text))) return true
  for (const [constant, href] of Object.entries(GUIDE_PATH_CONSTANTS)) {
    if (href !== target) continue
    if (new RegExp(`href=\\{${constant}\\}`).test(text)) return true
    if (new RegExp(`href:\\s*${constant}`).test(text)) return true
    if (new RegExp(`href=\\{[^}]*${constant}`).test(text)) return true
  }
  return false
}

describe('blog quote social cards', () => {
  it('uses a per-page image when one is passed', () => {
    const url = 'https://cavos.xyz/blog/example/opengraph-image'
    const meta = marketingPageMetadata({
      title: 'Example',
      description: 'Example post',
      path: '/blog/example',
      type: 'article',
      image: { url, width: 1200, height: 630, alt: 'Example quote' },
    })
    const og = meta.openGraph?.images as Array<{ url: string }>
    const tw = meta.twitter?.images as Array<{ url: string }>
    assert.equal(og[0].url, url)
    assert.equal(tw[0].url, url)
  })

  it('blog card image URLs carry a deterministic content version', () => {
    const meta = { title: 'Example', ogQuote: 'A quote', excerpt: 'Excerpt' }
    const url = blogOgImageUrl('https://cavos.xyz', 'example', meta)
    assert.match(url, /^https:\/\/cavos\.xyz\/blog\/example\/opengraph-image\?v=[0-9a-f]{8}$/)
    assert.equal(url, blogOgImageUrl('https://cavos.xyz', 'example', { ...meta }))
    assert.notEqual(blogOgVersion(meta), blogOgVersion({ ...meta, ogQuote: 'Another quote' }))
    assert.notEqual(blogOgVersion(meta), blogOgVersion({ ...meta, title: 'Other' }))
    const page = fs.readFileSync(path.join(process.cwd(), 'app/blog/[slug]/page.tsx'), 'utf-8')
    assert.match(page, /blogOgImageUrl\(/, 'blog post metadata must use the versioned card URL')
    assert.doesNotMatch(page, /opengraph-image`/, 'blog post metadata must not use an unversioned card URL')
  })

  it('every blog post carries an ogQuote within house copy rules', () => {
    const dir = path.join(process.cwd(), 'content/blog')
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
      const match = raw.match(/^ogQuote: "(.+)"$/m)
      assert.ok(match, `${file} is missing ogQuote`)
      const quote = match[1]
      assert.ok(quote.length <= 110, `${file} ogQuote is too long for the card`)
      assert.doesNotMatch(quote, /—|trustless|impossible/i, `${file} ogQuote breaks copy rules`)
    }
  })
})

describe('best embedded wallets per chain', () => {
  const slugs = [
    'best-embedded-wallets-stellar',
    'best-embedded-wallets-solana',
    'best-embedded-wallets-starknet',
  ]
  for (const slug of slugs) {
    it(`${slug} ships FAQ, ItemList, ogQuote, and clean copy`, () => {
      const source = fs.readFileSync(
        path.join(process.cwd(), `content/blog/${slug}.mdx`),
        'utf8',
      )
      assert.match(source, /^ogQuote:/m)
      assert.match(source, /^itemList:/m)
      assert.match(source, /^faq:/m)
      assert.match(source, /non-custodial embedded wallet for Starknet, Solana and Stellar/)
      assert.match(source, /\]\(\/pricing\)/)
      assert.match(source, /\]\(\/custody\)/)
      assert.doesNotMatch(source, /—/)
      assert.doesNotMatch(source, /trustless|impossible/i)
      const excerpt = source.match(/^excerpt:\s*"(.*)"$/m)
      assert.ok(excerpt && excerpt[1].length <= 160)
    })
  }

  it('emits ItemList JSON-LD with absolute URLs', () => {
    const data = blogPostJsonLd({
      title: 'Best Embedded Wallets for Stellar (2026)',
      description: 'x',
      path: '/blog/best-embedded-wallets-stellar',
      datePublished: '2026-10-29',
      itemList: [
        { name: 'Cavos', url: '/embedded-stellar-wallet' },
        { name: 'Dynamic', url: 'https://www.dynamic.xyz/docs' },
      ],
      crumbs: [{ name: 'Home', path: '/' }],
    })
    const list = data['@graph'].find(
      (node: Record<string, unknown>) => node['@type'] === 'ItemList',
    ) as { itemListElement: { position: number; url: string }[] }
    assert.ok(list)
    assert.equal(list.itemListElement[0].url, 'https://cavos.xyz/embedded-stellar-wallet')
    assert.equal(list.itemListElement[1].position, 2)
  })

  it('llms.txt leads with the positioning line and pricing', () => {
    const llms = fs.readFileSync(path.join(process.cwd(), 'public/llms.txt'), 'utf8')
    assert.match(llms, /> Cavos: non-custodial embedded wallet for Starknet, Solana and Stellar\./)
    assert.match(llms, /Free: up to 1,000 wallets/)
    assert.match(llms, /\$59/)
    assert.match(llms, /\$139/)
    assert.doesNotMatch(llms, /—|trustless/)
  })
})

it('chain landing pages link to their best-embedded-wallets shortlist', () => {
  for (const chain of ['solana', 'starknet', 'stellar']) {
    const src = fs.readFileSync(
      path.join(process.cwd(), `app/embedded-${chain}-wallet/page.tsx`),
      'utf8',
    )
    assert.ok(src.includes(`/blog/best-embedded-wallets-${chain}`), chain)
  }
})

describe('comparison copy style', () => {
  it('has no em-dashes in comparison and Privy alternatives copy', () => {
    for (const f of ['compare-data.ts', 'privy-alternatives.ts']) {
      const code = fs
        .readFileSync(path.join(process.cwd(), 'lib', f), 'utf8')
        .split('\n')
        .filter((l) => !l.trim().startsWith('//'))
        .join('\n')
      assert.ok(!code.includes('\u2014'), `${f} contains an em-dash`)
    }
  })
})

describe('embedded wallet definitional and API posts', () => {
  const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

  it('what-is-an-embedded-wallet is a definitional post with FAQ that points at the pillar', () => {
    const raw = read('content/blog/what-is-an-embedded-wallet.mdx')
    assert.match(raw, /^slug: "what-is-an-embedded-wallet"$/m)
    assert.match(raw, /^faq:$/m)
    assert.match(raw, /question: "What is an embedded wallet\?"/)
    assert.match(raw, /\]\(\/embedded-wallet\)/)
    assert.match(raw, /\]\(\/blog\/embedded-wallet-api\)/)
    assert.match(raw, /audited OpenZeppelin account contract/)
    assert.match(raw, /Gas Sponsorship in Any Token/)
    assert.match(raw, /Free up to 1,000 wallets/)
    assert.match(raw, /github\.com\/cavos-labs\/cavos-recovery/)
    assert.doesNotMatch(raw, /—|trustless|impossible/i)
  })

  it('the embedded wallet pillar, blog index, and llms.txt link the definitional post', () => {
    assert.match(read('app/embedded-wallet/page.tsx'), /WHAT_IS_AN_EMBEDDED_WALLET_PATH/)
    assert.match(read('app/blog/page.tsx'), /WHAT_IS_AN_EMBEDDED_WALLET_PATH/)
    assert.match(read('public/llms.txt'), /blog\/what-is-an-embedded-wallet/)
    assert.match(read('public/llms.txt'), /blog\/embedded-wallet-api/)
  })

  it('embedded-wallet-api opens with a runnable @cavos/kit example and house copy', () => {
    const raw = read('content/blog/embedded-wallet-api.mdx')
    assert.match(raw, /## The embedded wallet API in 15 lines/)
    assert.match(raw, /import \{ Cavos \} from "@cavos\/kit"/)
    assert.match(raw, /\/blog\/what-is-an-embedded-wallet/)
    assert.match(raw, /Free up to 1,000 wallets/)
    assert.doesNotMatch(raw, /—|trustless/i)
  })
})
