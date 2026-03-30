import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getAllPosts, getPostBySlug, formatDate, CATEGORY_COLORS, PostCategory } from '@/lib/blog';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.meta.title} | Cavos Blog`,
    description: post.meta.excerpt,
    alternates: { canonical: `https://cavos.xyz/blog/${slug}` },
    openGraph: {
      title: post.meta.title,
      description: post.meta.excerpt,
      url: `https://cavos.xyz/blog/${slug}`,
      type: 'article',
      publishedTime: post.meta.date,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist)] bg-white">
      <Header />

      {/* Dark hero */}
      <section className="relative bg-[#0A0908] pt-[4.5rem] overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(234,229,220,0.07) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #EAE5DC 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 py-14 md:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/35 hover:text-white/70 transition-colors mb-8"
          >
            <span>←</span> Blog
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-[0.15em] ${CATEGORY_COLORS[post.meta.category as PostCategory]}`}
            >
              {post.meta.category}
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/30">
              {formatDate(post.meta.date)}
            </span>
          </div>

          <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-[family-name:var(--font-geist)] font-bold text-white leading-[1.0] tracking-tight max-w-3xl mb-5">
            {post.meta.title}
          </h1>
          <p className="text-white/45 text-base md:text-lg max-w-2xl leading-relaxed">
            {post.meta.excerpt}
          </p>
        </div>
      </section>

      {/* Post content */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-14 md:py-20">
        <div className="max-w-2xl blog-prose">
          <MDXRemote source={post.content} />
        </div>

        <div className="max-w-2xl mt-16 pt-8 border-t border-black/[0.06]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-black transition-colors"
          >
            <span>←</span> Back to Blog
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
