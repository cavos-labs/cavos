/* ──────────────────────────────────────────────────────────────
   CtaSplit — pre-footer closer. Two distinct paths side by side,
   kept in the Cavos hairline-frame system: self-serve on the left,
   talk-to-us on the right. Light, restrained, dependency-free.
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
        <section data-reveal data-reveal-group className="grid grid-cols-1 divide-y divide-line lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {/* self-serve */}
            <div className="flex flex-col justify-between gap-10 px-6 py-16 md:px-16 md:py-20 lg:px-24">
                <div className="max-w-[34ch]">
                    <h2 className="text-[clamp(1.5rem,2.4vw,2.125rem)] font-medium leading-[1.15] tracking-[-0.03em] text-ink">
                        Embed your first wallet today.
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed text-muted">
                        Drop in the SDK and your users get a self-custodial smart account from a Google or Apple login. Free for your first 1,000 wallets.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/login"
                        className="group inline-flex items-center gap-1.5 rounded-md bg-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover active:scale-[0.98]"
                    >
                        Get started
                        <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                    <a
                        href="https://docs.cavos.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md border border-line-strong bg-white px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
                    >
                        Read the docs
                    </a>
                </div>
            </div>

            {/* talk to the team — subtle tint to separate the path */}
            <div className="flex flex-col justify-between gap-10 bg-surface px-6 py-16 md:px-16 md:py-20 lg:px-24">
                <div className="max-w-[34ch]">
                    <h2 className="text-[clamp(1.5rem,2.4vw,2.125rem)] font-medium leading-[1.15] tracking-[-0.03em] text-ink">
                        Building something custom?
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed text-muted">
                        Custom appchains, dedicated signers, volume pricing. Tell us what you are building and the team will help you ship it.
                    </p>
                </div>
                <Link
                    href="/contact-sales"
                    className="group inline-flex w-fit items-center gap-1.5 rounded-md border border-line-strong bg-white px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
                >
                    Contact sales
                    <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
            </div>
        </section>
    )
}
