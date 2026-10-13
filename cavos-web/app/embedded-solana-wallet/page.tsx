import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
    SOLANA_WALLET_DESCRIPTION,
    SOLANA_WALLET_PATH,
    SOLANA_WALLET_TITLE,
    breadcrumbListJsonLd,
    marketingPageMetadata,
} from '@/lib/marketing-seo'

const PAGE_URL = 'https://cavos.xyz/embedded-solana-wallet'

export const metadata: Metadata = marketingPageMetadata({
    title: SOLANA_WALLET_TITLE,
    description: SOLANA_WALLET_DESCRIPTION,
    path: SOLANA_WALLET_PATH,
})

const CODE_EXAMPLE = `import { Cavos } from "@cavos/kit";

const session = await Cavos.connect({
  chains: ["solana"],
  defaultChain: "solana",
  network: "mainnet",
  identity: { userId: user.id, email: user.email },
  appSalt: "my-app",
  appId: process.env.NEXT_PUBLIC_CAVOS_APP_ID,
});

const wallet = session.wallet("solana");

// Execute when undeployed OR ready
if (wallet.status !== "needs-device-approval") {
  const signature = await wallet.execute(
    1_000_000n,  // 0.001 SOL in lamports
    recipientPublicKey
  );
}`

export default function EmbeddedSolanaWalletPage() {
    const breadcrumbs = {
        '@context': 'https://schema.org',
        ...breadcrumbListJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Embedded Solana Wallet', path: '/embedded-solana-wallet' },
        ]),
    }
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        '@id': `${PAGE_URL}#software`,
        name: 'Cavos Embedded Solana Wallet',
        url: PAGE_URL,
        operatingSystem: 'Web, iOS, Android',
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'Embedded Solana Wallet SDK',
        description: 'A device-native, self-custodial embedded wallet SDK for Solana. The signing key is created and used on the user\'s device. Native Ed25519 system account with a spend key derived on the device, and gasless transactions.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free tier available.',
        },
        author: { '@id': 'https://cavos.xyz/#organization' },
        featureList: [
            'Native Ed25519 spend key derived from the user\'s MasterDEK',
            'Native system account (same shape as Phantom)',
            'Gasless transactions via relayer',
            'Arbitrary program calls (SPL tokens, swaps)',
            'Passkey and enclave restore on new devices',
            'React and React Native SDKs',
        ],
        screenshot: 'https://cavos.xyz/og-image.png',
    }

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <script
                id="embedded-solana-wallet-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                id="embedded-solana-wallet-breadcrumbs-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
            />
            <Header />

            <div className="mx-auto max-w-4xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        Embedded Solana Wallet
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        A device-native, self-custodial embedded wallet for Solana. The signing key
                        is created and used on the user&apos;s device — Cavos cannot see it, cannot sign
                        with it, and cannot move funds. Available via <code className="text-sm bg-surface px-1.5 py-0.5 rounded">@cavos/kit</code> for
                        web and <code className="text-sm bg-surface px-1.5 py-0.5 rounded">@cavos/kit/react-native</code> for
                        mobile (Expo Development Builds, EAS, or bare React Native — Expo Go is not supported).
                    </p>
                    <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
                        The spend key is derived from a MasterDEK that stays protected at rest by the
                        device&apos;s non-extractable key (WebCrypto in the browser, the OS keystore on React
                        Native). The SDK does not enforce non-extractability on Node or other server
                        runtimes.
                    </p>
                    <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
                        New to the category?{' '}
                        <Link href="/embedded-wallet" className="font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                            What is an embedded wallet
                        </Link>
                        {' '}covers custody models, key management, and how this Solana adapter fits.
                    </p>
                </header>

                <section className="mt-16">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">Account model</h2>
                    <div className="mt-6 rounded-2xl border border-line bg-surface/50 p-8">
                        <p className="text-sm leading-relaxed text-muted">
                            Cavos provisions a <strong>native Ed25519 system account</strong> — an ordinary Solana
                            address, not a PDA. Its spend key is derived from the user&apos;s MasterDEK.
                        </p>
                        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
                            <li className="flex gap-3">
                                <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand" />
                                <span>The user&apos;s Ed25519 key signs the Solana transaction message; Solana verifies it natively.</span>
                            </li>
                            <li className="flex gap-3">
                                <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand" />
                                <span>The relayer can be named fee payer, but a co-signer cannot alter the instructions it signs.</span>
                            </li>
                            <li className="flex gap-3">
                                <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand" />
                                <span><strong>Passkey:</strong> a synced passkey holds an encrypted copy of the MasterDEK, so a new device can open the same wallet.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                <section className="mt-16">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">Install</h2>
                    <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-[#1a1a1a] p-5 text-sm">
                        <pre className="text-white/90"><code>npm install @cavos/kit</code></pre>
                    </div>
                </section>

                <section className="mt-16">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">Connect and execute</h2>
                    <p className="mt-4 text-sm leading-relaxed text-muted">
                        Use <code className="text-xs bg-surface px-1.5 py-0.5 rounded">Cavos.connect</code> with <code className="text-xs bg-surface px-1.5 py-0.5 rounded">chains: [&quot;solana&quot;]</code>.
                        Connect never deploys the account — it&apos;s created lazily on first execute.
                        You can call <code className="text-xs bg-surface px-1.5 py-0.5 rounded">execute</code> when
                        status is <code className="text-xs bg-surface px-1.5 py-0.5 rounded">&quot;undeployed&quot;</code> or <code className="text-xs bg-surface px-1.5 py-0.5 rounded">&quot;ready&quot;</code>.
                        Only <code className="text-xs bg-surface px-1.5 py-0.5 rounded">&quot;needs-device-approval&quot;</code> blocks execution.
                    </p>
                    <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-[#1a1a1a] p-5 text-sm">
                        <pre className="text-white/90 whitespace-pre-wrap"><code>{CODE_EXAMPLE}</code></pre>
                    </div>
                </section>

                <section className="mt-16">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">What you get</h2>
                    <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
                        {[
                            ['Self-custodial', 'Cavos never holds a key that can move user funds. The spend key is derived from a MasterDEK that only the user\'s devices can open.'],
                            ['Native account', 'A plain Ed25519 system account — no custom on-chain program.'],
                            ['Gasless transactions', 'The Cavos relayer co-signs as fee payer — users hold no SOL to get started.'],
                            ['Arbitrary programs', 'Beyond SOL transfers: SPL tokens, swaps, staking via executeInstructions (allowlisted programs).'],
                            ['Passkey and enclave restore', 'A synced passkey or an enclave sign-in restores the MasterDEK on a new device.'],
                            ['Lazy deploy', 'Connect derives the address immediately. The account is initialized on first execute, atomically.'],
                        ].map(([title, body]) => (
                            <article key={title} className="bg-white p-7">
                                <h3 className="font-semibold">{title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand px-8 py-10 text-white md:flex-row md:items-center">
                    <div>
                        <h2 className="text-2xl font-medium">Start building on Solana.</h2>
                        <p className="mt-2 text-sm text-white/60">Follow the quickstart to reach a sponsored transaction.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="https://docs.cavos.xyz/docs/solana"
                            className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink"
                        >
                            Solana guide
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
