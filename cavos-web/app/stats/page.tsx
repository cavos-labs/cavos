import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { LandingMotion } from '@/components/LandingMotion'
import { Metric, MetricGrid } from '@/components/stats/Metric'
import {
    DownloadsSparkline,
    GrowthPanel,
    OperationsPanel,
} from '@/components/stats/StatsCharts'
import { getPublicStats } from '@/lib/stats'
import { formatCount, formatTimestamp, UNREADABLE } from '@/lib/stats/format'
import Script from 'next/script'

export const revalidate = 3600

const TITLE = 'Cavos in Numbers'
const DESCRIPTION =
    'Live usage figures for Cavos multichain embedded wallets across Starknet, Solana, and Stellar, straight from our own records and the public npm registry.'

export const metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
        canonical: 'https://cavos.xyz/stats',
    },
    openGraph: {
        title: `${TITLE} | Cavos`,
        description: DESCRIPTION,
        url: 'https://cavos.xyz/stats',
        images: ['/og-image.png'],
    },
    twitter: {
        card: 'summary_large_image',
        title: `${TITLE} | Cavos`,
        description: DESCRIPTION,
        images: ['/og-image.png'],
    },
}

const SOURCES = [
    {
        metric: 'Sponsored operations',
        detail: 'Relay submissions and recorded transactions Cavos completed successfully. Lifetime, from our daily rollup plus the last 30 days of raw events.',
    },
    {
        metric: 'Wallets registered',
        detail: 'Smart accounts currently registered with Cavos. Not a lifetime total: wallets created before our August 2026 address-keyed migration were removed.',
    },
    {
        metric: 'Mainnet and testnet',
        detail: 'Counted separately and never blended. Starknet is live on mainnet. Solana and Stellar are integrated and currently running on their test networks, so their wallets are reported as testnet. The per-chain breakdown is in the JSON below.',
    },
    {
        metric: 'SDK downloads',
        detail: 'Last 30 days from the public npm registry. Download counts include mirrors and CI, so read them as reach, not as users.',
    },
]

export default async function StatsPage() {
    const stats = await getPublicStats()
    const { totals, packages } = stats

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: TITLE,
        description: DESCRIPTION,
        url: 'https://cavos.xyz/stats',
        isPartOf: { '@type': 'WebSite', name: 'Cavos', url: 'https://cavos.xyz' },
    }

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <Script
                id="stats-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />
            <LandingMotion />

            <div className="mx-auto max-w-6xl px-6 pb-24 pt-28 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="text-balance text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.035em] text-ink">
                        Everything Cavos can count, counted in public.
                    </h1>
                    <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted md:text-[17px]">
                        These are our own records, not projections. Every number below names its
                        source and its window, and anything we cannot read renders as a dash
                        rather than a zero.
                    </p>
                    <p className="mt-4 font-mono text-xs tabular-nums text-muted">
                        Updated {formatTimestamp(stats.generatedAt)} UTC · refreshed hourly
                    </p>
                </header>

                <section className="mt-16" aria-labelledby="headline-heading">
                    <h2 id="headline-heading" className="sr-only">
                        Headline figures
                    </h2>
                    <MetricGrid columns={4}>
                        <Metric
                            label="Sponsored operations"
                            value={formatCount(totals.sponsoredOperations)}
                            note="Relayed and recorded, lifetime"
                        />
                        <Metric
                            label="Wallets registered"
                            value={formatCount(totals.walletsRegistered)}
                            note="Smart accounts live today"
                        />
                        <Metric
                            label="Apps built on Cavos"
                            value={formatCount(totals.apps)}
                            note={`Across ${formatCount(totals.organizations)} teams`}
                        />
                        <Metric
                            label="Chains integrated"
                            value="3"
                            note="Starknet, Solana, and Stellar"
                        />
                    </MetricGrid>
                </section>

                <section className="mt-28 border-t border-line pt-16" aria-labelledby="growth-heading">
                    <div className="grid gap-6 md:grid-cols-2 md:gap-12">
                        <h2
                            id="growth-heading"
                            className="max-w-[18ch] text-[clamp(1.75rem,2.8vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.03em] text-ink"
                        >
                            Growth, not a snapshot.
                        </h2>
                        <p className="max-w-[44ch] self-end text-[15px] leading-relaxed text-muted">
                            Absolute counts are young. The shape of the curve is the part worth
                            reading, so we show it, split by mainnet and testnet rather than
                            blended into one flattering figure.
                        </p>
                    </div>

                    <div className="mt-12 grid items-start gap-5 lg:grid-cols-2">
                        <GrowthPanel data={stats.walletGrowth} />
                        <OperationsPanel data={stats.operationsByNet} />
                    </div>
                </section>


                <section className="mt-28 border-t border-line pt-16" aria-labelledby="sdk-heading">
                    <h2
                        id="sdk-heading"
                        className="text-2xl font-medium tracking-[-0.03em] text-ink md:text-[28px]"
                    >
                        SDK reach
                    </h2>
                    <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
                        Downloads from the public npm registry over the last 30 days. Registry
                        counts include mirrors and CI installs, so treat them as reach rather than
                        as a user count.
                    </p>

                    <div
                        data-reveal
                        data-reveal-group
                        className="mt-10 grid gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {packages.map((pkg) => (
                            <div key={pkg.name} className="bg-white px-6 py-7">
                                <div className="flex items-baseline justify-between gap-3">
                                    <p className="font-mono text-[13px] font-medium text-ink">
                                        {pkg.name}
                                    </p>
                                    <span className="font-mono text-[11px] tabular-nums text-muted">
                                        {pkg.latestVersion ? `v${pkg.latestVersion}` : UNREADABLE}
                                    </span>
                                </div>
                                <p className="mt-4 font-mono text-3xl font-semibold tabular-nums text-ink">
                                    {formatCount(pkg.downloads30d)}
                                </p>
                                <p className="mt-2 text-xs text-muted">Downloads, last 30 days</p>
                                <div className="mt-4">
                                    <DownloadsSparkline data={pkg.series} id={pkg.name} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>


                <section
                    className="mt-28 border-t border-line pt-16"
                    aria-labelledby="sources-heading"
                >
                    <h2
                        id="sources-heading"
                        className="text-2xl font-medium tracking-[-0.03em] text-ink md:text-[28px]"
                    >
                        How these numbers are produced
                    </h2>
                    <dl className="mt-10 max-w-3xl divide-y divide-line border-y border-line">
                        {SOURCES.map((source) => (
                            <div key={source.metric} className="grid gap-2 py-5 md:grid-cols-3 md:gap-8">
                                <dt className="text-sm font-medium text-ink">{source.metric}</dt>
                                <dd className="text-[14px] leading-relaxed text-muted md:col-span-2">
                                    {source.detail}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-8 max-w-2xl text-[14px] leading-relaxed text-muted">
                        The same figures are available as JSON at{' '}
                        <code className="font-mono text-[13px] text-ink">/api/public/stats</code>.
                        We do not publish token balances, transfer amounts, or anything tied to an
                        individual end user, because Cavos does not record them.
                    </p>
                </section>
            </div>

            <Footer />
        </main>
    )
}
