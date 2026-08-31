import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const PAGE_URL = 'https://cavos.xyz/embedded-stellar-wallet'

export const metadata: Metadata = {
    title: 'Embedded Stellar Wallet SDK',
    description: 'A device-native, self-custodial embedded wallet for Stellar. The signing key is created and used on the user\'s device — Cavos cannot see it, sign with it, or move funds. Classic G… account with on-chain sealed control key.',
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: 'Embedded Stellar Wallet SDK',
        description: 'Device-native self-custody for Stellar. Key lives on the device, not on a server. Classic G… account with silent signing and gasless transactions.',
        url: PAGE_URL,
        type: 'website',
        images: ['/og-image.png'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Embedded Stellar Wallet SDK',
        description: 'Device-native self-custody for Stellar. Key lives on the device, not on a server.',
        images: ['/og-image.png'],
    },
}

const CODE_EXAMPLE = `import { Cavos } from "@cavos/kit";

const session = await Cavos.connect({
  chains: ["stellar"],
  defaultChain: "stellar",
  network: "mainnet",
  identity: { userId: user.id, email: user.email },
  appSalt: "my-app",
  appId: process.env.NEXT_PUBLIC_CAVOS_APP_ID,
});

const wallet = session.wallet("stellar");

// Execute when undeployed OR ready
if (wallet.status !== "needs-device-approval") {
  const hash = await wallet.execute(
    10_000_000n,  // 1 XLM in stroops
    "GDESTINATION...ADDRESS"
  );
}`

export default function EmbeddedStellarWalletPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        '@id': `${PAGE_URL}#software`,
        name: 'Cavos Embedded Stellar Wallet',
        url: PAGE_URL,
        operatingSystem: 'Web, iOS, Android',
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'Embedded Stellar Wallet SDK',
        description: 'A device-native, self-custodial embedded wallet SDK for Stellar. The signing key is created and used on the user\'s device. Classic G… account with on-chain sealed control key, gasless transactions, and Soroban contract support.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free tier available.',
        },
        author: { '@id': 'https://cavos.xyz/#organization' },
        featureList: [
            'Device-native signing key',
            'Classic G… Stellar account',
            'On-chain sealed control key',
            'Gasless transactions via relayer',
            'Soroban contract invocations',
            'WebAuthn PRF passkey recovery',
            'React and React Native SDKs',
        ],
        screenshot: 'https://cavos.xyz/og-image.png',
    }

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <Script
                id="embedded-stellar-wallet-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <div className="mx-auto max-w-4xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        Embedded Stellar Wallet
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        A device-native, self-custodial embedded wallet for Stellar. The signing key
                        is created and used on the user&apos;s device — Cavos cannot see it, cannot sign
                        with it, and cannot move funds. Available via <code className="text-sm bg-surface px-1.5 py-0.5 rounded">@cavos/kit</code> for
                        web and <code className="text-sm bg-surface px-1.5 py-0.5 rounded">@cavos/kit/react-native</code> for
                        mobile (Expo Development Builds, EAS, or bare React Native — Expo Go is not supported).
                    </p>
                    <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
                        In the browser, the device key is a non-extractable P-256 key stored via WebCrypto.
                        On React Native, it uses the OS keystore. These platform primitives provide the
                        hardware-backed isolation — the SDK does not enforce non-extractability on Node
                        or other server runtimes.
                    </p>
                </header>

                <section className="mt-16">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">Account model</h2>
                    <div className="mt-6 rounded-2xl border border-line bg-surface/50 p-8">
                        <p className="text-sm leading-relaxed text-muted">
                            Cavos provisions a <strong>classic G… Stellar account</strong> — not a Soroban
                            contract. It&apos;s the same address format that wallets, exchanges, and every
                            Stellar tool already understands.
                        </p>
                        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
                            <li className="flex gap-3">
                                <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand" />
                                <span>A <strong>control key</strong> (weight 1) signs transactions. Its seed is sealed <strong>on-chain</strong> in the account&apos;s data entries (<code className="text-xs bg-white px-1 py-0.5 rounded border border-line">cv:ct</code>).</span>
                            </li>
                            <li className="flex gap-3">
                                <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand" />
                                <span>Each device holds an ECDH key that unwraps its own slot to obtain the control key — signing is silent and local.</span>
                            </li>
                            <li className="flex gap-3">
                                <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand" />
                                <span><strong>Passkey:</strong> On Stellar, the passkey is a <strong>WebAuthn PRF</strong> that unwraps the data-encryption key (DEK) for the control key. This is <em>not</em> 2FA — anyone with the synced passkey (via iCloud Keychain or Google Password Manager) can spend. A synced passkey recovers the G… wallet.</span>
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
                        Use <code className="text-xs bg-surface px-1.5 py-0.5 rounded">Cavos.connect</code> with <code className="text-xs bg-surface px-1.5 py-0.5 rounded">chains: [&quot;stellar&quot;]</code>.
                        Connect never creates the account — it&apos;s created lazily on first execute.
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
                            ['Self-custodial', 'Cavos never holds a key that can move user funds. The on-chain account is the sole authority over signers.'],
                            ['Classic G… address', 'Standard Stellar address format compatible with all exchanges, wallets, and ecosystem tools.'],
                            ['Gasless transactions', 'The Cavos relayer sponsors account reserves and pays transaction fees — users hold no XLM to get started.'],
                            ['Soroban support', 'The account can invoke Soroban contracts and satisfy require_auth for on-chain apps like escrows.'],
                            ['Passkey + recovery', 'WebAuthn PRF passkey for device approval (note: on Stellar it unwraps the spending key, not 2FA). Recovery codes as offline backup.'],
                            ['Lazy deploy', 'Connect derives the address immediately. The on-chain account is created on first execute, atomically.'],
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
                        <h2 className="text-2xl font-medium">Start building on Stellar.</h2>
                        <p className="mt-2 text-sm text-white/60">Follow the quickstart to reach a sponsored transaction.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="https://docs.cavos.xyz/docs/stellar"
                            className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink"
                        >
                            Stellar guide
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
