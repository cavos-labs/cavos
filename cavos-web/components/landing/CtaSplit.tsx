/* ──────────────────────────────────────────────────────────────
   CtaSplit — pre-footer closer on the brand indigo stage.
   Two paths sit on the same saturated field the playground uses:
   self-serve on the left, talk-to-us on a slightly lifted right.
   ────────────────────────────────────────────────────────────── */

import Link from 'next/link'

function Arrow({ className = '' }: { className?: string }) {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    )
}

export function CtaSplit() {
    return (
        <section className="relative bg-brand text-white">
            <div
                aria-hidden
                className="brand-dot-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
            />
            <div
                data-reveal
                data-reveal-group
                className="relative mx-auto grid max-w-[1280px] grid-cols-1 divide-y divide-white/12 border-x border-white/12 lg:grid-cols-2 lg:divide-x lg:divide-y-0"
            >
                <div className="flex flex-col justify-between gap-10 px-6 py-16 md:px-16 md:py-20 lg:px-24">
                    <div className="max-w-[34ch]">
                        <h2 className="text-[clamp(1.5rem,2.4vw,2.125rem)] font-medium leading-[1.15] tracking-[-0.03em]">
                            Embed your first multichain wallet today.
                        </h2>
                        <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                            Pick a chain, connect a stable user identity, and give users a device-native smart account. Free for your first 1,000 wallets.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/register"
                            className="group inline-flex items-center gap-1.5 rounded-md bg-white px-7 py-3 text-sm font-semibold text-brand transition-colors hover:bg-white/90 active:scale-[0.98]"
                        >
                            Get started
                            <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                        <a
                            href="https://docs.cavos.xyz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md border border-white/25 bg-white/8 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/14"
                        >
                            Read the docs
                        </a>
                    </div>
                </div>

                <div className="flex flex-col justify-between gap-10 bg-white/[0.06] px-6 py-16 md:px-16 md:py-20 lg:px-24">
                    <div className="max-w-[34ch]">
                        <h2 className="text-[clamp(1.5rem,2.4vw,2.125rem)] font-medium leading-[1.15] tracking-[-0.03em]">
                            Building something custom?
                        </h2>
                        <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                            Custom appchains, dedicated signers, volume pricing. Tell us what you are building and the team will help you ship it.
                        </p>
                    </div>
                    <Link
                        href="/contact-sales"
                        className="group inline-flex w-fit items-center gap-1.5 rounded-md border border-white/25 bg-white/8 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/14"
                    >
                        Contact sales
                        <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </section>
    )
}
