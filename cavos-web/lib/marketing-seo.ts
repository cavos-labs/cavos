import type { Metadata } from 'next'
import { MARKETING_ORIGIN } from './marketing-sitemap'

export const OG_IMAGE = {
  url: `${MARKETING_ORIGIN}/og-image.png`,
  width: 1200,
  height: 630,
  alt: 'Cavos — device-native embedded wallet infrastructure for Starknet, Solana, and Stellar',
} as const

export const ORGANIZATION_ID = `${MARKETING_ORIGIN}/#organization`

export function pageUrl(path: string): string {
  if (path === '/') return MARKETING_ORIGIN
  return `${MARKETING_ORIGIN}${path}`
}

export type BreadcrumbCrumb = {
  name: string
  path: string
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
}) {
  const url = pageUrl(input.path)
  const datePublished = input.datePublished
  const dateModified = input.dateModified ?? input.datePublished

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
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
      breadcrumbListJsonLd(input.crumbs),
    ],
  }
}

export type GuideFaqItem = {
  question: string
  answer: string
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
}) {
  const url = pageUrl(input.path)
  const datePublished = input.datePublished
  const dateModified = input.dateModified ?? input.datePublished

  return {
    '@context': 'https://schema.org',
    '@graph': [
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
    ],
  }
}

function socialTitle(title: string): string {
  return title.includes('| Cavos') ? title : `${title} | Cavos`
}

/**
 * Canonical URL plus complete Open Graph / Twitter tags for a public
 * cavos.xyz marketing page. Document titles omit the brand suffix so the
 * root layout template (`%s | Cavos`) is applied once.
 */
export function marketingPageMetadata(input: {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  publishedTime?: string
  robots?: Metadata['robots']
}): Metadata {
  const url = pageUrl(input.path)
  const type = input.type ?? 'website'
  const title = socialTitle(input.title)
  const image = {
    url: OG_IMAGE.url,
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    alt: OG_IMAGE.alt,
  }

  const documentTitle =
    input.path === '/'
      ? { absolute: socialTitle(input.title) }
      : input.title

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

/** Homepage JSON-LD: Organization + SoftwareApplication. No ratings or traffic figures. */
export function homepageJsonLd() {
  const organizationId = `${MARKETING_ORIGIN}/#organization`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'Cavos',
        legalName: 'Cavos, LLC',
        alternateName: ['Cavos Labs'],
        url: MARKETING_ORIGIN,
        logo: {
          '@type': 'ImageObject',
          url: `${MARKETING_ORIGIN}/CavosLogo.png`,
        },
        description:
          'Cavos builds device-native, self-custodial embedded wallet infrastructure. Starknet, Solana, and Stellar adapters ship today.',
        sameAs: [
          'https://twitter.com/cavosxyz',
          'https://github.com/cavos-labs',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'hello@cavos.xyz',
          contactType: 'sales',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${MARKETING_ORIGIN}/#software`,
        name: 'Cavos',
        alternateName: '@cavos/kit',
        url: MARKETING_ORIGIN,
        operatingSystem: 'Web, iOS, Android',
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'Embedded multichain wallet infrastructure',
        description:
          "A device-native embedded wallet SDK. Applications resolve a self-custodial account from a stable user identity. Signing keys are created and used on the user's device — Cavos cannot see them, sign with them, or move funds. Adapters ship today for Starknet, Solana, and Stellar.",
        offers: {
          '@type': 'Offer',
          url: `${MARKETING_ORIGIN}/pricing`,
          price: '0',
          priceCurrency: 'USD',
          description: 'Free tier covers the first 1,000 wallet creates.',
        },
        author: { '@id': organizationId },
        publisher: { '@id': organizationId },
        featureList: [
          'Device-native P-256 signers',
          'Self-custodial accounts — no provider-held signing key',
          'Registry-first address resolution',
          'Chain-specific gas sponsorship',
          'Starknet, Solana, and Stellar adapters',
          'React and React Native SDKs',
          'Non-custodial recovery codes and optional multi-device approval',
        ],
        screenshot: OG_IMAGE.url,
      },
    ],
  }
}
