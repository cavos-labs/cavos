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
    description: "Turn every sign-in into a self-custodial wallet. One SDK for seamless onboarding and sponsored transactions across chains.",
    alternates: {
        canonical: "https://cavos.xyz",
    },
    openGraph: {
        title: "Multichain Embedded Wallet Infrastructure | Cavos",
        description: "Turn every sign-in into a self-custodial wallet. One SDK for seamless onboarding and sponsored transactions across chains.",
        url: "https://cavos.xyz",
        images: ["/og-image.png"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Multichain Embedded Wallet Infrastructure | Cavos",
        description: "Turn every sign-in into a self-custodial wallet. One SDK for seamless onboarding and sponsored transactions across chains.",
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
                    "Device-controlled self-custody",
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
                            <div className="max-w-4xl">
                                <h1 className="text-[2rem] font-normal tracking-[-0.045em] leading-[1.03] sm:text-[clamp(2.25rem,3.4vw,3.25rem)]">
                                    <span className="block font-medium text-ink text-balance">
                                        Your next million users shouldn&apos;t need to understand crypto.
                                    </span>
                                    <span className="mt-3 block max-w-3xl text-[0.88em] leading-[1.06] tracking-[-0.035em] text-ink/45 text-balance">
                                        Let them sign in, pay, earn, and own as naturally as they use any other product—while Cavos handles the wallet infrastructure underneath.
                                    </span>
                                </h1>
                            </div>

                            <div data-hero className="grid w-full max-w-sm grid-cols-1 gap-3 sm:flex sm:max-w-none sm:items-center">
                                <Link
                                    href="/register"
                                    className="inline-flex h-14 w-full items-center justify-center rounded-md bg-brand px-7 text-sm font-semibold text-white transition-colors hover:bg-brand-hover active:scale-[0.98] sm:h-auto sm:w-auto sm:py-3"
                                >
                                    Build your first wallet
                                </Link>
                                <a
                                    href="https://docs.cavos.xyz"
                                    target="_blank"
                                    className="inline-flex h-14 w-full items-center justify-center rounded-md border border-line-strong bg-white px-7 text-sm font-semibold text-ink transition-colors hover:border-ink/40 sm:h-auto sm:w-auto sm:py-3"
                                >
                                    Explore the docs
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
