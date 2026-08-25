import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { COMPETITORS } from '@/lib/compare-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cavos.xyz'
  let posts: ReturnType<typeof getAllPosts> = []
  try {
    posts = getAllPosts().filter(
      (post) => post.slug !== 'v1-1-9-sdk-security',
    )
  } catch {
    posts = []
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/compare`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact-sales`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/dpa`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/user-privacy`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/user-terms`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: 'https://demo.cavos.xyz',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://docs.cavos.xyz',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  const comparePages: MetadataRoute.Sitemap = COMPETITORS.map((c) => ({
    url: `${baseUrl}/compare/${c.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => {
    const parsed = post.date ? Date.parse(post.date) : Number.NaN
    return {
      url: `${baseUrl}/blog/${post.slug}`,
      ...(Number.isNaN(parsed) ? {} : { lastModified: post.date }),
      changeFrequency: 'monthly',
      priority: 0.6,
    }
  })

  return [...staticPages, ...comparePages, ...blogPages]
}
