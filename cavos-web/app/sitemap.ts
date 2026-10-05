import type { MetadataRoute } from 'next'
import { getMarketingSitemapEntries } from '@/lib/marketing-sitemap'

// Build-time XML only. Importing the blog MDX loader (gray-matter + fs) into
// this metadata route previously made /sitemap.xml a runtime function that
// could 500 for crawlers.
export const dynamic = 'force-static'
export const revalidate = false

export default function sitemap(): MetadataRoute.Sitemap {
  return getMarketingSitemapEntries()
}
