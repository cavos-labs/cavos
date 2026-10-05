import fs from 'node:fs'
import path from 'node:path'
import { COMPETITORS } from './compare-data'

export const MARKETING_ORIGIN = 'https://cavos.xyz'

/** Legacy architecture post: public URL exists but is noindex. */
const EXCLUDED_BLOG_SLUGS = new Set(['v1-1-9-sdk-security'])

export type SitemapChangeFrequency = 'weekly' | 'monthly' | 'yearly'

export type SitemapEntry = {
  url: string
  changeFrequency: SitemapChangeFrequency
  priority: number
  lastModified?: Date
}

const BLOG_DIR_CANDIDATES = [
  path.join(process.cwd(), 'content/blog'),
  path.join(process.cwd(), 'cavos-web/content/blog'),
]

function page(
  pathname: string,
  changeFrequency: SitemapChangeFrequency,
  priority: number,
): SitemapEntry {
  const url = pathname.startsWith('http')
    ? pathname
    : pathname === '/'
      ? MARKETING_ORIGIN
      : `${MARKETING_ORIGIN}${pathname}`
  return { url, changeFrequency, priority }
}

function publishedBlogSlugs(): string[] {
  const dir = BLOG_DIR_CANDIDATES.find((candidate) => fs.existsSync(candidate))
  if (!dir) return []

  return fs
    .readdirSync(dir)
    .filter((filename) => filename.endsWith('.mdx'))
    .map((filename) => filename.replace(/\.mdx$/, ''))
    .filter((slug) => !EXCLUDED_BLOG_SLUGS.has(slug))
}

/**
 * Public marketing URLs on cavos.xyz (plus the docs/demo hosts already linked
 * from the site). Auth, dashboard, and noindex utility routes are omitted.
 */
export function getMarketingSitemapEntries(): SitemapEntry[] {
  try {
    const staticPages: SitemapEntry[] = [
      page('/', 'weekly', 1),
      page('/embedded-stellar-wallet', 'monthly', 0.9),
      page('/embedded-solana-wallet', 'monthly', 0.9),
      page('/embedded-starknet-wallet', 'monthly', 0.9),
      page('/compare', 'monthly', 0.9),
      page('/custody', 'monthly', 0.8),
      page('/pricing', 'monthly', 0.9),
      page('/stats', 'weekly', 0.9),
      page('/contact-sales', 'monthly', 0.7),
      page('/blog', 'weekly', 0.7),
      page('/privacy', 'yearly', 0.2),
      page('/dpa', 'yearly', 0.2),
      page('/user-privacy', 'yearly', 0.2),
      page('/user-terms', 'yearly', 0.2),
      page('/terms', 'yearly', 0.2),
      page('https://demo.cavos.xyz', 'weekly', 0.9),
      page('https://docs.cavos.xyz', 'weekly', 0.9),
    ]

    const comparePages = COMPETITORS.map((competitor) =>
      page(`/compare/${competitor.slug}`, 'monthly', 0.8),
    )

    const blogPages = publishedBlogSlugs().map((slug) =>
      page(`/blog/${slug}`, 'monthly', 0.6),
    )

    return [...staticPages, ...comparePages, ...blogPages]
  } catch {
    return [page('/', 'weekly', 1)]
  }
}
