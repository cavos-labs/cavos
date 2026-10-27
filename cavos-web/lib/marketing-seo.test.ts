import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
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
  SOLANA_WALLET_DESCRIPTION,
  SOLANA_WALLET_PATH,
  SOLANA_WALLET_TITLE,
  STARKNET_WALLET_DESCRIPTION,
  STARKNET_WALLET_FAQ,
  STARKNET_WALLET_PATH,
  STARKNET_WALLET_TITLE,
  STELLAR_WALLET_DESCRIPTION,
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
} from './embedded-wallet-guide'
import {
  COMPETITORS,
  EMBEDDED_WALLET_MARKET_NOTE,
  embeddedWalletProviderRows,
  getCompetitor,
} from './compare-data'
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

  it('builds BlogPosting JSON-LD that references the organization node by @id', () => {
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
    assert.equal(posting['@type'], 'BlogPosting')
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
    assert.match(EMBEDDED_WALLET_TITLE, /Embedded Wallet: What It Is/)
    assert.match(EMBEDDED_WALLET_TITLE, /How to Choose an SDK \(2026\)/)
    assert.ok(EMBEDDED_WALLET_DESCRIPTION.length > 0)
    assert.ok(EMBEDDED_WALLET_DESCRIPTION.length <= 155)
    assert.equal(EMBEDDED_WALLET_PATH, '/embedded-wallet')
    assert.ok(EMBEDDED_WALLET_FAQ.length >= 8 && EMBEDDED_WALLET_FAQ.length <= 10)
    assert.ok(EMBEDDED_WALLET_FAQ.some((item) => item.question === 'What is an embedded wallet SDK?'))
    assert.ok(
      EMBEDDED_WALLET_FAQ.some(
        (item) => item.question === 'Which chains does Cavos support for embedded wallets?',
      ),
    )
    assert.equal(EMBEDDED_WALLET_MODIFIED, '2026-10-26')
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
    assert.match(pageSource, /audited OpenZeppelin AccountUpgradeable/)
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
    assert.ok(headings.includes('What is an embedded wallet?'))
    assert.ok(headings.includes('How an embedded wallet works'))
    assert.ok(headings.includes('Embedded wallet SDK'))
    assert.ok(headings.includes('Gas Sponsorship in Any Token'))
    assert.ok(headings.includes('How to integrate an embedded wallet'))
    assert.ok(headings.includes('Embedded wallet provider comparison'))
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
    assert.match(PRIVY_ALTERNATIVES_TITLE, /2026/)
    assert.match(PRIVY_ALTERNATIVES_TITLE, /5 Privy Alternatives/)
    assert.match(PRIVY_ALTERNATIVES_TITLE, /Free 1,000 Wallets/)
    assert.match(PRIVY_ALTERNATIVES_H1, /Privy alternatives/)
    assert.match(PRIVY_ALTERNATIVES_H1, /5 Privy alternatives/)
    assert.match(PRIVY_ALTERNATIVES_DESCRIPTION, /Shopify/)
    assert.match(PRIVY_ALTERNATIVES_DESCRIPTION, /Privy alternatives/)
    assert.match(PRIVY_ALTERNATIVES_DESCRIPTION, /Cavos, Dynamic, Turnkey, Web3Auth, Magic/)
    assert.match(PRIVY_ALTERNATIVES_DESCRIPTION, /Starknet, Solana, Stellar/)
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
    assert.equal(PRIVY_ALTERNATIVES_MODIFIED, '2026-10-27')
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
    const dataSource = fs.readFileSync(
      path.join(process.cwd(), 'lib/privy-alternatives.ts'),
      'utf8',
    )
    assert.match(pageSource, /guidePageJsonLd/)
    assert.match(pageSource, /privyAlternativesItemList/)
    assert.match(pageSource, /embeddedWalletProviderRows/)
    assert.match(pageSource, /href=["']\/pricing["']/)
    assert.match(pageSource, /Why teams look for a Privy alternative/)
    assert.match(pageSource, /How to choose a Privy alternative/)
    assert.match(pageSource, /relatedLinks/)
    assert.match(
      pageSource,
      /Cavos, Dynamic, Turnkey, Web3Auth, and Magic are the five Privy/,
    )
    assert.equal((pageSource.match(/<h1[\s>]/g) ?? []).length, 1)

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
    assert.match(pageSource, /PRIVY_VS_TURNKEY_PATH/)
    assert.match(dataSource, /PRIVY_VS_TURNKEY_PATH/)
    const turnkey = PRIVY_ALTERNATIVE_SECTIONS.find((section) => section.name === 'Turnkey')
    assert.ok(turnkey)
    assert.deepEqual(
      (turnkey.relatedLinks ?? []).map((link) => link.href),
      [PRIVY_VS_TURNKEY_PATH],
    )
    const dynamic = PRIVY_ALTERNATIVE_SECTIONS.find((section) => section.name === 'Dynamic')
    assert.ok(dynamic)
    assert.deepEqual(
      (dynamic.relatedLinks ?? []).map((link) => link.href),
      [EMBEDDED_WALLET_VS_EXTENSION_PATH],
    )

    const privy = getCompetitor('privy')
    assert.ok(privy)
    assert.match(privy.pageTitle ?? '', /Cavos vs Privy \(2026\): Pricing, Chains, Custody/)
    assert.match(privy.pageH1 ?? '', /Privy wallet alternative/)
    assert.match(privy.pageDescription ?? '', /Shopify/)
    assert.match(privy.pageDescription ?? '', /1,000 wallets/)
    assert.match(privy.rows.find((row) => row.feature === 'Account model')?.cavos ?? '', /audited OpenZeppelin/i)
    assert.doesNotMatch(JSON.stringify(privy.rows), /PDA/)
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

  it('keeps chain page titles unchanged and descriptions inside snippet bounds', () => {
    const chains = [
      {
        title: STARKNET_WALLET_TITLE,
        description: STARKNET_WALLET_DESCRIPTION,
        path: STARKNET_WALLET_PATH,
        name: 'Starknet',
        expectedTitle: 'Embedded Starknet Wallet SDK',
      },
      {
        title: SOLANA_WALLET_TITLE,
        description: SOLANA_WALLET_DESCRIPTION,
        path: SOLANA_WALLET_PATH,
        name: 'Solana',
        expectedTitle: 'Embedded Solana Wallet SDK',
      },
      {
        title: STELLAR_WALLET_TITLE,
        description: STELLAR_WALLET_DESCRIPTION,
        path: STELLAR_WALLET_PATH,
        name: 'Stellar',
        expectedTitle: 'Embedded Stellar Wallet SDK',
      },
    ]

    for (const chain of chains) {
      assert.equal(chain.title, chain.expectedTitle)
      assert.ok(
        chain.description.length >= 140 && chain.description.length <= 158,
        `${chain.name} description length ${chain.description.length} is outside 140-158`,
      )
      assert.match(chain.description, new RegExp(`^${chain.name}`))
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
      assert.equal(meta.description, chain.description)
      assert.equal(meta.openGraph?.description, chain.description)
      assert.equal(meta.twitter?.description, chain.description)
    }

    assert.match(STARKNET_WALLET_DESCRIPTION, /Audited OpenZeppelin AccountUpgradeable/)
    assert.doesNotMatch(STARKNET_WALLET_DESCRIPTION, /audited Cavos/)
    assert.ok(STARKNET_WALLET_FAQ.length >= 3)
    assert.ok(
      STARKNET_WALLET_FAQ.some((item) =>
        /audited OpenZeppelin account contract/i.test(item.answer),
      ),
    )
    assert.equal(
      STARKNET_WALLET_FAQ.some((item) => /audited Cavos/i.test(`${item.question} ${item.answer}`)),
      false,
    )
    assert.ok(
      STARKNET_FAQ.some((item) => /audited OpenZeppelin account contract/i.test(item.answer)),
    )
    assert.equal(
      STARKNET_FAQ.some((item) => /audited Cavos/i.test(`${item.question} ${item.answer}`)),
      false,
    )

    const starknetPage = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-starknet-wallet/page.tsx'),
      'utf8',
    )
    assert.match(starknetPage, /STARKNET_FAQ/)
    assert.match(starknetPage, /chainWalletPageJsonLd/)
    assert.match(starknetPage, /audited OpenZeppelin account contract/)
    assert.doesNotMatch(starknetPage, /needs-device-approval/)
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
      'app/privy-alternatives/page.tsx',
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
      ['/blog/how-to-add-an-embedded-wallet', 'How to add an embedded wallet'],
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
        new RegExp(`href="${href}"[^>]*>${label}<`),
        `footer missing ${label} -> ${href}`,
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
    const waasSiblings = marketingInlinkSources(WALLET_AS_A_SERVICE_PATH).filter((file) =>
      file.startsWith('content/blog/') && file !== 'content/blog/wallet-as-a-service.mdx',
    )
    assert.ok(waasSiblings.length >= 2, `WaaS sibling inlinks: ${waasSiblings.join(', ')}`)
  })

  it('puts a non-footer in-text link to /embedded-wallet on ranking pages', () => {
    const pages = [
      ['app/compare/[slug]/page.tsx', 'how embedded wallets work'],
      ['app/privy-alternatives/page.tsx', 'embedded wallet'],
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
      'Embedded Wallet Providers Compared (2026)',
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
      'Privy vs Turnkey: Embedded Wallet SDKs Compared (2026)',
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
    assert.match(source, /@cavos\/kit` 0\.4\.4/)
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
    assert.equal(EMBEDDED_WALLET_API_PATH, '/blog/embedded-wallet-api')
    assert.equal(
      EMBEDDED_WALLET_API_TITLE,
      'Embedded Wallet API: How It Works and What to Look For (2026)',
    )

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
      'Wallet-as-a-Service (WaaS): How Embedded Wallet Platforms Work (2026)',
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

  it('makes /blog an indexable landing page with crawlable guide links', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'app/blog/page.tsx'),
      'utf8',
    )
    assert.match(source, /Embedded Wallet Guides/)
    assert.match(source, /href: '\/embedded-wallet'/)
    assert.match(source, /What is an embedded wallet\?/)
    assert.match(source, /EMBEDDED_WALLET_INTEGRATION_PATH/)
    assert.match(source, /EMBEDDED_WALLET_VS_EXTENSION_PATH/)
    assert.match(source, /STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH/)
    assert.match(source, /GASLESS_STARKNET_TRANSACTIONS_PATH/)
    assert.match(source, /EMBEDDED_WALLET_PROVIDERS_PATH/)
    assert.match(source, /PRIVY_VS_TURNKEY_PATH/)
    assert.match(source, /EMBEDDED_WALLET_API_PATH/)
    assert.match(source, /NON_CUSTODIAL_EMBEDDED_WALLET_PATH/)
    assert.match(source, /WALLET_AS_A_SERVICE_PATH/)
    assert.match(source, /href: '\/compare'/)
    assert.match(source, /href: '\/custody'/)
    assert.match(source, /href: '\/privy-alternatives'/)
    assert.match(source, /href: '\/embedded-starknet-wallet'/)
    assert.match(source, /href: '\/embedded-solana-wallet'/)
    assert.match(source, /href: '\/embedded-stellar-wallet'/)
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
      },
      {
        name: 'Stellar',
        relative: 'app/embedded-stellar-wallet/page.tsx',
        path: STELLAR_WALLET_PATH,
        title: STELLAR_WALLET_TITLE,
        description: STELLAR_WALLET_DESCRIPTION,
        faq: STELLAR_FAQ,
        otherChains: ['/embedded-starknet-wallet', '/embedded-solana-wallet'],
        requiredClaims: [/MasterDEK/, /classic G/, /invokeContract/],
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
      for (const href of chain.otherChains) {
        assert.match(source, new RegExp(`href=["']${href}["']`))
      }
      assert.doesNotMatch(source, /needs-device-approval/)
      assert.doesNotMatch(source, /DeviceAccount|add_signer|removeDevice|sendMagicLink/)
      assert.doesNotMatch(source, /Cavos custom account/)
      for (const claim of chain.requiredClaims) {
        assert.match(source, claim, `${chain.name} missing ${claim}`)
      }

      assert.ok(chain.faq.length >= 4 && chain.faq.length <= 6)
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
      assert.ok(competitor.faq.length >= 3 && competitor.faq.length <= 4, `${competitor.slug} faq count ${competitor.faq.length}`)
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
