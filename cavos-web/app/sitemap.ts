import type { MetadataRoute } from 'next'
import { getMarketingSitemapEntries } from '@/lib/marketing-sitemap'

// Build-time XML only. Blog URLs are listed from MDX filenames + YAML
// frontmatter dates (no gray-matter / MDX parser). Importing the blog MDX
// loader into this metadata route previously made /sitemap.xml a runtime
// function that could 500 for crawlers.
export const dynamic = 'force-static'
export const revalidate = false

export default function sitemap(): MetadataRoute.Sitemap {
  return getMarketingSitemapEntries()
}
