import { createHash } from 'crypto';

/** Bump when the blog quote card layout in lib/blog-og.tsx changes. */
export const BLOG_OG_DESIGN_VERSION = '1';

/**
 * Short content hash for a post's social card. Crawlers (X, WhatsApp)
 * cache cards by image URL, so the URL must change when the card does.
 */
export function blogOgVersion(meta: { title: string; ogQuote?: string; excerpt: string }): string {
  const quote = (meta.ogQuote || meta.excerpt).trim();
  return createHash('sha256')
    .update([BLOG_OG_DESIGN_VERSION, meta.title, quote].join('\n'))
    .digest('hex')
    .slice(0, 8);
}

export function blogOgImageUrl(
  origin: string,
  slug: string,
  meta: { title: string; ogQuote?: string; excerpt: string },
): string {
  return `${origin}/blog/${slug}/opengraph-image?v=${blogOgVersion(meta)}`;
}
