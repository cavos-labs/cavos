import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Explicitly allow all major AI search bots to crawl and cite content
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'],
        allow: '/',
        disallow: ['/api/', '/dashboard/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/dashboard/'],
      },
      {
        userAgent: ['ClaudeBot', 'anthropic-ai'],
        allow: '/',
        disallow: ['/api/', '/dashboard/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/dashboard/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/dashboard/'],
      },
      // Block Common Crawl training data scraper (not a search bot)
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      // Default: allow all
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/'],
      },
    ],
    sitemap: 'https://cavos.xyz/sitemap.xml',
  }
}
