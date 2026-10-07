import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
    ABOUT_DESCRIPTION,
    ABOUT_PATH,
    ABOUT_TITLE,
    FRAMEZZ_GALLERIES_URL,
    FRAMEZZ_URL,
    aboutPageJsonLd,
    marketingPageMetadata,
} from '@/lib/marketing-seo'

const linkClass =
    'font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink'

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
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        Cavos is a software and SaaS company.
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        We build products. The main one is an embedded wallet SDK.
                        We also build Framezz and Framezz Galleries.
                    </p>
                </header>

                <section className="mt-20 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Cavos wallet</h2>
                    <p className="mt-5 text-base leading-relaxed text-muted">
                        A wallet-as-a-service SDK. Applications turn a sign-in into a
                        self-custodial wallet — device-native, with adapters for Starknet,
                        Solana, and Stellar.
                    </p>
                    <p className="mt-6">
                        <Link href="/" className={linkClass}>
                            cavos.xyz
                        </Link>
                    </p>
                </section>

                <section className="mt-20">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Framezz and Framezz Galleries</h2>
                    <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
                        <article className="bg-white p-7 md:p-8">
                            <h3 className="text-lg font-semibold">Framezz</h3>
                            <p className="mt-3 text-sm leading-relaxed text-muted">
                                Event photography. Attendees upload a selfie and get every photo
                                they appear in, then download in high resolution. We shoot. You
                                appear.
                            </p>
                            <p className="mt-6">
                                <a
                                    href={FRAMEZZ_URL}
                                    target="_blank"
                                    rel="noopener"
                                    className={linkClass}
                                >
                                    studioframezz.com
                                </a>
                            </p>
                        </article>
                        <article className="bg-white p-7 md:p-8">
                            <h3 className="text-lg font-semibold">Framezz Galleries</h3>
                            <p className="mt-3 text-sm leading-relaxed text-muted">
                                Marketplace and galleries for photographers covering races,
                                tournaments, and graduations in Costa Rica. Photographers sell
                                event photos under their own brand; clients find themselves via
                                selfie or bib number and pay by card — free to start.
                            </p>
                            <p className="mt-6">
                                <a
                                    href={FRAMEZZ_GALLERIES_URL}
                                    target="_blank"
                                    rel="noopener"
                                    className={linkClass}
                                >
                                    galleries.studioframezz.com
                                </a>
                            </p>
                        </article>
                    </div>
                </section>

                <section className="mt-24 flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand px-8 py-10 text-white md:flex-row md:items-center">
                    <div>
                        <h2 className="text-2xl font-medium">Build with the Cavos wallet.</h2>
                        <p className="mt-2 max-w-xl text-sm text-white/70">
                            The embedded wallet SDK is the main product. Start on the free tier,
                            then follow the docs for each chain adapter.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/register"
                            className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink"
                        >
                            Create an account
                        </Link>
                        <a
                            href="https://docs.cavos.xyz"
                            target="_blank"
                            rel="noopener"
                            className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                        >
                            Read the docs
                        </a>
                    </div>
                </section>
            </article>

            <Footer />
        </main>
    )
}
