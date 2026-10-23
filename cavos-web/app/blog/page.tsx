import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getAllPosts, formatDate } from '@/lib/blog';
import { Metadata } from 'next';
import { breadcrumbListJsonLd, marketingPageMetadata } from '@/lib/marketing-seo';
import {
  EMBEDDED_WALLET_INTEGRATION_PATH,
  EMBEDDED_WALLET_INTEGRATION_TITLE,
  EMBEDDED_WALLET_PROVIDERS_PATH,
  EMBEDDED_WALLET_PROVIDERS_TITLE,
  EMBEDDED_WALLET_VS_EXTENSION_PATH,
  EMBEDDED_WALLET_VS_EXTENSION_TITLE,
  EMBEDDED_WALLET_API_PATH,
  EMBEDDED_WALLET_API_TITLE,
  NON_CUSTODIAL_EMBEDDED_WALLET_PATH,
  NON_CUSTODIAL_EMBEDDED_WALLET_TITLE,
  PRIVY_VS_TURNKEY_PATH,
  PRIVY_VS_TURNKEY_TITLE,
  STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH,
  STELLAR_EMBEDDED_WALLET_TUTORIAL_TITLE,
  WALLET_AS_A_SERVICE_PATH,
  WALLET_AS_A_SERVICE_TITLE,
} from '@/lib/embedded-wallet-guide';

export const metadata: Metadata = marketingPageMetadata({
  title: 'Embedded Wallet Guides & Product Updates',
  description:
    'How to add an embedded wallet to a React app, plus Cavos product updates for the self-custodial SDK on Starknet, Solana, and Stellar.',
  path: '/blog',
});

const GUIDES = [
  {
    href: '/embedded-wallet',
    title: 'What is an embedded wallet?',
    body: 'Custody models, key management, and how to choose an SDK.',
  },
  {
    href: WALLET_AS_A_SERVICE_PATH,
    title: WALLET_AS_A_SERVICE_TITLE,
    body: 'What an embedded wallet platform is: auth, keys, signing, gas, recovery, pricing, and build versus buy.',
  },
  {
    href: EMBEDDED_WALLET_API_PATH,
    title: EMBEDDED_WALLET_API_TITLE,
    body: 'Auth, wallet create, key handling, signing, gas, and recovery — and how Cavos exposes that surface.',
  },
  {
    href: NON_CUSTODIAL_EMBEDDED_WALLET_PATH,
    title: NON_CUSTODIAL_EMBEDDED_WALLET_TITLE,
    body: 'Who can sign, which key models are actually self-custodial, and how to verify a vendor’s claim.',
  },
  {
    href: EMBEDDED_WALLET_INTEGRATION_PATH,
    title: EMBEDDED_WALLET_INTEGRATION_TITLE,
    body: 'Install @cavos/kit, wrap CavosProvider, sign in, and send a sponsored transaction.',
  },
  {
    href: EMBEDDED_WALLET_VS_EXTENSION_PATH,
    title: EMBEDDED_WALLET_VS_EXTENSION_TITLE,
    body: 'When users should sign in an embedded wallet versus a MetaMask-style browser extension.',
  },
  {
    href: EMBEDDED_WALLET_PROVIDERS_PATH,
    title: EMBEDDED_WALLET_PROVIDERS_TITLE,
    body: 'Pricing, chains, and key models for Cavos, Privy, Dynamic, Turnkey, Magic, and Web3Auth.',
  },
  {
    href: PRIVY_VS_TURNKEY_PATH,
    title: PRIVY_VS_TURNKEY_TITLE,
    body: 'Finished auth and embedded wallets versus low-level key management and signing infrastructure.',
  },
  {
    href: STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH,
    title: STELLAR_EMBEDDED_WALLET_TUTORIAL_TITLE,
    body: 'Install @cavos/kit, sign in with Google, Apple, or email, and send a sponsored Stellar payment.',
  },
  {
    href: '/compare',
    title: 'Compare embedded wallet providers',
    body: 'Cavos vs hosted wallets and extensions across custody, chains, and recovery.',
  },
  {
    href: '/custody',
    title: 'When an embedded wallet makes you a custodian',
    body: 'The control test under MiCA, FinCEN, California, and related regimes.',
  },
  {
    href: '/privy-alternatives',
    title: 'Privy wallet alternatives',
    body: 'When teams look past Privy the embedded crypto wallet, and which architecture actually fits.',
  },
  {
    href: '/embedded-starknet-wallet',
    title: 'Embedded Starknet wallet',
    body: 'Audited OpenZeppelin AccountUpgradeable v3.0.0 with a native stark key.',
  },
  {
    href: '/embedded-solana-wallet',
    title: 'Embedded Solana wallet',
    body: 'Native Ed25519 system account with a relayer as fee payer.',
  },
  {
    href: '/embedded-stellar-wallet',
    title: 'Embedded Stellar wallet',
    body: 'Classic G… account with Horizon ed25519 signers.',
  },
] as const;

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const changelogPosts = posts.filter((post) => post.category !== 'Guide');
  const breadcrumbs = {
    '@context': 'https://schema.org',
    ...breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
    ]),
  };

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist)] bg-white">
      <script
        id="blog-breadcrumbs-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <Header />

      <section className="relative bg-brand pt-[4.5rem] overflow-hidden">
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

        <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="flex flex-col gap-6 max-w-3xl">
            <h1
              className="text-[clamp(3rem,8vw,5.5rem)] font-[family-name:var(--font-geist)] font-bold text-white leading-[0.9] tracking-tighter"
            >
              Changelog
            </h1>
            <p className="text-white/55 text-sm sm:text-base leading-relaxed max-w-xl">
              Product updates for the Cavos embedded wallet SDK, plus guides for
              adding a self-custodial wallet to your app on Starknet, Solana, and
              Stellar.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 md:px-12 pt-16 md:pt-20">
        <h2 className="text-2xl font-semibold text-[#0A0908] tracking-tight">
          Guides
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-black/45 leading-relaxed">
          Start with what an embedded wallet is, then the React integration, then
          a provider comparison if you already have a shortlist.
        </p>
        <ul className="mt-8 divide-y divide-black/[0.06] border-y border-black/[0.06]">
          {GUIDES.map((guide) => (
            <li key={guide.href}>
              <Link
                href={guide.href}
                className="group flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-8 py-7 hover:bg-[#F7F5F2] -mx-4 px-4 rounded-xl transition-colors duration-150"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-[#0A0908] leading-snug mb-1.5 group-hover:underline underline-offset-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-black/45 leading-relaxed">
                    {guide.body}
                  </p>
                </div>
                <span className="shrink-0 hidden sm:flex items-center text-black/20 group-hover:text-black/60 transition-colors mt-1 text-lg">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-20">
        <h2 className="text-2xl font-semibold text-[#0A0908] tracking-tight">
          Product updates
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-black/45 leading-relaxed">
          Release notes and security write-ups. Individual changelog entries are
          kept out of the search index.
        </p>
        {changelogPosts.length === 0 ? (
          <p className="mt-8 text-black/40 text-sm">No posts yet.</p>
        ) : (
          <ul className="mt-8 divide-y divide-black/[0.06]">
            {changelogPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-8 py-7 hover:bg-[#F7F5F2] -mx-4 px-4 rounded-xl transition-colors duration-150"
                >
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-black/35 sm:w-28 sm:pt-[3px]">
                    {formatDate(post.date)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-[#0A0908] leading-snug mb-1.5 group-hover:underline underline-offset-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-black/45 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>

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
