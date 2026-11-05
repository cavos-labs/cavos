import Link from 'next/link'

type MarketingSignupCtaProps = {
    heading?: string
    body?: string
    className?: string
}

/**
 * Dark brand closer used on marketing guides and every blog post.
 * Matches the existing compare / chain / alternatives CTA: brand panel,
 * white primary button, hairline secondary. No pills, tags, or color bars.
 */
export function MarketingSignupCta({
    heading = 'Add a non-custodial wallet in minutes.',
    body = 'Free up to 1,000 wallets. Hardware-isolated, non-custodial. Keys never leave the device in plaintext.',
    className = 'mt-16',
}: MarketingSignupCtaProps) {
    return (
        <section
            className={`${className} flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand px-8 py-10 text-white md:flex-row md:items-center`}
        >
            <div>
                <h2 className="text-2xl font-medium">{heading}</h2>
                <p className="mt-2 max-w-xl text-sm text-white/70">{body}</p>
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
                    className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                >
                    Read the docs
                </a>
            </div>
        </section>
    )
}
