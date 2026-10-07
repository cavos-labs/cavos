import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  ABOUT_DESCRIPTION,
  ABOUT_PATH,
  ABOUT_TITLE,
  FRAMEZZ_GALLERIES_ID,
  FRAMEZZ_GALLERIES_URL,
  FRAMEZZ_ID,
  FRAMEZZ_URL,
  ORGANIZATION_DESCRIPTION,
  ORGANIZATION_ID,
  SOFTWARE_ID,
  aboutPageJsonLd,
  blogPostJsonLd,
  breadcrumbListJsonLd,
  guidePageJsonLd,
  homepageJsonLd,
  marketingPageMetadata,
  organizationJsonLd,
} from './marketing-seo'
import {
  EMBEDDED_WALLET_DESCRIPTION,
  EMBEDDED_WALLET_FAQ,
  EMBEDDED_WALLET_PATH,
  EMBEDDED_WALLET_PUBLISHED,
  EMBEDDED_WALLET_TITLE,
} from './embedded-wallet-guide'

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

  it('uses an absolute homepage title so the layout template is not skipped', () => {
    const home = marketingPageMetadata({
      title: 'Multichain Embedded Wallet Infrastructure',
      description: 'Device-native embedded wallets.',
      path: '/',
    })
    assert.deepEqual(home.title, {
      absolute: 'Multichain Embedded Wallet Infrastructure | Cavos',
    })
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

    const wallet = data['@graph'][1]
    assert.equal(wallet['@type'], 'SoftwareApplication')
    assert.equal(wallet['@id'], SOFTWARE_ID)
    assert.equal(wallet.name, 'Cavos')
    assert.equal(wallet.alternateName, '@cavos/kit')
    assert.equal(wallet.url, 'https://cavos.xyz')
    assert.equal(wallet.operatingSystem, 'Web, iOS, Android')
    assert.equal(wallet.applicationCategory, 'DeveloperApplication')
    assert.equal(wallet.applicationSubCategory, 'Embedded multichain wallet infrastructure')
    assert.equal(wallet.offers.price, '0')
    assert.equal(wallet.author['@id'], ORGANIZATION_ID)

    const framezz = data['@graph'].find((node: { '@id'?: string }) => node['@id'] === FRAMEZZ_ID)
    const galleries = data['@graph'].find(
      (node: { '@id'?: string }) => node['@id'] === FRAMEZZ_GALLERIES_ID,
    )
    assert.ok(framezz)
    assert.ok(galleries)
    assert.deepEqual(framezz['@type'], ['SoftwareApplication', 'Product'])
    assert.equal(framezz.name, 'Framezz')
    assert.equal(framezz.url, FRAMEZZ_URL)
    assert.deepEqual(galleries['@type'], ['SoftwareApplication', 'Product'])
    assert.equal(galleries.name, 'Framezz Galleries')
    assert.equal(galleries.url, FRAMEZZ_GALLERIES_URL)
  })

  it('keeps layout and homepage Organization nodes on the same @id', () => {
    const layoutOrg = organizationJsonLd('customer support')
    const homeOrg = organizationJsonLd('sales')
    assert.equal(layoutOrg['@id'], ORGANIZATION_ID)
    assert.equal(homeOrg['@id'], ORGANIZATION_ID)
    assert.equal(layoutOrg.description, homeOrg.description)
    assert.deepEqual(layoutOrg.brand, homeOrg.brand)
    assert.deepEqual(layoutOrg.owns, homeOrg.owns)
    assert.equal(layoutOrg.contactPoint.contactType, 'customer support')
    assert.equal(homeOrg.contactPoint.contactType, 'sales')
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
    assert.equal(meta.openGraph?.title, 'Software & SaaS Company | Cavos')
    assert.ok(ABOUT_TITLE.length > 0 && ABOUT_TITLE.length <= 60)
    assert.ok(ABOUT_DESCRIPTION.length > 0 && ABOUT_DESCRIPTION.length <= 155)

    const data = aboutPageJsonLd()
    const json = JSON.stringify(data)
    JSON.parse(json)

    const page = data['@graph'][0]
    assert.equal(page['@type'], 'AboutPage')
    assert.equal(page.url, 'https://cavos.xyz/about')
    assert.equal(page.name, ABOUT_TITLE)
    assert.equal(page.description, ABOUT_DESCRIPTION)
    assert.equal(page.about['@id'], ORGANIZATION_ID)
    assert.equal(page.mainEntity['@id'], ORGANIZATION_ID)

    const crumbs = data['@graph'][1]
    assert.equal(crumbs['@type'], 'BreadcrumbList')
    assert.equal(crumbs.itemListElement[0].item, 'https://cavos.xyz')
    assert.equal(crumbs.itemListElement[1].name, 'About')
    assert.equal(crumbs.itemListElement[1].item, 'https://cavos.xyz/about')
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
        { position: 1, name: 'Home', item: 'https://cavos.xyz' },
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
    assert.equal(compare.itemListElement[0].item, 'https://cavos.xyz')
    assert.equal(compare.itemListElement[1].item, 'https://cavos.xyz/compare')
    assert.equal(compare.itemListElement[2].item, 'https://cavos.xyz/compare/privy')

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
    assert.ok(EMBEDDED_WALLET_DESCRIPTION.length > 0)
    assert.ok(EMBEDDED_WALLET_DESCRIPTION.length <= 155)
    assert.equal(EMBEDDED_WALLET_PATH, '/embedded-wallet')
    assert.ok(EMBEDDED_WALLET_FAQ.length >= 4 && EMBEDDED_WALLET_FAQ.length <= 6)
  })

  it('builds Article, BreadcrumbList, and FAQPage JSON-LD for the guide', () => {
    const data = guidePageJsonLd({
      title: EMBEDDED_WALLET_TITLE,
      description: EMBEDDED_WALLET_DESCRIPTION,
      path: EMBEDDED_WALLET_PATH,
      datePublished: EMBEDDED_WALLET_PUBLISHED,
      crumbs: [
        { name: 'Home', path: '/' },
        { name: 'What is an embedded wallet', path: EMBEDDED_WALLET_PATH },
      ],
      faq: [...EMBEDDED_WALLET_FAQ],
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

    const crumbs = data['@graph'][1]
    assert.equal(crumbs['@type'], 'BreadcrumbList')
    assert.equal(crumbs['@id'], 'https://cavos.xyz/embedded-wallet#breadcrumb')
    assert.equal(crumbs.itemListElement[1].item, 'https://cavos.xyz/embedded-wallet')

    const faq = data['@graph'][2]
    assert.equal(faq['@type'], 'FAQPage')
    assert.equal(faq.mainEntity.length, EMBEDDED_WALLET_FAQ.length)
    assert.equal(faq.mainEntity[0].name, EMBEDDED_WALLET_FAQ[0].question)
    assert.equal(faq.mainEntity[0].acceptedAnswer.text, EMBEDDED_WALLET_FAQ[0].answer)
  })
})
