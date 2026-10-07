import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductShowcase } from '@/components/landing/ProductShowcase'
import {
    ABOUT_DESCRIPTION,
    ABOUT_PATH,
    ABOUT_TITLE,
    aboutPageJsonLd,
    marketingPageMetadata,
} from '@/lib/marketing-seo'

const primaryCtaClass =
    'inline-flex h-14 w-full items-center justify-center rounded-md bg-brand px-7 text-sm font-semibold text-white transition-colors hover:bg-brand-hover active:scale-[0.98] sm:h-auto sm:w-auto sm:py-3'

const secondaryCtaClass =
    'inline-flex h-14 w-full items-center justify-center rounded-md border border-line-strong bg-white px-7 text-sm font-semibold text-ink transition-colors hover:border-ink/40 sm:h-auto sm:w-auto sm:py-3'

export const metadata: Metadata = marketingPageMetadata({
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    path: ABOUT_PATH,
})

export default function AboutPage() {
    const jsonLd = aboutPageJsonLd()

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <script
                id="about-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <article className="mx-auto max-w-6xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="max-w-[16ch] text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        Cavos is a software and SaaS company.
                    </h1>
                    <p className="mt-7 max-w-[65ch] text-lg leading-relaxed text-muted">
                        The Cavos wallet is the main product. We also build other software
                        used by runners and photographers after an event.
                    </p>
                </header>

                <section className="mt-16 max-w-[65ch] border-t border-line pt-14 md:mt-20 md:pt-16">
                    <h2 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl">
                        The wallet is created on the device, from your login.
                    </h2>
                    <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted md:text-base">
                        <p>
                            Add the SDK to your app. After sign-in, it looks up or creates a
                            self-custodial account. Signing keys stay on the user&apos;s device.
                            Cavos cannot see them or move funds.
                        </p>
                        <p>
                            Adapters ship today for Starknet, Solana, and Stellar. The first
                            1,000 wallet creates are free.
                        </p>
                    </div>
                    <div className="mt-8 grid w-full max-w-sm grid-cols-1 gap-3 sm:flex sm:max-w-none sm:items-center">
                        <Link href="/register" className={primaryCtaClass}>
                            Build your first wallet
                        </Link>
                        <a
                            href="https://docs.cavos.xyz"
                            target="_blank"
                            rel="noopener"
                            className={secondaryCtaClass}
                        >
                            Read the docs
                        </a>
                    </div>
                </section>

                <section className="mt-20 border-t border-line pt-14 md:mt-24 md:pt-16">
                    <div className="grid gap-6 md:grid-cols-2 md:gap-12">
                        <h2 className="max-w-[18ch] text-[clamp(1.75rem,2.8vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.03em] text-ink">
                            Framezz and Framezz Galleries.
                        </h2>
                        <p className="max-w-[44ch] self-end text-[15px] leading-relaxed text-muted">
                            Framezz is the product runners use to find their photos. Framezz
                            Galleries is the one photographers use to sell them.
                        </p>
                    </div>
                    <ProductShowcase />
                </section>
            </article>

            <Footer />
        </main>
    )
}
