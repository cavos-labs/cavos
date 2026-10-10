import fs from 'node:fs'
import path from 'node:path'
import { COMPETITORS } from './compare-data'

export const MARKETING_ORIGIN = 'https://cavos.xyz'

/**
 * Blog posts that emit robots noindex. Page metadata uses this helper.
 * The sitemap still lists every post from the same MDX source as /blog.
 */
export function isBlogPostNoindex(slug: string): boolean {
  return slug === 'v1-1-9-sdk-security'
}

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
  lastModified?: Date,
): SitemapEntry {
  const url =
    pathname === '/' ? MARKETING_ORIGIN : `${MARKETING_ORIGIN}${pathname}`
  return lastModified
    ? { url, changeFrequency, priority, lastModified }
    : { url, changeFrequency, priority }
}

/**
 * YAML frontmatter without gray-matter / MDX. Importing the blog MDX loader
 * into the sitemap metadata route previously made /sitemap.xml a runtime
 * function that could 500 for crawlers.
 */
export function parseBlogFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}

  const fields: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!kv) continue
    fields[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '').trim()
  }
  return fields
}

function parseFrontmatterDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export type PublishedBlogPost = {
  slug: string
  lastModified: Date
}

export function publishedBlogPosts(): PublishedBlogPost[] {
  const dir = BLOG_DIR_CANDIDATES.find((candidate) => fs.existsSync(candidate))
  if (!dir) return []

  return fs
    .readdirSync(dir)
    .filter((filename) => filename.endsWith('.mdx'))
    .map((filename) => {
      const filePath = path.join(dir, filename)
      const raw = fs.readFileSync(filePath, 'utf8')
      const frontmatter = parseBlogFrontmatter(raw)
      const fileSlug = filename.replace(/\.mdx$/, '')
      const lastModified =
        parseFrontmatterDate(
          frontmatter.updated ??
            frontmatter.lastModified ??
            frontmatter.dateModified ??
            frontmatter.date,
        ) ?? fs.statSync(filePath).mtime

      return {
        slug: frontmatter.slug || fileSlug,
        lastModified,
      }
    })
}

/**
 * Public marketing URLs on cavos.xyz. Auth, dashboard, and noindex utility
 * routes are omitted. Off-host docs/demo URLs belong in their own sitemaps.
 */
export function getMarketingSitemapEntries(): SitemapEntry[] {
  try {
    const staticPages: SitemapEntry[] = [
      page('/', 'weekly', 1),
      page('/embedded-wallet', 'monthly', 0.9),
      page('/embedded-stellar-wallet', 'monthly', 0.9),
      page('/embedded-solana-wallet', 'monthly', 0.9),
      page('/embedded-starknet-wallet', 'monthly', 0.9),
      page('/compare', 'monthly', 0.9),
      page('/custody', 'monthly', 0.8),
      page('/pricing', 'monthly', 0.9),
      page('/stats', 'weekly', 0.9),
      page('/contact-sales', 'monthly', 0.7),
      page('/about', 'monthly', 0.8),
      page('/blog', 'weekly', 0.7),
      page('/privacy', 'yearly', 0.2),
      page('/dpa', 'yearly', 0.2),
      page('/user-privacy', 'yearly', 0.2),
      page('/user-terms', 'yearly', 0.2),
      page('/terms', 'yearly', 0.2),
    ]

    const comparePages = COMPETITORS.map((competitor) =>
      page(`/compare/${competitor.slug}`, 'monthly', 0.8),
    )

    const blogPages = publishedBlogPosts().map((post) =>
      page(`/blog/${post.slug}`, 'monthly', 0.6, post.lastModified),
    )

    return [...staticPages, ...comparePages, ...blogPages]
  } catch {
    return [page('/', 'weekly', 1)]
  }
}
