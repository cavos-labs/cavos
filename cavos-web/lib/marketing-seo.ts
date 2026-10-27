import type { Metadata } from 'next'
import { MARKETING_HOME_URL, MARKETING_ORIGIN } from './marketing-sitemap'

export const OG_IMAGE = {
  url: `${MARKETING_ORIGIN}/og-image.png`,
  width: 1200,
  height: 630,
  alt: 'Cavos — device-native embedded wallet infrastructure for Starknet, Solana, and Stellar',
} as const

export const ORGANIZATION_ID = `${MARKETING_ORIGIN}/#organization`
export const SOFTWARE_ID = `${MARKETING_ORIGIN}/#software`
export const WEBSITE_ID = `${MARKETING_ORIGIN}/#website`
export const FRAMEZZ_ID = `${MARKETING_ORIGIN}/#framezz`
export const FRAMEZZ_GALLERIES_ID = `${MARKETING_ORIGIN}/#framezz-galleries`

export const HOME_TITLE = 'Cavos: Embedded Wallet SDK for Multichain Apps'
export const HOME_DESCRIPTION =
  'Cavos is an embedded, self-custodial wallet SDK with social login and no seed phrases. Live on Starknet, Solana, and Stellar.'

export const FRAMEZZ_URL = 'https://studioframezz.com/en'
export const FRAMEZZ_APP_URL = 'https://app.studioframezz.com/en'
export const FRAMEZZ_GALLERIES_URL = 'https://galleries.studioframezz.com/'

export const ABOUT_PATH = '/about'
export const ABOUT_TITLE = 'About Cavos: Embedded Wallet SDK for Starknet, Solana & Stellar'
export const ABOUT_DESCRIPTION =
  'Cavos, LLC is a software and SaaS company. The Cavos wallet is the main product. It also builds Framezz event photography software and Framezz Galleries.'

export const ORGANIZATION_DESCRIPTION =
  'Cavos, LLC is a software and SaaS company. The Cavos wallet is the main product. It also builds Framezz event photography software and Framezz Galleries.'

export const STARKNET_WALLET_PATH = '/embedded-starknet-wallet'
export const STARKNET_WALLET_TITLE = 'Embedded Starknet Wallet SDK'
export const STARKNET_WALLET_DESCRIPTION =
  'Starknet embedded wallet SDK: device-native and self-custodial. Signing key derived and used on-device. Audited OpenZeppelin AccountUpgradeable v3.0.0.'

export const STARKNET_WALLET_FAQ = [
  {
    question: 'What account contract does Cavos use on Starknet?',
    answer:
      'Each Starknet wallet is an audited OpenZeppelin account contract: AccountUpgradeable v3.0.0, class hash 0x01d1777db36cdd06dd62cfde77b1b6ae06412af95d57a13dc40ac77b8a702381. The audit covers OpenZeppelin’s contract, not Cavos. One stark key, derived from the MasterDEK and app salt, controls the account.',
  },
  {
    question: 'How do new devices recover a Starknet wallet?',
    answer:
      'Recovery is off-chain. A new device restores the MasterDEK with a Nitro enclave or a synced passkey and derives the same stark key. There are no on-chain device signers and no on-chain social recovery, backup signer, or recovery delay.',
  },
  {
    question: 'What does needs-device-approval mean on Starknet?',
    answer:
      'This device has no key yet. Restore the MasterDEK with a passkey or the enclave, then it can spend. The status is not an on-chain device list.',
  },
  {
    question: 'How does gas and deployment work?',
    answer:
      'The Cavos paymaster sponsors deployment and execution, so the user pays no gas. Connect never deploys; the first execute deploys the OpenZeppelin account lazily and runs the calls atomically. Off-chain signatures use SNIP-12.',
  },
] as const

export const SOLANA_WALLET_PATH = '/embedded-solana-wallet'
export const SOLANA_WALLET_TITLE = 'Embedded Solana Wallet SDK'
export const SOLANA_WALLET_DESCRIPTION =
  'Solana embedded wallet SDK: device-native and self-custodial. Signing key derived and used on-device. Native Ed25519 system account. Relayer can pay fees.'

export const STELLAR_WALLET_PATH = '/embedded-stellar-wallet'
export const STELLAR_WALLET_TITLE = 'Embedded Stellar Wallet SDK'
export const STELLAR_WALLET_DESCRIPTION =
  'Stellar embedded wallet SDK: device-native and self-custodial. Signing key created and used on-device. Classic G… account. Relayer sponsors reserves.'

/** Auth, dashboard, and utility pages that must not appear in search results. */
export const NOINDEX_FOLLOW = { index: false, follow: true } as const

export const AUTH_NOINDEX_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/update-password',
  '/verification-error',
  '/verification-success',
  '/setup-passkey',
] as const

export function noindexFollowMetadata(title: string): Metadata {
  return {
    title,
    robots: NOINDEX_FOLLOW,
  }
}

export function pageUrl(path: string): string {
  if (path === '/') return MARKETING_HOME_URL
  return `${MARKETING_ORIGIN}${path}`
}

/**
 * Documented Cavos free tier: first 1,000 wallet creates at USD 0 (`/pricing`).
 * Google Product / Software App rich results require Offer.price + priceCurrency
 * and Offer.availability.
 */
export const OFFER_AVAILABILITY = 'https://schema.org/InStock'

export function freeTierOfferJsonLd(extra?: { url?: string; description?: string }) {
  return {
    '@type': 'Offer' as const,
    price: '0',
    priceCurrency: 'USD',
    availability: OFFER_AVAILABILITY,
    ...(extra?.url ? { url: extra.url } : {}),
    ...(extra?.description ? { description: extra.description } : {}),
  }
}

export type BreadcrumbCrumb = {
  name: string
  path: string
}

export type GuideFaqItem = {
  question: string
  answer: string
}

/** Absolute-URL BreadcrumbList node. Does not include @context (for @graph). */
export function breadcrumbListJsonLd(crumbs: BreadcrumbCrumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: pageUrl(crumb.path),
    })),
  }
}

export function blogPostJsonLd(input: {
  title: string
  description: string
  path: string
  datePublished: string
  dateModified?: string
  crumbs: BreadcrumbCrumb[]
  type?: 'BlogPosting' | 'Article'
  faq?: GuideFaqItem[]
}) {
  const url = pageUrl(input.path)
  const datePublished = input.datePublished
  const dateModified = input.dateModified ?? input.datePublished
  const type = input.type ?? 'BlogPosting'

  const graph: Record<string, unknown>[] = [
    {
      '@type': type,
      '@id': `${url}#article`,
      headline: input.title,
      description: input.description,
      datePublished,
      dateModified,
      author: {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'Cavos',
      },
      image: OG_IMAGE.url,
      url,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      publisher: { '@id': ORGANIZATION_ID },
    },
    {
      ...breadcrumbListJsonLd(input.crumbs),
      '@id': `${url}#breadcrumb`,
    },
  ]

  if (input.faq && input.faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: input.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

export type GuideHowToStep = {
  name: string
  text: string
  url?: string
}

export type GuideHowTo = {
  name: string
  description: string
  steps: readonly GuideHowToStep[]
}

export type GuideItemListItem = {
  name: string
  path?: string
  description?: string
}

export type GuideItemList = {
  name: string
  items: readonly GuideItemListItem[]
}

/** Article + BreadcrumbList + FAQPage graph for a long-form marketing guide. */
export function guidePageJsonLd(input: {
  title: string
  description: string
  path: string
  datePublished: string
  dateModified?: string
  crumbs: BreadcrumbCrumb[]
  faq: GuideFaqItem[]
  howTo?: GuideHowTo
  itemList?: GuideItemList
}) {
  const url = pageUrl(input.path)
  const datePublished = input.datePublished
  const dateModified = input.dateModified ?? input.datePublished

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: input.title,
      description: input.description,
      datePublished,
      dateModified,
      author: {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'Cavos',
      },
      image: OG_IMAGE.url,
      url,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      publisher: { '@id': ORGANIZATION_ID },
    },
    {
      ...breadcrumbListJsonLd(input.crumbs),
      '@id': `${url}#breadcrumb`,
    },
    {
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: input.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ]

  if (input.howTo) {
    graph.push({
      '@type': 'HowTo',
      '@id': `${url}#howto`,
      name: input.howTo.name,
      description: input.howTo.description,
      step: input.howTo.steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
        ...(step.url ? { url: step.url } : {}),
      })),
    })
  }

  if (input.itemList && input.itemList.items.length > 0) {
    graph.push({
      '@type': 'ItemList',
      '@id': `${url}#itemlist`,
      name: input.itemList.name,
      itemListElement: input.itemList.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        ...(item.path ? { url: pageUrl(item.path) } : {}),
        ...(item.description ? { description: item.description } : {}),
      })),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

/** WebPage + SoftwareApplication + BreadcrumbList + FAQPage for a chain landing page. */
export function chainWalletPageJsonLd(input: {
  title: string
  description: string
  path: string
  softwareName: string
  softwareDescription: string
  applicationSubCategory: string
  featureList: string[]
  datePublished: string
  dateModified: string
  crumbName: string
  faq: GuideFaqItem[]
}) {
  const url = pageUrl(input.path)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: input.title,
        description: input.description,
        datePublished: input.datePublished,
        dateModified: input.dateModified,
        isPartOf: { '@id': WEBSITE_ID },
        primaryTopic: { '@id': `${url}#software` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${url}#software`,
        name: input.softwareName,
        url,
        operatingSystem: 'Web, iOS, Android',
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: input.applicationSubCategory,
        description: input.softwareDescription,
        offers: freeTierOfferJsonLd({
          description: 'Free tier covers the first 1,000 wallet creates.',
        }),
        author: { '@id': ORGANIZATION_ID },
        image: OG_IMAGE.url,
        screenshot: OG_IMAGE.url,
        featureList: input.featureList,
      },
      {
        ...breadcrumbListJsonLd([
          { name: 'Home', path: '/' },
          { name: input.crumbName, path: input.path },
        ]),
        '@id': `${url}#breadcrumb`,
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: input.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  }
}

function socialTitle(title: string): string {
  return title.includes('| Cavos') ? title : `${title} | Cavos`
}

/**
 * Canonical URL plus complete Open Graph / Twitter tags for a public
 * cavos.xyz marketing page. Document titles omit the brand suffix so the
 * root layout template (`%s | Cavos`) is applied once. The homepage passes a
 * brand-first title through `title.absolute` so the template cannot double it.
 */
export function marketingPageMetadata(input: {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  robots?: Metadata['robots']
}): Metadata {
  const url = pageUrl(input.path)
  const type = input.type ?? 'website'
  const isHome = input.path === '/'
  const title = isHome ? input.title : socialTitle(input.title)
  const image = {
    url: OG_IMAGE.url,
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    alt: OG_IMAGE.alt,
  }

  const documentTitle = isHome ? { absolute: input.title } : input.title

  return {
    title: documentTitle,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: input.description,
      url,
      siteName: 'Cavos',
      locale: 'en_US',
      type,
      images: [image],
      ...(type === 'article' && input.publishedTime
        ? { publishedTime: input.publishedTime }
        : {}),
      ...(type === 'article' && input.modifiedTime
        ? { modifiedTime: input.modifiedTime }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: input.description,
      creator: '@cavosxyz',
      images: [image],
    },
    ...(input.robots ? { robots: input.robots } : {}),
  }
}

export const ORGANIZATION_SAME_AS = [
  'https://x.com/cavosxyz',
  'https://twitter.com/cavosxyz',
  'https://github.com/cavos-labs',
  'https://www.npmjs.com/package/@cavos/kit',
  'https://docs.cavos.xyz',
] as const

export const FOUNDER_NAME = 'Adrián Vargas'
export const FOUNDER_SAME_AS = ['https://x.com/0xAdrianvrj'] as const

const ORGANIZATION_BRANDS = [
  {
    '@type': 'Brand' as const,
    name: 'Cavos',
    url: MARKETING_ORIGIN,
  },
  {
    '@type': 'Brand' as const,
    name: 'Framezz',
    url: FRAMEZZ_URL,
  },
  {
    '@type': 'Brand' as const,
    name: 'Framezz Galleries',
    url: FRAMEZZ_GALLERIES_URL,
  },
]

export function organizationJsonLd(
  contactType: 'sales' | 'customer support' = 'sales',
  options: { includeBrands?: boolean } = {},
) {
  const includeBrands = options.includeBrands ?? true
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Cavos',
    legalName: 'Cavos, LLC',
    alternateName: ['Cavos Labs'],
    url: MARKETING_ORIGIN,
    logo: {
      '@type': 'ImageObject',
      url: `${MARKETING_ORIGIN}/CavosLogo.png`,
    },
    description: ORGANIZATION_DESCRIPTION,
    founder: {
      '@type': 'Person',
      name: FOUNDER_NAME,
      sameAs: [...FOUNDER_SAME_AS],
    },
    ...(includeBrands ? { brand: ORGANIZATION_BRANDS } : {}),
    owns: [
      { '@id': SOFTWARE_ID },
      { '@id': FRAMEZZ_ID },
      { '@id': FRAMEZZ_GALLERIES_ID },
    ],
    sameAs: [...ORGANIZATION_SAME_AS],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@cavos.xyz',
      contactType,
    },
  }
}

export function walletSoftwareApplicationJsonLd() {
  return {
    '@type': 'SoftwareApplication',
    '@id': SOFTWARE_ID,
    name: 'Cavos',
    alternateName: '@cavos/kit',
    url: MARKETING_ORIGIN,
    operatingSystem: 'Web, iOS, Android',
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'Embedded multichain wallet infrastructure',
    description:
      "A device-native embedded wallet SDK. Applications resolve a self-custodial account from a stable user identity. Signing keys are created and used on the user's device — Cavos cannot see them, sign with them, or move funds. Adapters ship today for Starknet, Solana, and Stellar.",
    offers: freeTierOfferJsonLd({
      url: pageUrl('/pricing'),
      description: 'Free tier covers the first 1,000 wallet creates.',
    }),
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    featureList: [
      'Account keys derived on-device from a MasterDEK',
      'Self-custodial accounts — no provider-held signing key',
      'Registry-first address resolution',
      'Gas Sponsorship in Any Token',
      'Starknet, Solana, and Stellar adapters',
      'React and React Native SDKs',
      'Passkey and enclave restore on new devices',
    ],
    screenshot: OG_IMAGE.url,
  }
}

/**
 * Framezz products are Brands, not Product/SoftwareApplication.
 * There is no documented USD price in this repo for Framezz itself, and
 * emitting Product nodes without Offer.price + priceCurrency fails Google
 * Product snippets site-wide (including /compare/*).
 */
export function cavosProductApplicationsJsonLd() {
  return [
    {
      '@type': 'Brand',
      '@id': FRAMEZZ_ID,
      name: 'Framezz',
      url: FRAMEZZ_URL,
      description:
        'Event photography software. A runner uploads a selfie to get every photo they appear in, then downloads the high-resolution originals.',
    },
    {
      '@type': 'Brand',
      '@id': FRAMEZZ_GALLERIES_ID,
      name: 'Framezz Galleries',
      url: FRAMEZZ_GALLERIES_URL,
      description:
        'Marketplace for event photographers of races, tournaments, and graduations. They sell photos under their own brand. Clients find themselves with a selfie or a bib number. Free plan available.',
    },
  ]
}

export function aboutPageJsonLd() {
  const url = pageUrl(ABOUT_PATH)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationJsonLd('sales'),
      walletSoftwareApplicationJsonLd(),
      ...cavosProductApplicationsJsonLd(),
      {
        '@type': 'AboutPage',
        '@id': `${url}#webpage`,
        url,
        name: ABOUT_TITLE,
        description: ABOUT_DESCRIPTION,
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': ORGANIZATION_ID },
        mainEntity: { '@id': ORGANIZATION_ID },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        ...breadcrumbListJsonLd([
          { name: 'Home', path: '/' },
          { name: 'About', path: ABOUT_PATH },
        ]),
        '@id': `${url}#breadcrumb`,
      },
    ],
  }
}

export function websiteJsonLd() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'Cavos',
    url: MARKETING_ORIGIN,
    publisher: { '@id': ORGANIZATION_ID },
  }
}

/** Homepage JSON-LD: Organization + WebSite + SoftwareApplication. No ratings or traffic figures. */
export function homepageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationJsonLd('sales'),
      websiteJsonLd(),
      walletSoftwareApplicationJsonLd(),
      ...cavosProductApplicationsJsonLd(),
    ],
  }
}

/**
 * Site-wide graph emitted from the root layout on every public page.
 * Organization + WebSite only — Brand nodes and the wallet Offer stay on
 * home / about / pricing, where those products are the topic.
 */
export function sitewideJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationJsonLd('customer support', { includeBrands: false }),
      {
        ...websiteJsonLd(),
        description:
          'Embedded wallet infrastructure for Starknet, Solana, and Stellar — device-native and verifiable.',
      },
    ],
  }
}

export type CompareFaqItem = GuideFaqItem

export type CompareListEntry = {
  name: string
  slug: string
  summary: string
}

export type CompareCompetitorJsonLdInput = CompareListEntry & {
  pageH1?: string
  pageDescription?: string
  faq: CompareFaqItem[]
}

function comparisonItemListElement(entries: CompareListEntry[]) {
  return entries.map((entry, index) => ({
    '@type': 'ListItem' as const,
    position: index + 1,
    name: `Cavos vs ${entry.name}`,
    url: pageUrl(`/compare/${entry.slug}`),
    description: entry.summary,
  }))
}

/**
 * Documented Cavos plans from `/pricing`. Google Product / Software App
 * snippets require Offer.price + priceCurrency (and availability). Compare
 * pages attach these to a Cavos SoftwareApplication — never to competitors,
 * and never with invented review or aggregateRating.
 */
function cavosPublishedPlanOffersJsonLd() {
  const pricingUrl = pageUrl('/pricing')
  return [
    {
      '@type': 'Offer' as const,
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
      availability: OFFER_AVAILABILITY,
      url: pricingUrl,
      description: 'Free up to 1,000 wallets.',
    },
    {
      '@type': 'Offer' as const,
      name: 'Essential',
      price: '59',
      priceCurrency: 'USD',
      availability: OFFER_AVAILABILITY,
      url: pricingUrl,
      description: 'Essential plan, billed monthly.',
    },
    {
      '@type': 'Offer' as const,
      name: 'Complete',
      price: '139',
      priceCurrency: 'USD',
      availability: OFFER_AVAILABILITY,
      url: pricingUrl,
      description: 'Complete plan, billed monthly.',
    },
  ]
}

function cavosCompareSoftwareApplicationJsonLd() {
  return {
    ...walletSoftwareApplicationJsonLd(),
    offers: cavosPublishedPlanOffersJsonLd(),
  }
}

/** /compare index: WebPage + Cavos SoftwareApplication (priced offers) + breadcrumbs + FAQ + ItemList. No competitor Product nodes. */
export function compareIndexJsonLd(input: {
  title: string
  description: string
  faq: CompareFaqItem[]
  comparisons: CompareListEntry[]
}) {
  const url = pageUrl('/compare')
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: input.title,
        description: input.description,
        isPartOf: { '@id': WEBSITE_ID },
        breadcrumb: { '@id': `${url}#breadcrumb` },
        about: { '@id': SOFTWARE_ID },
        mainEntity: { '@id': SOFTWARE_ID },
      },
      cavosCompareSoftwareApplicationJsonLd(),
      {
        ...breadcrumbListJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Compare', path: '/compare' },
        ]),
        '@id': `${url}#breadcrumb`,
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: input.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#comparisons`,
        name: 'Cavos vs embedded wallet providers',
        itemListElement: comparisonItemListElement(input.comparisons),
      },
    ],
  }
}

/**
 * /compare/[slug]: WebPage + Cavos SoftwareApplication (priced offers) + breadcrumbs + FAQ + ItemList.
 * Competitor products are ListItem names only — never Product/SoftwareApplication.
 * Google Product snippets require offers, review, or aggregateRating; we emit
 * documented Cavos plan Offers and do not invent ratings or competitor prices.
 */
export function compareCompetitorPageJsonLd(competitor: CompareCompetitorJsonLdInput) {
  const path = `/compare/${competitor.slug}`
  const url = pageUrl(path)
  const name = competitor.pageH1 ?? `Cavos vs ${competitor.name}`
  const description =
    competitor.pageDescription ??
    `Comparison of Cavos and ${competitor.name} across custody, signing authority, chain support, sponsorship, and recovery.`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name,
        description,
        isPartOf: { '@id': WEBSITE_ID },
        breadcrumb: { '@id': `${url}#breadcrumb` },
        about: { '@id': SOFTWARE_ID },
        mainEntity: { '@id': SOFTWARE_ID },
      },
      cavosCompareSoftwareApplicationJsonLd(),
      {
        ...breadcrumbListJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Compare', path: '/compare' },
          { name: `Cavos vs ${competitor.name}`, path },
        ]),
        '@id': `${url}#breadcrumb`,
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: competitor.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#compared`,
        name,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Cavos',
            url: MARKETING_ORIGIN,
            item: { '@id': SOFTWARE_ID },
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: competitor.name,
          },
        ],
      },
    ],
  }
}

export type PricingPlanJsonLd = {
  name: string
  feeUsdPerMonth: number
  createCap: number | 'unlimited'
}

/** /pricing Product node: every Offer includes price + priceCurrency from published plan fees. */
export function pricingPageJsonLd(input: {
  plans: PricingPlanJsonLd[]
  faq: { q: string; a: string }[]
}) {
  const url = pageUrl('/pricing')
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationJsonLd('sales'),
      walletSoftwareApplicationJsonLd(),
      ...cavosProductApplicationsJsonLd(),
      {
        '@type': 'Product',
        name: 'Cavos Embedded Wallet SDK',
        description: 'Device-native multichain embedded wallet SDK with flat monthly pricing.',
        url,
        image: OG_IMAGE.url,
        brand: { '@id': ORGANIZATION_ID },
        offers: input.plans.map((plan) => ({
          '@type': 'Offer',
          name: plan.name,
          price: String(plan.feeUsdPerMonth),
          priceCurrency: 'USD',
          availability: OFFER_AVAILABILITY,
          description:
            plan.createCap === 1000
              ? 'Up to 1,000 wallet creates.'
              : `${plan.name} plan, billed monthly.`,
        })),
      },
      {
        ...breadcrumbListJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Pricing', path: '/pricing' },
        ]),
        '@id': `${url}#breadcrumb`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: input.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  }
}
