import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const PAGE_URL = 'https://cavos.xyz/embedded-solana-wallet'

export const metadata: Metadata = {
    title: 'Embedded Solana Wallet SDK',
    description: 'A device-native, self-custodial embedded wallet for Solana. The signing key is created and used on the user\'s device — Cavos cannot see it, sign with it, or move funds. Device-account PDA with native secp256r1 precompile.',
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: 'Embedded Solana Wallet SDK',
        description: 'Device-native self-custody for Solana. Key lives on the device, not on a server. Native secp256r1 precompile verification with gasless transactions.',
        url: PAGE_URL,
        type: 'website',
        images: ['/og-image.png'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Embedded Solana Wallet SDK',
        description: 'Device-native self-custody for Solana. Key lives on the device, not on a server.',
        images: ['/og-image.png'],
    },
}

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
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        '@id': `${PAGE_URL}#software`,
        name: 'Cavos Embedded Solana Wallet',
        url: PAGE_URL,
        operatingSystem: 'Web, iOS, Android',
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'Embedded Solana Wallet SDK',
        description: 'A device-native, self-custodial embedded wallet SDK for Solana. The signing key is created and used on the user\'s device. Device-account PDA with native secp256r1 precompile verification and gasless transactions.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free tier available.',
        },
        author: { '@id': 'https://cavos.xyz/#organization' },
        featureList: [
            'Device-native P-256 signing key',
            'Deterministic device-account PDA',
            'Native secp256r1 precompile verification',
            'Gasless transactions via relayer',
            'Arbitrary program calls (SPL tokens, swaps)',
            'Passkey device approval',
            'React and React Native SDKs',
        ],
        screenshot: 'https://cavos.xyz/og-image.png',
    }

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <Script
                id="embedded-solana-wallet-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
                            Cavos provisions a <strong>device-account PDA</strong> controlled by a P-256 (secp256r1)
                            device key. Every guarded action pairs Solana&apos;s <strong>native secp256r1 precompile</strong> with
                            the Cavos device-account program.
                        </p>
                        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
                            <li className="flex gap-3">
                                <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand" />
                                <span>The <strong>secp256r1 precompile</strong> instruction records the device&apos;s P-256 signature, making it observable to the next instruction.</span>
                            </li>
                            <li className="flex gap-3">
                                <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand" />
                                <span>The <strong>program instruction</strong> reads the verified signer and checks it is authorized before acting.</span>
                            </li>
                            <li className="flex gap-3">
                                <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand" />
                                <span><strong>Passkey:</strong> On Solana, the passkey is an <strong>on-chain approver</strong> that authorizes adding new devices — it never signs transactions. Use it for device approval across devices.</span>
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
                            ['Self-custodial', 'Cavos never holds a key that can move user funds. The on-chain account is the sole authority over signers.'],
                            ['Native precompile', 'Uses Solana\u2019s native secp256r1 signature verification — no custom cryptographic code.'],
                            ['Gasless transactions', 'The Cavos relayer co-signs as fee payer — users hold no SOL to get started.'],
                            ['Arbitrary programs', 'Beyond SOL transfers: SPL tokens, swaps, staking via executeInstructions (allowlisted programs).'],
                            ['Passkey approval', 'Passkeys authorize adding new devices on-chain. They never sign transactions — device approval only.'],
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
