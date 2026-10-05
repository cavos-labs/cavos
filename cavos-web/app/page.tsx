import Link from 'next/link'
import { Header } from '@/components/Header'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import { CaseStudies } from '@/components/landing/CaseStudies'
import { CtaSplit } from '@/components/landing/CtaSplit'
import { HeroOrb } from '@/components/HeroOrb'
import { Footer } from '@/components/Footer'
import { LandingMotion } from '@/components/LandingMotion'
import Script from 'next/script'
import { homepageJsonLd, marketingPageMetadata } from '@/lib/marketing-seo'

export const metadata = marketingPageMetadata({
    title: 'Multichain Embedded Wallet Infrastructure',
    description:
        'Turn every sign-in into a self-custodial wallet. One SDK for device-native onboarding and sponsored transactions on Starknet, Solana, and Stellar.',
    path: '/',
})

export default function LandingPage() {
    const jsonLd = homepageJsonLd()

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

                {/* Hero fills one viewport */}
                <div className="flex flex-col pt-[4.5rem] md:min-h-screen">

                    {/* ── HERO ──────────────────────────────────── */}
                    <section className="relative md:flex-1 flex items-start md:items-center px-6 md:px-16 lg:px-24 pt-20 pb-12 md:pt-20 md:pb-20">
                        <div className="space-y-10 md:space-y-14">
                            <div className="max-w-5xl">
                                <h1 className="text-[clamp(1.625rem,2.6vw,2.375rem)] font-medium leading-[1.14] tracking-[-0.03em] text-ink text-balance">
                                    Your next million users shouldn&apos;t need to understand crypto.
                                </h1>
                                <p className="mt-3 max-w-4xl text-[clamp(1.05rem,1.6vw,1.25rem)] leading-snug tracking-[-0.02em] text-ink/45 text-balance">
                                    Let them sign in, pay, earn, and own as naturally as they use any other product—while Cavos handles the wallet infrastructure underneath.
                                </p>
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
