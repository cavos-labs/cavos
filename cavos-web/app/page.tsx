import Link from 'next/link'
import { Header } from '@/components/Header'
import { AppsCarousel } from '@/components/AppsCarousel'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import { CaseStudies } from '@/components/landing/CaseStudies'
import { CtaSplit } from '@/components/landing/CtaSplit'
import { HeroOrb } from '@/components/HeroOrb'
import { Footer } from '@/components/Footer'
import { LandingMotion } from '@/components/LandingMotion'
import Script from 'next/script'

export const metadata = {
    title: "Cavos | Invisible Crypto Infrastructure",
    description: "Cavos is a verifiable, MPC-free embedded wallet SDK for Starknet. Turn Google or Apple OAuth logins into self-custodial smart accounts with on-chain RSA-2048 verification — no seed phrases, no browser extensions, no MPC shards.",
    alternates: {
        canonical: "https://cavos.xyz",
    },
}

export default function LandingPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "@id": "https://cavos.xyz/#software",
                "name": "Cavos",
                "url": "https://cavos.xyz",
                "operatingSystem": "Web, iOS, Android",
                "applicationCategory": "DeveloperApplication",
                "description": "Cavos is a verifiable, MPC-free embedded wallet SDK for Starknet. Smart accounts are created automatically when users sign in with Google or Apple. No seed phrases, no browser extensions, no MPC shards. Powered by on-chain RSA-2048 verification via Garaga.",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "description": "Free tier available. Start building at no cost."
                },
                "author": { "@id": "https://cavos.xyz/#organization" },
                "featureList": [
                    "OAuth wallet creation via Google and Apple login",
                    "On-chain RSA-2048 JWT verification via Garaga",
                    "Gas abstraction with AVNU Paymaster integration",
                    "Session keys with programmable spending policies",
                    "Native account abstraction on Starknet",
                    "MPC-free — zero key shards stored",
                    "Self-custodial smart accounts (SRC-6)",
                    "AI agent signer support with headless sessions",
                    "React and React Native SDKs"
                ],
                "screenshot": "https://cavos.xyz/og-image.png",
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "5",
                    "reviewCount": "10",
                    "bestRating": "5"
                }
            },
            {
                "@type": "HowTo",
                "@id": "https://cavos.xyz/#howto",
                "name": "How to integrate Cavos embedded wallets into your app",
                "description": "Integrate self-custodial smart accounts with OAuth login in four steps using the Cavos SDK.",
                "totalTime": "PT15M",
                "step": [
                    {
                        "@type": "HowToStep",
                        "position": 1,
                        "name": "Authenticate",
                        "text": "Users log in via OAuth (Google or Apple) or email. Cavos verifies the JWT on-chain using RSA-2048 via Garaga."
                    },
                    {
                        "@type": "HowToStep",
                        "position": 2,
                        "name": "Provision Account",
                        "text": "Cavos automatically deploys a self-custodial smart account (SRC-6) on Starknet tied to the user's OAuth identity."
                    },
                    {
                        "@type": "HowToStep",
                        "position": 3,
                        "name": "Execute Transactions",
                        "text": "Transactions run through your backend or client. Gas is sponsored via AVNU Paymaster — users never need tokens to start."
                    },
                    {
                        "@type": "HowToStep",
                        "position": 4,
                        "name": "Scale",
                        "text": "Manage accounts, policies, and session keys via API. Define granular spending rules and integrate with any Starknet protocol."
                    }
                ]
            }
        ]
    }

    return (
        <main className="relative isolate min-h-screen w-full bg-white text-ink antialiased overflow-x-hidden">
            <Script
                id="page-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />
            <LandingMotion />

            {/* Glossy morphing 3D orb — full-bleed, spans header through hero */}
            <HeroOrb />

            {/* Framed grid container — hairline rules on both edges */}
            <div className="relative mx-auto max-w-[1280px] border-x border-line">

                {/* Hero + social proof together fill one viewport */}
                <div className="flex flex-col pt-[4.5rem] md:min-h-screen">

                    {/* ── HERO ──────────────────────────────────── */}
                    <section className="relative md:flex-1 flex items-start md:items-center px-6 md:px-16 lg:px-24 pt-14 md:pt-20 pb-12 md:pb-20">
                        <div className="space-y-10 md:space-y-14">
                            <h1 className="text-[clamp(1.75rem,2.3vw,2.375rem)] font-normal tracking-[-0.02em] leading-[1.3] text-ink">
                                <span className="font-medium">Smart accounts embedded directly into your product.</span><br />
                                Social login, gas abstraction, programmable security.<br />
                                No extensions. No seed phrases.
                            </h1>

                            <div data-hero className="flex flex-wrap items-center gap-3">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center px-7 py-3 bg-brand text-white rounded-md font-semibold text-sm hover:bg-brand-hover transition-colors active:scale-[0.98]"
                                >
                                    Get Started
                                </Link>
                                <a
                                    href="https://docs.cavos.xyz"
                                    target="_blank"
                                    className="inline-flex items-center justify-center px-7 py-3 bg-white text-ink rounded-md font-semibold text-sm border border-line-strong hover:border-ink/40 transition-colors"
                                >
                                    Read the docs
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* ── APPS / SOCIAL PROOF ─────────────────────── */}
                    <div className="border-t border-line">
                        <AppsCarousel />
                    </div>
                </div>

                {/* ── FEATURES / ADVANTAGES ───────────────────── */}
                <div className="border-t border-line">
                    <FeaturesGrid />
                </div>

                {/* ── CASE STUDIES / IN THE WILD ──────────────── */}
                <div className="border-t border-line">
                    <CaseStudies />
                </div>

                {/* ── PRE-FOOTER CTA ──────────────────────────── */}
                <div className="border-t border-line">
                    <CtaSplit />
                </div>

            </div>

            <Footer />
        </main>
    )
}
