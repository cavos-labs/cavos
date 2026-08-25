import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Explicitly allow all major AI search bots to crawl and cite content
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'],
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: ['ClaudeBot', 'anthropic-ai'],
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/'],
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
        disallow: ['/api/'],
      },
    ],
    sitemap: [
      'https://cavos.xyz/sitemap.xml',
      'https://docs.cavos.xyz/sitemap.xml',
    ],
  }
}
