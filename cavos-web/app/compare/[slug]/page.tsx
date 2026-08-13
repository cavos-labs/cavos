import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { COMPETITORS, getCompetitor } from '@/lib/compare-data'

export function generateStaticParams() {
    return COMPETITORS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const competitor = getCompetitor(slug)
    if (!competitor) return {}

    const title = `Cavos vs ${competitor.name}: embedded wallet comparison`
    const description = `An honest comparison of Cavos and ${competitor.name} across custody, chain support, signing authority, gas sponsorship, and recovery — including when ${competitor.name} is the better choice.`
    const url = `https://cavos.xyz/compare/${competitor.slug}`

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'article',
            images: ['/og-image.png'],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['/og-image.png'],
        },
    }
}

export default async function ComparisonPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const competitor = getCompetitor(slug)
    if (!competitor) notFound()

    const url = `https://cavos.xyz/compare/${competitor.slug}`
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                '@id': `${url}#webpage`,
                url,
                name: `Cavos vs ${competitor.name}`,
                description: `Comparison of Cavos and ${competitor.name} across custody, signing authority, chain support, sponsorship, and recovery.`,
                isPartOf: { '@id': 'https://cavos.xyz/#website' },
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${url}#breadcrumb`,
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Compare', item: 'https://cavos.xyz/compare' },
                    { '@type': 'ListItem', position: 2, name: `Cavos vs ${competitor.name}`, item: url },
                ],
            },
            {
                '@type': 'FAQPage',
                '@id': `${url}#faq`,
                mainEntity: competitor.faq.map((item) => ({
                    '@type': 'Question',
                    name: item.question,
                    acceptedAnswer: { '@type': 'Answer', text: item.answer },
                })),
            },
        ],
    }

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <Script
                id={`compare-${competitor.slug}-json-ld`}
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <div className="mx-auto max-w-6xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand">
                        <Link href="/compare" className="hover:underline">Comparison</Link>
                    </p>
                    <h1 className="mt-5 text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        Cavos vs {competitor.name}
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        {competitor.summary}
                    </p>
                    <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                        {competitor.positioning}
                    </p>
                </header>

                <section className="mt-16 overflow-x-auto rounded-2xl border border-line">
                    <table className="w-full min-w-[720px] border-collapse text-left">
                        <thead className="bg-ink text-white">
                            <tr>
                                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider">Capability</th>
                                <th className="border-l border-white/10 px-6 py-5 text-sm font-semibold">Cavos</th>
                                <th className="border-l border-white/10 px-6 py-5 text-sm font-semibold">{competitor.name}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {competitor.rows.map((row) => (
                                <tr key={row.feature} className="border-t border-line first:border-t-0">
                                    <th scope="row" className="w-[20%] px-6 py-5 align-top text-sm font-semibold">{row.feature}</th>
                                    <td className="w-[40%] border-l border-line bg-brand/[0.035] px-6 py-5 align-top text-sm leading-relaxed">{row.cavos}</td>
                                    <td className="w-[40%] border-l border-line px-6 py-5 align-top text-sm leading-relaxed text-muted">{row.them}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="mt-24 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
                    <article className="bg-white p-8">
                        <h2 className="text-xl font-semibold">Choose {competitor.name} when</h2>
                        <ul className="mt-5 space-y-3">
                            {competitor.chooseThem.map((item) => (
                                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                                    <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-muted" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </article>
                    <article className="bg-white p-8">
                        <h2 className="text-xl font-semibold">Choose Cavos when</h2>
                        <ul className="mt-5 space-y-3">
                            {competitor.chooseCavos.map((item) => (
                                <li key={item} className="flex gap-3 text-sm leading-relaxed">
                                    <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </article>
                </section>

                <section className="mt-24">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Frequently asked</h2>
                    <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
                        {competitor.faq.map((item) => (
                            <article key={item.question}>
                                <h3 className="font-semibold">{item.question}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-24">
                    <h2 className="text-xl font-semibold">Other comparisons</h2>
                    <div className="mt-6 flex flex-wrap gap-3">
                        {COMPETITORS.filter((c) => c.slug !== competitor.slug).map((c) => (
                            <Link
                                key={c.slug}
                                href={`/compare/${c.slug}`}
                                className="rounded-md border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-ink"
                            >
                                Cavos vs {c.name}
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="mt-20 flex flex-col items-start justify-between gap-6 rounded-2xl bg-ink px-8 py-10 text-white md:flex-row md:items-center">
                    <div>
                        <h2 className="text-2xl font-medium">Evaluate it against your own requirements.</h2>
                        <p className="mt-2 text-sm text-white/60">
                            Start with the quickstart and reach a sponsored transaction on your target chain.
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
                            href="/register"
                            className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                        >
                            Create an account
                        </Link>
                    </div>
                </section>
            </div>

            <Footer />
        </main>
    )
}
