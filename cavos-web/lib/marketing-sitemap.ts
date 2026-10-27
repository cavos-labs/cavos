import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { COMPETITORS } from './compare-data'
import { PRIVY_ALTERNATIVES_MODIFIED } from './privy-alternatives'

export const MARKETING_ORIGIN = 'https://cavos.xyz'

/** Homepage URL as Google stores the canonical, including the trailing slash. */
export const MARKETING_HOME_URL = `${MARKETING_ORIGIN}/`

/**
 * Blog posts that emit robots noindex. The sitemap skips the same slugs so
 * Search Console does not see a listed URL that the page refuses to index.
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

export function sitemapPageFile(pathname: string): string {
  if (pathname === '/') return 'app/page.tsx'
  if (/^\/compare\/[^/]+$/.test(pathname)) return 'app/compare/[slug]/page.tsx'
  return `app${pathname}/page.tsx`
}

function parseStableDate(value: string): Date | undefined {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export function gitLastModifiedForFile(pageFile: string): Date | undefined {
  const pathspecs = [path.posix.join('cavos-web', pageFile), pageFile]
  for (const spec of pathspecs) {
    try {
      const output = execFileSync(
        'git',
        ['log', '-1', '--format=%cI', '--', spec],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim()
      const parsed = parseStableDate(output)
      if (parsed) return parsed
    } catch {
      // Shallow clones and missing git: omit lastmod rather than invent a date.
    }
  }
  return undefined
}

/** Git last-modified of the route's page file. Omit lastmod when git cannot see it. */
export function lastModifiedForPath(pathname: string): Date | undefined {
  return gitLastModifiedForFile(sitemapPageFile(pathname))
}

function page(
  pathname: string,
  changeFrequency: SitemapChangeFrequency,
  priority: number,
  lastModified?: Date,
): SitemapEntry {
  const url =
    pathname === '/' ? MARKETING_HOME_URL : `${MARKETING_ORIGIN}${pathname}`
  const resolved = lastModified ?? lastModifiedForPath(pathname)
  return {
    url,
    changeFrequency,
    priority,
    ...(resolved ? { lastModified: resolved } : {}),
  }
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
  return parseStableDate(value)
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
      page(
        '/privy-alternatives',
        'monthly',
        0.8,
        parseStableDate(PRIVY_ALTERNATIVES_MODIFIED),
      ),
      page('/custody', 'monthly', 0.8),
      page('/pricing', 'monthly', 0.9),
      page('/stats', 'weekly', 0.9),
      page('/contact-sales', 'monthly', 0.7),
      page('/about', 'monthly', 0.8),
      page('/blog', 'weekly', 0.7),
      page('/privacy', 'monthly', 0.2),
      page('/dpa', 'monthly', 0.2),
      page('/user-privacy', 'monthly', 0.2),
      page('/user-terms', 'monthly', 0.2),
      page('/terms', 'monthly', 0.2),
    ]

    const comparePages = COMPETITORS.map((competitor) =>
      page(`/compare/${competitor.slug}`, 'monthly', 0.8),
    )

    const blogPages = publishedBlogPosts()
      .filter((post) => !isBlogPostNoindex(post.slug))
      .map((post) =>
        page(`/blog/${post.slug}`, 'monthly', 0.6, post.lastModified),
      )

    return [...staticPages, ...comparePages, ...blogPages]
  } catch {
    return [page('/', 'weekly', 1)]
  }
}
