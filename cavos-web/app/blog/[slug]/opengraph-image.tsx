import { getAllPosts } from '@/lib/blog';
import { renderBlogQuoteOg } from '@/lib/blog-og';

export const alt = 'Cavos Blog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderBlogQuoteOg(slug);
}
