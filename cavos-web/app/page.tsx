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
    title: "Multichain Embedded Wallet Infrastructure | Cavos",
    description: "Build device-native, self-custodial smart accounts across high-performance blockchains with one SDK. No seed phrases, MPC, or wallet extensions.",
    alternates: {
        canonical: "https://cavos.xyz",
    },
    openGraph: {
        title: "Multichain Embedded Wallet Infrastructure | Cavos",
        description: "One SDK for device-native smart accounts across Starknet, Solana, Stellar, and the chains that come next.",
        url: "https://cavos.xyz",
        images: ["/og-image.png"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Multichain Embedded Wallet Infrastructure | Cavos",
        description: "One SDK for device-native smart accounts across Starknet, Solana, Stellar, and the chains that come next.",
        images: ["/og-image.png"],
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
                "applicationSubCategory": "Multichain embedded wallet infrastructure",
                "description": "Cavos is a device-native embedded wallet SDK for building verifiable, self-custodial smart accounts across blockchains. Starknet, Solana, and Stellar adapters are available today, with an architecture designed for every chain.",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "description": "Free tier available. Start building at no cost."
                },
                "author": { "@id": "https://cavos.xyz/#organization" },
                "featureList": [
                    "Device-native P-256 signers",
                    "Deterministic smart-account addresses",
                    "Verifiable self-custody without MPC",
                    "Gas sponsorship and relayers",
                    "Starknet, Solana, and Stellar adapters",
                    "React and React Native SDKs",
                    "Multi-device authorization and recovery"
                ],
                "screenshot": "https://cavos.xyz/og-image.png"
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
                                <span className="font-medium">One embedded wallet layer for every chain.</span><br />
                                Device-native signing, verifiable self-custody, gasless UX.<br />
                                No extensions. No seed phrases. No MPC.
                            </h1>

                            <div data-hero className="flex flex-wrap items-center gap-3">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center px-7 py-3 bg-brand text-white rounded-md font-semibold text-sm hover:bg-brand-hover transition-colors active:scale-[0.98]"
                                >
                                    Start building
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
