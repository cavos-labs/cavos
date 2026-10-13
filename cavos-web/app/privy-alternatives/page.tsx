import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { breadcrumbListJsonLd, marketingPageMetadata } from '@/lib/marketing-seo'
import {
    PRIVY_ALTERNATIVE_SECTIONS,
    PRIVY_ALTERNATIVES_DESCRIPTION,
    PRIVY_ALTERNATIVES_FAQ,
    PRIVY_ALTERNATIVES_H1,
    PRIVY_ALTERNATIVES_PATH,
    PRIVY_ALTERNATIVES_TITLE,
    privyChooseThem,
} from '@/lib/privy-alternatives'

const linkClass =
    'font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink'

export const metadata: Metadata = marketingPageMetadata({
    title: PRIVY_ALTERNATIVES_TITLE,
    description: PRIVY_ALTERNATIVES_DESCRIPTION,
    path: PRIVY_ALTERNATIVES_PATH,
    type: 'article',
})

export default function PrivyAlternativesPage() {
    const url = `https://cavos.xyz${PRIVY_ALTERNATIVES_PATH}`
    const chooseThem = privyChooseThem()
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                '@id': `${url}#webpage`,
                url,
                name: PRIVY_ALTERNATIVES_TITLE,
                description: PRIVY_ALTERNATIVES_DESCRIPTION,
                isPartOf: { '@id': 'https://cavos.xyz/#website' },
                breadcrumb: { '@id': `${url}#breadcrumb` },
            },
            {
                ...breadcrumbListJsonLd([
                    { name: 'Home', path: '/' },
                    { name: 'Compare', path: '/compare' },
                    { name: 'Privy alternatives', path: PRIVY_ALTERNATIVES_PATH },
                ]),
                '@id': `${url}#breadcrumb`,
            },
            {
                '@type': 'FAQPage',
                '@id': `${url}#faq`,
                mainEntity: PRIVY_ALTERNATIVES_FAQ.map((item) => ({
                    '@type': 'Question',
                    name: item.question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: item.answer,
                    },
                })),
            },
        ],
    }

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <script
                id="privy-alternatives-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <div className="mx-auto max-w-6xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        {PRIVY_ALTERNATIVES_H1}
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        Privy is a widely adopted{' '}
                        <Link href="/embedded-wallet" className={linkClass}>
                            embedded wallet
                        </Link>{' '}
                        and authentication provider focused primarily on EVM chains, offering
                        both embedded wallets and external wallet connection. Teams look for a
                        Privy alternative when that custody model, chain coverage, commercial
                        terms, or switching cost no longer match the product they are shipping.
                    </p>
                    <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                        This guide uses the same facts as the{' '}
                        <Link href="/compare" className={linkClass}>
                            compare pages
                        </Link>
                        . It does not invent competitor pricing. Cavos publishes its own fees on
                        the{' '}
                        <Link href="/pricing" className={linkClass}>
                            pricing page
                        </Link>
                        ; other vendors set theirs independently. Migration is a project, not a
                        config change: wallet addresses are derived differently, so accounts do
                        not transfer automatically.
                    </p>
                </header>

                <section className="mt-24">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">
                        Alternatives to evaluate
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
                        Each section is an architectural sketch. The linked comparison covers
                        custody, chain support, signing authority, sponsorship, and recovery —
                        including when the other product is the better choice.
                    </p>
                    <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
                        {PRIVY_ALTERNATIVE_SECTIONS.map((alt) => (
                            <article key={alt.name} className="bg-white p-7">
                                <h3 className="text-xl font-semibold">{alt.name}</h3>
                                {alt.paragraphs.map((paragraph) => (
                                    <p
                                        key={paragraph}
                                        className="mt-3 text-sm leading-relaxed text-muted"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                                <p className="mt-4">
                                    <Link href={alt.href} className={linkClass}>
                                        {alt.linkLabel}
                                        <span aria-hidden="true"> →</span>
                                    </Link>
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-24 overflow-hidden rounded-2xl border border-line">
                    <article className="bg-white p-8">
                        <h2 className="text-xl font-semibold">When Privy is still the right choice</h2>
                        <p className="mt-4 text-sm leading-relaxed text-muted">
                            Privy is the more mature choice across the EVM ecosystem. It is not
                            the weaker product — it covers ground Cavos does not. Stay with Privy
                            when the following are true.
                        </p>
                        <ul className="mt-5 space-y-3">
                            {chooseThem.map((item) => (
                                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                                    <span
                                        aria-hidden="true"
                                        className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-muted"
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </article>
                </section>

                <section className="mt-24">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Frequently asked</h2>
                    <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
                        {PRIVY_ALTERNATIVES_FAQ.map((item) => (
                            <article key={item.question}>
                                <h3 className="font-semibold">{item.question}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-24 flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand px-8 py-10 text-white md:flex-row md:items-center">
                    <div>
                        <h2 className="text-2xl font-medium">Evaluate it against your own requirements.</h2>
                        <p className="mt-2 text-sm text-white/60">
                            Start with the quickstart, or talk to us about a production integration.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="https://docs.cavos.xyz/docs/quickstart"
                            className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink"
                        >
                            Read the quickstart
                        </a>
                        <Link
                            href="/contact-sales"
                            className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                        >
                            Contact sales
                        </Link>
                    </div>
                </section>
            </div>

            <Footer />
        </main>
    )
}
