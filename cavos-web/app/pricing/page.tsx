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
    title: "Embedded Wallet Pricing | Cavos",
    description: "Flat monthly fees for multichain embedded wallets. Free up to 1,000 wallets. Essential $59/mo. Complete $139/mo with enclave recovery.",
    alternates: {
        canonical: "https://cavos.xyz/pricing",
    },
    openGraph: {
        title: "Embedded Wallet Pricing | Cavos",
        description: "Flat monthly org fees. Free up to 1,000 wallets. Essential $59/mo. Complete $139/mo.",
        url: "https://cavos.xyz/pricing",
        images: ["/og-image.png"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Embedded Wallet Pricing | Cavos",
        description: "Flat monthly org fees. Free up to 1,000 wallets. Essential $59/mo. Complete $139/mo.",
        images: ["/og-image.png"],
    },
}

/* ── Domain model: one source of truth ── */
type PlanId = 'free' | 'essential' | 'complete'
type Plan = {
    id: PlanId
    name: string
    feeUsdPerMonth: 0 | 59 | 139
    createCap: 1000 | 'unlimited'
    recovery: 'none-on-plan' | 'on-device' | 'enclave'
}

const PLANS: Plan[] = [
    { id: 'free', name: 'Free', feeUsdPerMonth: 0, createCap: 1000, recovery: 'none-on-plan' },
    { id: 'essential', name: 'Essential', feeUsdPerMonth: 59, createCap: 'unlimited', recovery: 'on-device' },
    { id: 'complete', name: 'Complete', feeUsdPerMonth: 139, createCap: 'unlimited', recovery: 'enclave' },
]

const DEV_INCLUDES = [
    'Starknet, Solana & Stellar adapters',
    'Web and React Native SDKs',
    'Gas sponsorship integrations',
]

function IcoTelegram({ className = '' }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
    )
}

function IcoSlack({ className = '' }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
        </svg>
    )
}

const RECOVERY_FEATURES = [
    { label: 'On-device recovery', desc: 'Passkey, recovery code, or enrolled device.' },
    { label: 'Enclave recovery', desc: 'AWS Nitro hardware isolation for device key rewrap.' },
]

const FEATURE_GROUPS: { title: string; Art: () => React.ReactElement; items: string[] }[] = [
    {
        title: 'Wallet creation',
        Art: IcoWallet,
        items: ['Embedded wallets', 'No seed phrases or extensions', 'Single API across chains'],
    },
    {
        title: 'Gasless transactions',
        Art: IcoGas,
        items: ['Chain-specific sponsorship', 'Per-network gas balances', 'Relayer policies', 'Operational activity'],
    },
    {
        title: 'Developer experience',
        Art: IcoCode,
        items: ['Unified TypeScript API', 'React & React Native', 'Dashboard & usage analytics'],
    },
    {
        title: 'Security & recovery',
        Art: IcoShield,
        items: ['Device-bound signers', 'On-device or enclave recovery', 'Non-custodial architecture'],
    },
]

const FAQ: { q: string; a: string }[] = [
    {
        q: 'What counts as a wallet create?',
        a: 'Each new wallet your app provisions counts toward the create cap. Existing wallets, reads, and signatures remain unrestricted. When Free hits 1,000 creates, only new creates pause.',
    },
    {
        q: 'Which chains are supported?',
        a: 'Starknet, Solana, and Stellar. The same SDK and adapters ship on every plan. Stellar wallets are classic G accounts.',
    },
    {
        q: 'What is enclave recovery?',
        a: 'Complete includes AWS Nitro enclave recovery. If a user loses their passkey, they can rewrap their device encryption key to a new device through a hardware-isolated flow. The enclave never holds your Stellar control seed or signs transactions.',
    },
    {
        q: 'Is gas sponsorship included?',
        a: 'Gas sponsorship is available on every plan and funded separately. Costs are billed to the integrator, not included in these flat fees.',
    },
    {
        q: 'Can I cancel anytime?',
        a: 'Yes. Paid plans are month-to-month. When you cancel, you keep your plan until the billing period ends, then drop back to Free. Your wallets are never deleted.',
    },
]

function Check({ className = '' }: { className?: string }) {
    return (
        <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}

function formatPlanRow(plan: Plan): { name: string; desc: string; price: string; unit?: string } {
    if (plan.feeUsdPerMonth === 0) {
        return { name: plan.name, desc: 'First 1,000 wallet creates', price: 'Free' }
    }
    return { name: plan.name, desc: 'Unlimited creates', price: `$${plan.feeUsdPerMonth}`, unit: '/mo' }
}

export default function PricingPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Product",
                "name": "Cavos Embedded Wallet SDK",
                "description": "Device-native multichain embedded wallet SDK with flat monthly pricing.",
                "offers": PLANS.map((p) => ({
                    "@type": "Offer",
                    "name": p.name,
                    "price": String(p.feeUsdPerMonth),
                    "priceCurrency": "USD",
                    "description": p.createCap === 1000 ? 'Up to 1,000 wallet creates.' : `${p.name} plan, billed monthly.`,
                })),
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
                        Flat org fees. Unlimited after the first 1,000.
                    </h1>
                    <p className="mt-4 text-[16px] md:text-[17px] text-muted leading-relaxed max-w-xl">
                        Three plans with predictable monthly costs. Free gets you started.
                        Paid plans unlock unlimited creates and advanced recovery.
                    </p>
                </header>

                {/* ── Plans — one card, split in two ── */}
                <section className="mt-10 grid grid-cols-1 lg:grid-cols-2 items-stretch rounded-[18px] border border-line-strong bg-white overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-line-strong">

                    {/* Left — price rows */}
                    <div className="flex flex-col p-7 md:p-9">
                        <h2 className="text-[1.75rem] md:text-[2.125rem] font-medium tracking-[-0.04em] text-ink leading-[0.95]">
                            Plans
                        </h2>
                        <p className="mt-3 text-[14px] text-muted leading-relaxed max-w-[44ch]">
                            The full SDK on every tier. Free up to 1,000 wallet creates.
                            Paid plans add unlimited creates and recovery options.
                        </p>

                        <div className="mt-7">
                            {PLANS.map((plan) => {
                                const row = formatPlanRow(plan)
                                return (
                                    <div
                                        key={plan.id}
                                        className="flex items-end justify-between gap-4 py-4 border-t border-line first:border-t-0"
                                    >
                                        <div>
                                            <div className="text-[15px] font-medium text-ink">{row.name}</div>
                                            <div className="mt-1 text-[14px] text-muted">{row.desc}</div>
                                        </div>
                                        <div className="flex items-baseline gap-1 shrink-0">
                                            <span className="text-[1.75rem] font-medium tracking-[-0.03em] text-ink leading-none">
                                                {row.price}
                                            </span>
                                            {row.unit && <span className="text-sm text-muted">{row.unit}</span>}
                                        </div>
                                    </div>
                                )
                            })}
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

                        <div className="mt-5 flex items-center gap-2.5 text-[14px]">
                            <Check className="shrink-0 w-3.5 h-3.5 text-brand" />
                            <span className="text-ink/70 leading-snug inline-flex items-center gap-x-1 flex-wrap">
                                Priority support via Telegram
                                <IcoTelegram className="text-muted shrink-0" />
                                or Slack
                                <IcoSlack className="text-muted shrink-0" />
                            </span>
                        </div>
                    </div>

                    {/* Right — recovery options */}
                    <div className="flex flex-col p-7 md:p-9 bg-surface">
                        <h2 className="text-[1.75rem] md:text-[2.125rem] font-medium tracking-[-0.04em] text-ink leading-[0.95]">
                            Recovery
                        </h2>
                        <p className="mt-3 text-[14px] text-muted leading-relaxed max-w-[44ch]">
                            The fork between paid plans is recovery. Essential uses on-device methods.
                            Complete adds hardware-isolated enclave recovery.
                        </p>

                        <ul className="mt-7 space-y-5 flex-1">
                            {RECOVERY_FEATURES.map((f) => (
                                <li key={f.label} className="flex items-start gap-3">
                                    <Check className="shrink-0 mt-[3px] w-4 h-4 text-brand" />
                                    <div>
                                        <div className="text-[15px] font-medium text-ink">{f.label}</div>
                                        <div className="mt-1 text-[14px] text-ink/60 leading-relaxed">{f.desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <p className="mt-7 text-[13px] text-muted leading-relaxed">
                            The enclave rewraps a device encryption key. It does not hold your Stellar control seed or sign transactions.
                        </p>
                    </div>
                </section>

                <p className="mt-7 text-center text-[13px] text-muted">
                    Every plan includes the full SDK and all chain adapters. Gas sponsorship is funded separately.
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
                            Your first 1,000 wallet creates are free. No credit card required.
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
