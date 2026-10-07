import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
    ABOUT_DESCRIPTION,
    ABOUT_PATH,
    ABOUT_TITLE,
    FRAMEZZ_APP_URL,
    FRAMEZZ_GALLERIES_URL,
    FRAMEZZ_URL,
    aboutPageJsonLd,
    marketingPageMetadata,
} from '@/lib/marketing-seo'

const linkClass =
    'font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink'

const primaryCtaClass =
    'inline-flex h-14 w-full items-center justify-center rounded-md bg-brand px-7 text-sm font-semibold text-white transition-colors hover:bg-brand-hover active:scale-[0.98] sm:h-auto sm:w-auto sm:py-3'

const secondaryCtaClass =
    'inline-flex h-14 w-full items-center justify-center rounded-md border border-line-strong bg-white px-7 text-sm font-semibold text-ink transition-colors hover:border-ink/40 sm:h-auto sm:w-auto sm:py-3'

const shotClass =
    'mt-6 block max-w-4xl overflow-hidden rounded-xl border border-line'

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
                        The Cavos wallet is the main product. Framezz is another product from
                        our software factory.
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
                    <h2 className="max-w-[65ch] text-xl font-medium tracking-[-0.03em] md:text-2xl">
                        Framezz came out of the same factory.
                    </h2>
                    <p className="mt-4 max-w-[65ch] text-[15px] leading-relaxed text-muted md:text-base">
                        Event photography software we built in-house, plus a marketplace for
                        the photographers who shoot those events.
                    </p>

                    <div className="mt-12 md:mt-14">
                        <h3 className="text-lg font-medium tracking-[-0.02em] md:text-xl">
                            Framezz
                        </h3>
                        <div className="mt-3 max-w-[65ch] space-y-4 text-[15px] leading-relaxed text-muted md:text-base">
                            <p>
                                A runner uploads one selfie and gets every photo they appear in.
                                They download the high-resolution originals.
                            </p>
                            <p>
                                Events include Ironman 70.3 Cap Cana, the Disney Princess Half
                                Marathon, BMW Lindora Run, and Clásica Palmarín MTB.{' '}
                                <a
                                    href={FRAMEZZ_URL}
                                    target="_blank"
                                    rel="noopener"
                                    className={linkClass}
                                >
                                    studioframezz.com
                                </a>
                            </p>
                        </div>
                        <a
                            href={FRAMEZZ_APP_URL}
                            target="_blank"
                            rel="noopener"
                            className={shotClass}
                        >
                            <Image
                                src="/images/products/framezz-app.webp"
                                alt="Framezz app: live and past race events, search by event or city, and high-resolution photo pickup"
                                width={1425}
                                height={900}
                                sizes="(max-width: 768px) 100vw, 896px"
                                loading="lazy"
                                className="h-auto w-full"
                            />
                        </a>
                    </div>

                    <div className="mt-14 md:mt-16">
                        <h3 className="text-lg font-medium tracking-[-0.02em] md:text-xl">
                            Framezz Galleries
                        </h3>
                        <div className="mt-3 max-w-[65ch] space-y-4 text-[15px] leading-relaxed text-muted md:text-base">
                            <p>
                                Event photographers of races, tournaments, and graduations sell
                                from a gallery on their own subdomain. Buyers see the
                                photographer&apos;s name, logo, colors, and watermark.
                            </p>
                            <p>
                                They find their shots with a selfie or a bib number, pay by card,
                                and download the high-resolution files. Photographers can start
                                on a free plan.{' '}
                                <a
                                    href={FRAMEZZ_GALLERIES_URL}
                                    target="_blank"
                                    rel="noopener"
                                    className={linkClass}
                                >
                                    galleries.studioframezz.com
                                </a>
                            </p>
                        </div>
                        <a
                            href={FRAMEZZ_GALLERIES_URL}
                            target="_blank"
                            rel="noopener"
                            className={shotClass}
                        >
                            <Image
                                src="/images/products/framezz-galleries.webp"
                                alt="Framezz Galleries homepage: photographers sell event photos from a gallery under their own brand"
                                width={1425}
                                height={900}
                                sizes="(max-width: 768px) 100vw, 896px"
                                loading="lazy"
                                className="h-auto w-full"
                            />
                        </a>
                    </div>
                </section>
            </article>

            <Footer />
        </main>
    )
}
