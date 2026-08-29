import Link from 'next/link'
import { Header } from '@/components/Header'
import { AppsCarousel } from '@/components/AppsCarousel'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import { CaseStudies } from '@/components/landing/CaseStudies'
import { CtaSplit } from '@/components/landing/CtaSplit'
import { SignInPreview } from '@/components/landing/SignInPreview'
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

            {/* Brand stage — indigo as a field, the way the playground uses it.
                White widget sits on the color; copy and chrome invert to match. */}
            <div className="relative bg-brand text-white">
                <div
                    aria-hidden
                    className="brand-dot-grid pointer-events-none absolute inset-0 opacity-80 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(80% 60% at 80% 20%, rgba(255,255,255,0.14) 0%, transparent 55%)',
                    }}
                />

                <div className="relative mx-auto max-w-[1280px] border-x border-white/12">
                    <div className="flex flex-col pt-[4.5rem] md:min-h-screen">
                        <section className="relative flex flex-1 items-start px-6 py-16 md:items-center md:px-16 md:py-20 lg:px-24">
                            <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
                                <div className="space-y-10 md:space-y-12">
                                    <div data-hero className="max-w-2xl">
                                        <h1 className="text-[clamp(1.75rem,3.1vw,2.75rem)] font-medium leading-[1.12] tracking-[-0.03em] text-balance">
                                            <span className="block">
                                                Your next million users shouldn&apos;t need to understand crypto.
                                            </span>
                                            <span className="mt-3 hidden max-w-xl text-[clamp(1.05rem,1.5vw,1.2rem)] font-normal leading-relaxed text-white/70 text-balance sm:block">
                                                Let them sign in, pay, earn, and own as naturally as they use any other product—while Cavos handles the wallet infrastructure underneath.
                                            </span>
                                        </h1>
                                    </div>

                                    <div data-hero className="grid w-full max-w-sm grid-cols-1 gap-3 sm:flex sm:max-w-none sm:items-center">
                                        <Link
                                            href="/register"
                                            className="inline-flex h-14 w-full items-center justify-center rounded-md bg-white px-7 text-sm font-semibold text-brand transition-colors hover:bg-white/90 active:scale-[0.98] sm:h-auto sm:w-auto sm:py-3"
                                        >
                                            Build your first wallet
                                        </Link>
                                        <a
                                            href="https://docs.cavos.xyz"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex h-14 w-full items-center justify-center rounded-md border border-white/25 bg-white/8 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/14 sm:h-auto sm:w-auto sm:py-3"
                                        >
                                            Explore the docs
                                        </a>
                                    </div>
                                </div>

                                <div data-hero className="lg:justify-self-end">
                                    <SignInPreview />
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-white/12">
                            <AppsCarousel tone="on-brand" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative mx-auto max-w-[1280px] border-x border-line">
                <FeaturesGrid />

                <div className="border-t border-line">
                    <CaseStudies />
                </div>
            </div>

            <CtaSplit />

            <Footer />
        </main>
    )
}
