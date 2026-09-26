import type { Metadata } from 'next'
import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'

export const metadata: Metadata = {
    title: 'Page not found',
    robots: { index: false, follow: true },
}

export default function NotFound() {
    return (
        <main className="flex min-h-dvh flex-col bg-brand px-6 py-6 text-white sm:px-10 sm:py-8 [&_a:focus-visible]:outline-white [&_a:focus-visible]:ring-white">
            <header>
                <Wordmark href="/" inverted className="h-8 w-8" />
            </header>

            <section
                aria-labelledby="not-found-title"
                className="not-found-enter flex flex-1 flex-col items-center justify-center py-16 text-center"
            >
                <div className="flex max-w-xl flex-col items-center">
                    <svg
                        aria-hidden
                        viewBox="12 -707 780 714"
                        fill="currentColor"
                        className="w-[clamp(11rem,38vw,20rem)]"
                    >
                        <path d="M256 -700H59L12 -207V-92H150V0H256ZM110 -207 140 -584H150V-207ZM414 -592V-108H390V-592ZM280 -115C280 -38 335 7 402 7C470 7 524 -38 524 -115V-585C524 -662 470 -707 402 -707C335 -707 280 -662 280 -585ZM792 -700H595L548 -207V-92H686V0H792ZM646 -207 676 -584H686V-207Z" />
                    </svg>
                    <h1
                        id="not-found-title"
                        className="mt-10 text-2xl font-semibold text-balance sm:text-3xl"
                    >
                        This page doesn&apos;t exist.
                    </h1>
                    <p className="mt-3 max-w-[46ch] text-base text-white/80 text-pretty">
                        The link may be broken, or the page may have moved. Check the
                        address, or head back to somewhere that does.
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/"
                            data-pressable
                            className="inline-flex h-11 items-center rounded-lg bg-white px-5 text-sm font-medium text-brand transition-colors duration-150 hover:bg-white/90"
                        >
                            Back to home
                        </Link>
                        <Link
                            href="/dashboard"
                            data-pressable
                            className="inline-flex h-11 items-center rounded-lg border border-white/40 px-5 text-sm font-medium text-white transition-colors duration-150 hover:border-white/70 hover:bg-white/10"
                        >
                            Open dashboard
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
