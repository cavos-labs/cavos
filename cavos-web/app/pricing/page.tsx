import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import Script from 'next/script'
import Link from 'next/link'

/* ── Bespoke feature icons (layered, multi-tone Cavos indigo) ───────────────
   Hand-built SVGs so the set feels tailored, not a generic icon-pack pull. */

function IcoWallet() {
    return (
        <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="10" y="12" width="28" height="19" rx="4" fill="#C9BEFF" />
            <rect x="6" y="17" width="36" height="23" rx="5" fill="#402AFF" />
            <rect x="6" y="23" width="36" height="4.5" fill="#2A1AB8" />
            <rect x="11" y="32" width="9" height="5" rx="1.5" fill="#9F8CFF" />
            <circle cx="35" cy="34" r="2.2" fill="#9F8CFF" />
        </svg>
    )
}

function IcoGas() {
    return (
        <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="22" cy="24" r="16" fill="#E5E1FF" />
            <path d="M25 9 L13 27 h8 l-2 12 13-19 h-9 z" fill="#402AFF" />
            <circle cx="35" cy="13" r="2.4" fill="#7C5CFF" />
            <circle cx="11" cy="36" r="1.7" fill="#9F8CFF" />
        </svg>
    )
}

function IcoCode() {
    return (
        <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="6" y="9" width="36" height="30" rx="5" fill="#E5E1FF" />
            <path d="M6 14a5 5 0 0 1 5-5h26a5 5 0 0 1 5 5v2H6z" fill="#C9BEFF" />
            <circle cx="12" cy="12.5" r="1.4" fill="#402AFF" />
            <circle cx="17" cy="12.5" r="1.4" fill="#7C5CFF" />
            <path d="M21 22l-5 5 5 5M27 22l5 5-5 5" stroke="#402AFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function IcoShield() {
    return (
        <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M24 6l16 6v10c0 10-7 16.5-16 20.5C15 38.5 8 32 8 22V12z" fill="#402AFF" />
            <path d="M24 6l16 6v10c0 10-7 16.5-16 20.5z" fill="#5A45FF" />
            <path d="M17 24l5 5 9-10" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export const metadata = {
    title: "Pricing — Cavos | Embedded Wallet SDK for Starknet",
    description: "Simple, wallet-based pricing for the Cavos embedded wallet SDK. Free up to 1,000 wallets, Pro at $99/mo for unlimited wallets, and Custom plans with volume pricing and dedicated support.",
    alternates: {
        canonical: "https://cavos.xyz/pricing",
    },
    openGraph: {
        title: "Cavos Pricing — Free, Pro & Custom",
        description: "Free up to 1,000 wallets. Pro at $99/mo for unlimited wallets. Custom plans with volume pricing and dedicated support.",
        url: "https://cavos.xyz/pricing",
    },
}

/* Self-serve usage tiers — one panel, billed by wallets created. */
const USAGE_TIERS: { label: string; range: string; price: string; unit?: string }[] = [
    { label: 'Free', range: 'Up to 1,000 wallets', price: 'Free' },
    { label: 'Pro', range: 'Unlimited wallets', price: '$99', unit: '/mo' },
]

const DEV_INCLUDES = [
    'Embedded wallets',
    'Session keys & gasless paymaster',
    'All core SDK features',
]

const CUSTOM_FEATURES = [
    'Volume-based pricing',
    'Dedicated support',
    'Custom integrations',
    'Invoicing & contracts',
]

const FEATURE_GROUPS: { title: string; Art: () => React.ReactElement; items: string[] }[] = [
    {
        title: 'Wallet creation',
        Art: IcoWallet,
        items: ['Embedded wallets', 'Self-custodial smart accounts', 'No seed phrases or extensions'],
    },
    {
        title: 'Gasless transactions',
        Art: IcoGas,
        items: ['Built-in gas sponsorship', 'On-chain STRK Gas Tank', 'Sponsor any transaction', 'Per-organization gas balances'],
    },
    {
        title: 'Developer experience',
        Art: IcoCode,
        items: ['React & React Native SDKs', '~15-minute integration', 'Dashboard & usage analytics'],
    },
    {
        title: 'Security & recovery',
        Art: IcoShield,
        items: ['Programmable session keys', 'Device-signer accounts', 'OAuth-based recovery', '100% non-custodial'],
    },
]

const FAQ: { q: string; a: string }[] = [
    {
        q: 'What counts as a wallet?',
        a: 'Every smart account your users create through Cavos — across all of your apps and every network — counts as one wallet. Both the React SDK and the device-signer kit count identically.',
    },
    {
        q: 'What happens when I hit the free limit?',
        a: 'Existing wallets always keep working — reading, signing, transactions and recovery are never gated. Only the creation of new wallets pauses at 1,000. Upgrading to Pro lifts the limit instantly.',
    },
    {
        q: 'Is gas sponsorship included?',
        a: 'Gas sponsorship is funded separately through your on-chain Gas Tank (Paymasters), where you deposit STRK to cover your users’ transactions. It is independent of your plan — Free and Pro both support it.',
    },
    {
        q: 'Can I cancel anytime?',
        a: 'Yes. Pro is month-to-month. When you cancel, you keep Pro until the end of the current billing period, then drop back to Free. Your wallets are never deleted.',
    },
]

function Check({ className = '' }: { className?: string }) {
    return (
        <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}

export default function PricingPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Product",
                "name": "Cavos Embedded Wallet SDK",
                "description": "Embedded wallet SDK for Starknet with wallet-based pricing.",
                "offers": [
                    { "@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "USD", "description": "Up to 1,000 wallets." },
                    { "@type": "Offer", "name": "Pro", "price": "99", "priceCurrency": "USD", "description": "Unlimited wallets, billed monthly." },
                ],
            },
            {
                "@type": "FAQPage",
                "mainEntity": FAQ.map((f) => ({
                    "@type": "Question",
                    "name": f.q,
                    "acceptedAnswer": { "@type": "Answer", "text": f.a },
                })),
            },
        ],
    }

    return (
        <main className="bg-white min-h-screen text-ink font-sans antialiased">
            <Script
                id="pricing-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <div className="max-w-6xl mx-auto px-6 md:px-8 pt-28 pb-24">

                {/* ── Hero ── */}
                <header className="relative max-w-3xl">
                    <h1 className="text-[clamp(2rem,4vw,3rem)] font-medium tracking-[-0.035em] leading-[1.05] text-ink text-balance">
                        Pricing that scales with your wallets.
                    </h1>
                    <p className="mt-4 text-[16px] md:text-[17px] text-muted leading-relaxed max-w-xl">
                        One simple unit: a wallet. Start free up to 1,000 wallets across all your apps,
                        upgrade to unlimited when you grow, and talk to us when you need more.
                    </p>
                </header>

                {/* ── Plans — one card, split in two ── */}
                <section className="mt-10 grid grid-cols-1 lg:grid-cols-2 items-stretch rounded-[18px] border border-line-strong bg-white overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-line-strong">

                    {/* Developer — self-serve, billed by wallets */}
                    <div className="flex flex-col p-7 md:p-9">
                        <h2 className="text-[1.75rem] md:text-[2.125rem] font-medium tracking-[-0.04em] text-ink leading-[0.95]">
                            Developer
                        </h2>
                        <p className="mt-3 text-[14px] text-muted leading-relaxed max-w-[44ch]">
                            For teams getting started. The full SDK, free up to 1,000 wallets —
                            go unlimited the moment you outgrow it.
                        </p>

                        <div className="mt-7">
                            {USAGE_TIERS.map((row) => (
                                <div
                                    key={row.label}
                                    className="flex items-end justify-between gap-4 py-4 border-t border-line first:border-t-0"
                                >
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                                            {row.label}
                                        </div>
                                        <div className="mt-1.5 text-[15px] text-ink">{row.range}</div>
                                    </div>
                                    <div className="flex items-baseline gap-1 shrink-0">
                                        <span className="text-[1.75rem] font-medium tracking-[-0.03em] text-ink leading-none">
                                            {row.price}
                                        </span>
                                        {row.unit && <span className="text-sm text-muted">{row.unit}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link
                            href="/register"
                            className="mt-7 inline-flex items-center justify-center h-11 px-6 rounded-full bg-brand text-white text-[15px] font-medium hover:bg-brand-hover transition-colors duration-200 active:scale-[0.99]"
                        >
                            Get started
                        </Link>

                        <ul className="mt-7 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 flex-1 content-start">
                            {DEV_INCLUDES.map((f) => (
                                <li key={f} className="flex items-start gap-2.5 text-[14px]">
                                    <Check className="shrink-0 mt-[3px] w-3.5 h-3.5 text-brand" />
                                    <span className="text-ink/70 leading-snug">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Custom — sales-led */}
                    <div className="flex flex-col p-7 md:p-9 bg-surface">
                        <h2 className="text-[1.75rem] md:text-[2.125rem] font-medium tracking-[-0.04em] text-ink leading-[0.95]">
                            Custom
                        </h2>
                        <p className="mt-3 text-[14px] text-muted leading-relaxed max-w-[44ch]">
                            For platforms at scale that need volume pricing, compliance,
                            and a dedicated path to production.
                        </p>

                        <ul className="mt-7 space-y-3.5 flex-1">
                            {CUSTOM_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-3 text-[15px]">
                                    <Check className="shrink-0 mt-[3px] w-4 h-4 text-brand" />
                                    <span className="text-ink/75 leading-snug">{f}</span>
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/contact-sales"
                            className="mt-7 inline-flex items-center justify-center h-11 px-6 rounded-full border border-ink/15 text-ink text-[15px] font-medium hover:border-ink/35 hover:bg-white transition-colors duration-200 active:scale-[0.99]"
                        >
                            Contact sales
                        </Link>
                    </div>
                </section>

                <p className="mt-7 text-center text-[13px] text-muted">
                    All plans include the full SDK, embedded wallets, and gasless paymaster support.
                </p>

                {/* ── Features out of the box ── */}
                <section className="mt-28 border-t border-line pt-16">
                    <h2 className="text-2xl md:text-[28px] font-medium tracking-[-0.02em] text-ink mb-12">
                        Every plan ships with the full platform
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
                        {FEATURE_GROUPS.map((g) => (
                            <div key={g.title}>
                                <div className="mb-4 -ml-1"><g.Art /></div>
                                <h3 className="text-sm font-semibold text-ink mb-3.5">{g.title}</h3>
                                <ul className="space-y-2.5">
                                    {g.items.map((it) => (
                                        <li key={it} className="flex items-start gap-2.5 text-[13px]">
                                            <Check className="shrink-0 mt-0.5 text-brand/70" />
                                            <span className="text-ink/60 font-normal leading-snug">{it}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="mt-28 border-t border-line pt-16">
                    <h2 className="text-2xl md:text-[28px] font-medium tracking-[-0.02em] text-ink mb-10">Frequently asked</h2>
                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-9">
                        {FAQ.map((f) => (
                            <div key={f.q} className="space-y-2">
                                <h3 className="text-[15px] font-semibold text-ink">{f.q}</h3>
                                <p className="text-sm text-ink/55 leading-relaxed font-normal">{f.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── CTA — light framed band ── */}
                <section className="mt-28 rounded-2xl border border-line-strong bg-surface px-8 py-12 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-md">
                        <h2 className="text-2xl md:text-[28px] font-medium tracking-[-0.02em] text-ink leading-[1.15] text-balance">
                            Start building in minutes.
                        </h2>
                        <p className="mt-3 text-sm text-ink/55 leading-relaxed font-normal">
                            Spin up your first 1,000 wallets free — no credit card required.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-all active:scale-[0.98]"
                        >
                            Get started free
                        </Link>
                        <a
                            href="https://docs.cavos.xyz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-11 px-6 rounded-md border border-line-strong text-ink text-sm font-semibold hover:border-ink/40 transition-all active:scale-[0.98]"
                        >
                            Read the docs
                        </a>
                    </div>
                </section>
            </div>

            <Footer />
        </main>
    )
}
