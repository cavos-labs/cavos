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
  ORGANIZATION_DESCRIPTION,
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
  guidePageJsonLd,
  homepageJsonLd,
  marketingPageMetadata,
  noindexFollowMetadata,
  organizationJsonLd,
} from './marketing-seo'
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
} from './embedded-wallet-guide'
import {
  COMPETITORS,
  EMBEDDED_WALLET_MARKET_NOTE,
  embeddedWalletProviderRows,
  getCompetitor,
} from './compare-data'
import {
  PRIVY_ALTERNATIVES_DESCRIPTION,
  PRIVY_ALTERNATIVES_FAQ,
  PRIVY_ALTERNATIVES_H1,
  PRIVY_ALTERNATIVES_PATH,
  PRIVY_ALTERNATIVES_TITLE,
} from './privy-alternatives'

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
    assert.deepEqual(org.sameAs, [
      'https://x.com/cavosxyz',
      'https://twitter.com/cavosxyz',
      'https://github.com/cavos-labs',
      'https://docs.cavos.xyz',
    ])
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
    assert.equal(crumbs.itemListElement[0].item, 'https://cavos.xyz/')
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
    assert.equal(EMBEDDED_WALLET_MODIFIED, '2026-10-13')
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
      [
        '/pricing',
        '/compare/privy',
        '/compare/dynamic',
        '/compare/turnkey',
        '/compare/web3auth',
        '/compare/magic',
      ],
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
    assert.doesNotMatch(pageSource, /New devices are added by an on-chain approval/)
    assert.doesNotMatch(pageSource, /audited Cavos/)
    const headings = [...pageSource.matchAll(/<h[12][^>]*>\s*([^<]+)/g)].map(
      (match) => match[1].trim(),
    )
    assert.ok(headings.includes('What is an embedded wallet?'))
    assert.ok(headings.includes('How an embedded wallet works'))
    assert.ok(headings.includes('Embedded wallet SDK'))
    assert.ok(headings.includes('How to integrate an embedded wallet'))
    assert.ok(headings.includes('Embedded wallet provider comparison'))
    assert.match(pageSource, /EMBEDDED_WALLET_INTEGRATION_PATH/)
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
    assert.match(features, /href="\/embedded-wallet"/)
    assert.match(features, /what an embedded wallet is/)
    assert.match(features, /href="\/compare"/)
    const home = fs.readFileSync(path.join(process.cwd(), 'app/page.tsx'), 'utf8')
    assert.match(home, /path: '\/'/)
    assert.doesNotMatch(home, /<h1[\s\S]*embedded wallet/i)
  })

  it('keeps the Privy alternatives title and description inside search limits', () => {
    assert.equal(PRIVY_ALTERNATIVES_PATH, '/privy-alternatives')
    assert.equal(PRIVY_ALTERNATIVES_TITLE.includes('| Cavos'), false)
    assert.match(PRIVY_ALTERNATIVES_TITLE, /Privy Wallet Alternative/)
    assert.match(PRIVY_ALTERNATIVES_H1, /Privy wallet alternative/)
    assert.match(PRIVY_ALTERNATIVES_DESCRIPTION, /Shopify/)
    const fullTitle = `${PRIVY_ALTERNATIVES_TITLE} | Cavos`
    assert.ok(fullTitle.length >= 50 && fullTitle.length <= 60, fullTitle)
    assert.ok(
      PRIVY_ALTERNATIVES_DESCRIPTION.length >= 140 &&
        PRIVY_ALTERNATIVES_DESCRIPTION.length <= 160,
      String(PRIVY_ALTERNATIVES_DESCRIPTION.length),
    )
    assert.ok(PRIVY_ALTERNATIVES_FAQ.length >= 3 && PRIVY_ALTERNATIVES_FAQ.length <= 4)

    const meta = marketingPageMetadata({
      title: PRIVY_ALTERNATIVES_TITLE,
      description: PRIVY_ALTERNATIVES_DESCRIPTION,
      path: PRIVY_ALTERNATIVES_PATH,
      type: 'article',
    })
    assert.equal(meta.title, PRIVY_ALTERNATIVES_TITLE)
    assert.equal(meta.alternates?.canonical, 'https://cavos.xyz/privy-alternatives')
    assert.equal(meta.openGraph?.title, fullTitle)
    assert.equal(meta.openGraph?.url, 'https://cavos.xyz/privy-alternatives')
    assert.equal(meta.openGraph?.type, 'article')
    assert.equal(meta.twitter?.card, 'summary_large_image')
    assert.equal(meta.twitter?.title, fullTitle)
    assert.equal(meta.twitter?.description, PRIVY_ALTERNATIVES_DESCRIPTION)

    const privy = getCompetitor('privy')
    assert.ok(privy)
    assert.match(privy.pageTitle ?? '', /Privy wallet alternative/)
    assert.match(privy.pageH1 ?? '', /Privy wallet alternative/)
    assert.match(privy.pageDescription ?? '', /Shopify/)
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

    const starknetPage = fs.readFileSync(
      path.join(process.cwd(), 'app/embedded-starknet-wallet/page.tsx'),
      'utf8',
    )
    assert.match(starknetPage, /STARKNET_WALLET_FAQ/)
    assert.match(starknetPage, /FAQPage/)
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
        /breadcrumbListJsonLd|guidePageJsonLd|aboutPageJsonLd|blogPostJsonLd/,
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
    assert.match(source, /npm install @cavos\/kit/)
    assert.doesNotMatch(source, /category:\s*"Release"/)

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

  it('makes /blog an indexable landing page with crawlable guide links', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'app/blog/page.tsx'),
      'utf8',
    )
    assert.match(source, /Embedded Wallet Guides/)
    assert.match(source, /href: '\/embedded-wallet'/)
    assert.match(source, /What is an embedded wallet\?/)
    assert.match(source, /EMBEDDED_WALLET_INTEGRATION_PATH/)
    assert.match(source, /href: '\/compare'/)
    assert.match(source, /href: '\/custody'/)
    assert.match(source, /href: '\/privy-alternatives'/)
    assert.match(source, /href: '\/embedded-starknet-wallet'/)
    assert.match(source, /href: '\/embedded-solana-wallet'/)
    assert.match(source, /href: '\/embedded-stellar-wallet'/)
    const meta = marketingPageMetadata({
      title: 'Embedded Wallet Guides & Product Updates',
      description:
        'How to add an embedded wallet to a React app, plus Cavos product updates for the self-custodial SDK on Starknet, Solana, and Stellar.',
      path: '/blog',
    })
    assert.equal(meta.alternates?.canonical, 'https://cavos.xyz/blog')
  })
})
