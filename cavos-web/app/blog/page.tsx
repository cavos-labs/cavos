import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getAllPosts, formatDate, CATEGORY_COLORS, PostCategory } from '@/lib/blog';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog | Cavos',
  description: 'Release notes, security updates, deep dives, and announcements from the Cavos team.',
  alternates: { canonical: 'https://cavos.xyz/blog' },
  openGraph: {
    title: 'Changelog | Cavos',
    description: 'Release notes, security updates, deep dives, and announcements from the Cavos team.',
    url: 'https://cavos.xyz/blog',
    type: 'website',
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist)] bg-white">
      <Header />

      {/* Dark hero — matches landing page */}
      <section className="relative bg-[#0A0908] pt-[4.5rem] overflow-hidden">
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(234,229,220,0.07) 0%, transparent 70%)',
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #EAE5DC 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/30 mb-5">
            Cavos
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1
              className="text-[clamp(3rem,8vw,5.5rem)] font-[family-name:var(--font-geist)] font-bold text-white leading-[0.9] tracking-tighter"
            >
              Changelog
            </h1>
            <p className="text-white/40 text-sm sm:text-base mb-1 sm:mb-2">
              Release notes, deep dives &amp; more
            </p>
          </div>
        </div>
      </section>

      {/* Post list */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-20">
        {posts.length === 0 ? (
          <p className="text-black/40 text-sm">No posts yet.</p>
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-8 py-7 hover:bg-[#F7F5F2] -mx-4 px-4 rounded-xl transition-colors duration-150"
                >
                  {/* Date */}
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-black/35 sm:w-28 sm:pt-[3px]">
                    {formatDate(post.date)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-[0.15em] ${CATEGORY_COLORS[post.category as PostCategory]}`}
                      >
                        {post.category}
                      </span>
                    </div>
                    <h2 className="text-base md:text-lg font-semibold text-[#0A0908] leading-snug mb-1.5 group-hover:underline underline-offset-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-black/45 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Arrow */}
                  <span className="shrink-0 hidden sm:flex items-center text-black/20 group-hover:text-black/60 transition-colors mt-1 text-lg">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Footer />
    </div>
  );
}
