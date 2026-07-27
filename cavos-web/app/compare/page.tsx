import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
    title: 'Cavos vs Embedded Wallet Providers',
    description: 'Compare Cavos with hosted embedded wallets and wallet extensions across custody, chain support, signing, gas sponsorship, recovery, and developer experience.',
    alternates: {
        canonical: 'https://cavos.xyz/compare',
    },
    openGraph: {
        title: 'Cavos vs Embedded Wallet Providers',
        description: 'A clear comparison of device-native Cavos smart accounts, hosted embedded wallets, and traditional wallet extensions.',
        url: 'https://cavos.xyz/compare',
        type: 'website',
        images: ['/og-image.png'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Cavos vs Embedded Wallet Providers',
        description: 'Compare custody, chain support, signing, sponsorship, recovery, and developer experience.',
        images: ['/og-image.png'],
    },
}

const COMPARISON = [
    {
        feature: 'Signing authority',
        cavos: 'A non-exportable device signer controlled by the user',
        hosted: 'Provider-specific key management or MPC model',
        extension: 'A key managed in a separate wallet application',
    },
    {
        feature: 'Chain strategy',
        cavos: 'One SDK with chain-native adapters',
        hosted: 'Network coverage and account model vary by provider',
        extension: 'Coverage depends on the wallet and installed networks',
    },
    {
        feature: 'Current Cavos coverage',
        cavos: 'Starknet, Solana, and Stellar',
        hosted: 'Varies by provider',
        extension: 'Varies by wallet',
    },
    {
        feature: 'User experience',
        cavos: 'Embedded directly in the product; no wallet extension',
        hosted: 'Embedded directly in the product',
        extension: 'Users install, open, and approve in another application',
    },
    {
        feature: 'Gas sponsorship',
        cavos: 'Chain-specific paymaster and relayer integrations',
        hosted: 'Varies by provider and network',
        extension: 'Usually funded by the user or a separate paymaster',
    },
    {
        feature: 'Recovery',
        cavos: 'Device authorization and non-custodial recovery factors',
        hosted: 'Provider-defined recovery',
        extension: 'Seed phrase, passkey, or wallet-specific recovery',
    },
]

const FAQ = [
    {
        question: 'What makes Cavos different from hosted embedded wallets?',
        answer: 'Cavos makes the user’s device the signing authority. The device key is non-exportable, Cavos does not reconstruct it with MPC, and each chain adapter uses the chain’s native account and transaction model.',
    },
    {
        question: 'Which blockchains does Cavos support?',
        answer: 'Cavos currently ships adapters for Starknet, Solana, and Stellar. The SDK is designed around a chain-adapter interface so additional blockchains can be added without changing the product-level integration model.',
    },
    {
        question: 'Does Cavos use MPC?',
        answer: 'No. Cavos does not split or reconstruct a master key with MPC. Signing authority stays with device-bound keys or the chain-specific non-custodial control model documented for each adapter.',
    },
    {
        question: 'Can one application use Cavos across multiple chains?',
        answer: 'Yes. Applications use the same Cavos.connect entry point and select a chain and network. The returned wallet is a typed, chain-specific object so native transaction behavior stays explicit.',
    },
]

export default function ComparePage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                '@id': 'https://cavos.xyz/compare#webpage',
                url: 'https://cavos.xyz/compare',
                name: 'Cavos vs Embedded Wallet Providers',
                description: 'Comparison of multichain embedded wallet approaches across custody, signing, sponsorship, recovery, and developer experience.',
                isPartOf: { '@id': 'https://cavos.xyz/#website' },
            },
            {
                '@type': 'FAQPage',
                '@id': 'https://cavos.xyz/compare#faq',
                mainEntity: FAQ.map((item) => ({
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
            <Script
                id="compare-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <div className="mx-auto max-w-6xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand">Architecture comparison</p>
                    <h1 className="mt-5 text-balance text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        Choose the wallet model, not just the login modal.
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        Cavos is device-native and chain-agnostic: one product integration, with an
                        explicit adapter for each blockchain. Compare that model with hosted key
                        networks and traditional wallet extensions.
                    </p>
                </header>

                <section className="mt-16 overflow-x-auto rounded-2xl border border-line">
                    <table className="w-full min-w-[860px] border-collapse text-left">
                        <thead className="bg-ink text-white">
                            <tr>
                                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider">Capability</th>
                                <th className="border-l border-white/10 px-6 py-5 text-sm font-semibold">Cavos</th>
                                <th className="border-l border-white/10 px-6 py-5 text-sm font-semibold">Hosted embedded wallets</th>
                                <th className="border-l border-white/10 px-6 py-5 text-sm font-semibold">Wallet extensions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARISON.map((row) => (
                                <tr key={row.feature} className="border-t border-line first:border-t-0">
                                    <th scope="row" className="w-[18%] px-6 py-5 text-sm font-semibold">{row.feature}</th>
                                    <td className="w-[28%] border-l border-line bg-brand/[0.035] px-6 py-5 text-sm leading-relaxed">{row.cavos}</td>
                                    <td className="w-[27%] border-l border-line px-6 py-5 text-sm leading-relaxed text-muted">{row.hosted}</td>
                                    <td className="w-[27%] border-l border-line px-6 py-5 text-sm leading-relaxed text-muted">{row.extension}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="mt-24">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Why the adapter model matters</h2>
                    <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
                        {[
                            ['One integration surface', 'Authentication, wallet state, recovery, and sponsorship share a consistent product-level API.'],
                            ['Native where it counts', 'Address derivation, signatures, execution, and fees remain explicit and correct for each blockchain.'],
                            ['Built beyond three chains', 'New adapters can join the same interface without pretending every blockchain has the same account model.'],
                        ].map(([title, body]) => (
                            <article key={title} className="bg-white p-7">
                                <h3 className="text-lg font-semibold">{title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-24">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Frequently asked</h2>
                    <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
                        {FAQ.map((item) => (
                            <article key={item.question}>
                                <h3 className="font-semibold">{item.question}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-24 flex flex-col items-start justify-between gap-6 rounded-2xl bg-ink px-8 py-10 text-white md:flex-row md:items-center">
                    <div>
                        <h2 className="text-2xl font-medium">Build the first wallet on your target chain.</h2>
                        <p className="mt-2 text-sm text-white/60">Start with the unified SDK, then follow the native guide for each adapter.</p>
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
