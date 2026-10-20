import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { COMPETITORS, getCompetitor } from '@/lib/compare-data'
import { PRIVY_VS_TURNKEY_PATH } from '@/lib/embedded-wallet-guide'
import { compareCompetitorPageJsonLd, marketingPageMetadata } from '@/lib/marketing-seo'

const linkClass =
    'font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink'

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

    const title =
        competitor.pageTitle ?? `Cavos vs ${competitor.name}: embedded wallet comparison`
    const description =
        competitor.pageDescription ??
        `An honest comparison of Cavos and ${competitor.name} across custody, chain support, signing authority, gas sponsorship, and recovery — including when ${competitor.name} is the better choice.`

    return marketingPageMetadata({
        title,
        description,
        path: `/compare/${competitor.slug}`,
        type: 'article',
    })
}

export default async function ComparisonPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const competitor = getCompetitor(slug)
    if (!competitor) notFound()

    const jsonLd = compareCompetitorPageJsonLd(competitor)

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <script
                id={`compare-${competitor.slug}-json-ld`}
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <div className="mx-auto max-w-6xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        {competitor.pageH1 ?? `Cavos vs ${competitor.name}`}
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        {competitor.slug === 'privy' ? (
                            <>
                                This comparison is about Privy the embedded crypto wallet, not
                                the Shopify popup tool of the same name. For a multi-vendor
                                shortlist, see{' '}
                                <Link href="/privy-alternatives" className={linkClass}>
                                    Privy alternatives
                                </Link>
                                . For finished auth and wallets versus signing
                                infrastructure, see{' '}
                                <Link href={PRIVY_VS_TURNKEY_PATH} className={linkClass}>
                                    Privy vs Turnkey
                                </Link>
                                .{' '}
                            </>
                        ) : null}
                        {competitor.slug === 'turnkey' ? (
                            <>
                                For how Turnkey’s key-management layer differs from Privy’s
                                finished embedded wallet product, see{' '}
                                <Link href={PRIVY_VS_TURNKEY_PATH} className={linkClass}>
                                    Privy vs Turnkey
                                </Link>
                                .{' '}
                            </>
                        ) : null}
                        {competitor.summary}
                    </p>
                    <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                        {competitor.positioning}
                    </p>
                    <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                        For the category itself — custody, key models, and what the SDK
                        actually does — start with{' '}
                        <Link href="/embedded-wallet" className={linkClass}>
                            how embedded wallets work
                        </Link>
                        .
                    </p>
                </header>

                <section className="mt-16 overflow-x-auto rounded-2xl border border-line">
                    <table className="w-full min-w-[720px] border-collapse text-left">
                        <thead className="bg-brand text-white">
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
                        {competitor.slug === 'privy' ? (
                            <Link
                                href="/privy-alternatives"
                                className="rounded-md border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-ink"
                            >
                                Privy wallet alternatives
                            </Link>
                        ) : null}
                    </div>
                </section>

                <section className="mt-20 flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand px-8 py-10 text-white md:flex-row md:items-center">
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
