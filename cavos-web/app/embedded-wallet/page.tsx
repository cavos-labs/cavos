import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
    EMBEDDED_WALLET_DESCRIPTION,
    EMBEDDED_WALLET_FAQ,
    EMBEDDED_WALLET_PATH,
    EMBEDDED_WALLET_PUBLISHED,
    EMBEDDED_WALLET_TITLE,
} from '@/lib/embedded-wallet-guide'
import { guidePageJsonLd, marketingPageMetadata } from '@/lib/marketing-seo'

const linkClass =
    'font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink'

export const metadata: Metadata = marketingPageMetadata({
    title: EMBEDDED_WALLET_TITLE,
    description: EMBEDDED_WALLET_DESCRIPTION,
    path: EMBEDDED_WALLET_PATH,
    type: 'article',
    publishedTime: EMBEDDED_WALLET_PUBLISHED,
})

export default function EmbeddedWalletGuidePage() {
    const jsonLd = guidePageJsonLd({
        title: EMBEDDED_WALLET_TITLE,
        description: EMBEDDED_WALLET_DESCRIPTION,
        path: EMBEDDED_WALLET_PATH,
        datePublished: EMBEDDED_WALLET_PUBLISHED,
        crumbs: [
            { name: 'Home', path: '/' },
            { name: 'What is an embedded wallet', path: EMBEDDED_WALLET_PATH },
        ],
        faq: [...EMBEDDED_WALLET_FAQ],
    })

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <script
                id="embedded-wallet-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <article className="mx-auto max-w-4xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        What is an embedded wallet?
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        An embedded wallet lives inside your application. The user signs in the
                        way they already do, and the product resolves an on-chain account they
                        can pay, receive, and sign with — no browser extension, no seed phrase,
                        no trip to another app. The rest of this guide is about what that label
                        does not decide: who holds the key, who can spend, and which chain
                        account model you are actually shipping.
                    </p>
                </header>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        What an embedded wallet is
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            A wallet, here, is an on-chain account plus the means to authorize
                            transactions from it. For years that meant a browser extension or a
                            dedicated wallet app: the user installs software, writes down twelve
                            words, switches networks, and approves every call in a window the
                            product does not control.
                        </p>
                        <p>
                            An embedded wallet SDK inverts that. The wallet is a component of the
                            product. Authentication selects which user this is. The SDK looks up
                            or creates an on-chain address for that identity. A signer bound to
                            the session or the device authorizes transactions from inside the app
                            UI. Gas is often sponsored so the user does not need a native token
                            to start.
                        </p>
                        <p>
                            Teams adopt this model when the audience is not crypto-native. Games,
                            commerce, and consumer finance cannot ask a first-time user to
                            understand seed phrases. The tradeoff is that the application now
                            owns the wallet experience — including recovery, device changes, and
                            how honest it is about who can sign.
                        </p>
                    </div>
                </section>

                <section className="mt-16">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Embedded wallets vs browser extensions
                    </h2>
                    <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">
                        Browser-extension wallets keep keys in a separate application. The user
                        installs it, controls the seed, and approves transactions in that UI.
                        The dapp requests access; it does not provision the account. That is the
                        right default when users already have wallets, hold assets across many
                        apps, or must connect an existing address. It is a poor default when the
                        user has never used crypto: another download, another permission prompt,
                        and another place the session can break.
                    </p>
                    <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
                        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                            <thead className="bg-brand text-white">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Question</th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">
                                        Browser extension
                                    </th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">
                                        Embedded wallet
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    [
                                        'Who creates the account',
                                        'The user, in another application',
                                        'The product, from a login the user already has',
                                    ],
                                    [
                                        'Where approval happens',
                                        'A wallet popup the app does not control',
                                        'In the product UI',
                                    ],
                                    [
                                        'Portability',
                                        'High — the same wallet across many sites',
                                        'Product-scoped unless you also connect or export',
                                    ],
                                    [
                                        'Typical audience',
                                        'People who already hold crypto wallets',
                                        'People who should never see a wallet picker',
                                    ],
                                ].map(([question, extension, embedded]) => (
                                    <tr key={question} className="border-t border-line">
                                        <th scope="row" className="px-5 py-4 align-top font-semibold">
                                            {question}
                                        </th>
                                        <td className="border-l border-line px-5 py-4 align-top text-muted">
                                            {extension}
                                        </td>
                                        <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                            {embedded}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">
                        Cavos does not connect existing extensions. If connecting MetaMask or
                        WalletConnect is a requirement, a connection-focused provider is the
                        better fit, and the two models can coexist in one product. That split is
                        spelled out on the{' '}
                        <Link href="/compare/dynamic" className={linkClass}>
                            Cavos vs Dynamic
                        </Link>{' '}
                        page.
                    </p>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Embedded vs hosted, MPC, and custodial wallets
                    </h2>
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                        &ldquo;Embedded&rdquo; only says where the wallet appears. It does not
                        say who can move the funds. The same login modal is used for three
                        different custody designs.
                    </p>
                    <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
                        {[
                            [
                                'Hosted or delegated',
                                'The provider, or an HSM it operates, can produce a signature. Email magic-link login often sits on this model: access to the inbox is enough to spend, because the provider holds the signing capability. FinCEN describes hosted wallet providers as account-based money transmitters when they have total independent control over the value.',
                            ],
                            [
                                'MPC',
                                'The private key is split into shares. Signing reconstructs or jointly computes a signature from those shares — typically some mix of the user\u2019s device, the provider\u2019s network, and a recovery factor. MPC is a legitimate design. It is not the same as \u201cthe provider never has a key.\u201d The provider holds a share used in reconstruction. Export is often supported, which is a feature and a different threat model.',
                            ],
                            [
                                'Self-custodial, device-native',
                                'The signing key is created on the user\u2019s device and does not leave it. The provider cannot see it, cannot sign with it, and cannot move funds. New devices are added by an on-chain approval, not by reconstituting a master key on a server.',
                            ],
                        ].map(([title, body]) => (
                            <article key={title} className="bg-white p-7">
                                <h3 className="font-semibold">{title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
                            </article>
                        ))}
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                        Calling a product non-custodial does not make it so. The test is whether
                        the provider can complete a transaction without the user, or holds the
                        means of access. That is the test the{' '}
                        <Link href="/custody" className={linkClass}>
                            custody page
                        </Link>{' '}
                        cites under MiCA, FinCEN, California, and other regimes.
                    </p>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Key-management models
                    </h2>
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                        When a vendor says &ldquo;embedded wallet SDK,&rdquo; ask where the
                        signing key lives. Four designs cover almost every product in the
                        category.
                    </p>

                    <h3 className="mt-10 text-xl font-medium tracking-[-0.02em]">
                        Device-native keys
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                        A non-exportable key is generated in the platform&apos;s secure store:
                        WebCrypto in the browser, the OS keystore on iOS and Android. JavaScript
                        cannot read the private material out. The device signs; the chain
                        account lists that public key as an authorized signer. This is the Cavos
                        default. In the browser the device key is a non-extractable P-256 key.
                        On React Native it uses the OS keystore. Those platform primitives
                        provide the isolation — the SDK does not enforce non-extractability on
                        Node or other server runtimes.
                    </p>

                    <h3 className="mt-10 text-xl font-medium tracking-[-0.02em]">Passkeys</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                        Passkeys (WebAuthn) are often described as &ldquo;the wallet.&rdquo; They
                        are not one thing. On Starknet and Solana in Cavos, the passkey is an
                        on-chain approver that authorizes adding a new device. It never signs
                        transactions; device keys still spend. On Stellar, a WebAuthn PRF
                        credential derives an ed25519 key added as a Horizon signer. That is not
                        2FA: anyone with the synced passkey (iCloud Keychain or Google Password
                        Manager) can spend, which is also how a synced passkey recovers the G…
                        wallet. When a vendor says &ldquo;passkey wallet,&rdquo; ask whether the
                        passkey signs spends, approves devices, or unwraps a key the vendor also
                        holds.
                    </p>

                    <h3 className="mt-10 text-xl font-medium tracking-[-0.02em]">MPC</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                        Shares are distributed so that no single party should reconstruct the
                        key alone. In practice you are trusting the share holders, the
                        reconstruction protocol, and whoever can coerce enough shares.{' '}
                        <Link href="/compare/web3auth" className={linkClass}>
                            Web3Auth
                        </Link>{' '}
                        is the well-known social-login implementation of this pattern. Broad
                        chain coverage and key export are the usual reasons to pick it. The cost
                        is a reconstructable key and a provider share in the signing path. Cavos
                        does not split or reconstruct a signing key with MPC.
                    </p>

                    <h3 className="mt-10 text-xl font-medium tracking-[-0.02em]">Enclaves</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                        A secure enclave (AWS Nitro, or a vendor HSM) holds key material that is
                        supposed to be usable only inside a measured environment.{' '}
                        <Link href="/compare/turnkey" className={linkClass}>
                            Turnkey
                        </Link>{' '}
                        sits here as infrastructure: you build a wallet on top of policy-driven
                        signing in remote hardware. Remote enclaves are not the user&apos;s
                        device. Server-side signing is the point of that design. Cavos uses an
                        enclave only for opt-in hardware-isolated social recovery: an AWS Nitro
                        Enclave with pinned attestation, off by default, which can unwrap a
                        spend key on Solana and Stellar or schedule at most one bounded{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">add_signer</code>{' '}
                        on Starknet. It is not general server-side signing. The docs call that
                        path non-custodial, and not trustless.
                    </p>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Custody and regulatory implications
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            If your company can move a user&apos;s crypto, you are holding it.
                            The EU, US money-transmission rules, California, and the UK from 25
                            October 2027 put a price on that. Argentina writes exclusive
                            self-custody wallet providers out of its registry; Brazil, Costa
                            Rica, Mexico, and the UK never wrote that exception. Figures,
                            statutes, and the control test live on the{' '}
                            <Link href="/custody" className={linkClass}>
                                custody page
                            </Link>
                            . This guide does not repeat them.
                        </p>
                        <p>
                            Two product facts still belong here. Integrating a self-custodial SDK
                            does not mean the rest of the product is unlicensed. Exchange, fiat
                            on-ramps, and sending crypto for a customer are classified on their
                            own. Recovery paths count: a provider that cannot sign in the ordinary
                            flow but can restore a spend key in an incident is a different fact
                            pattern than one that never can. Counsel has to read the recovery
                            path, not only the happy path.
                        </p>
                    </div>
                </section>

                <section className="mt-16">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Chain considerations
                    </h2>
                    <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">
                        &ldquo;One embedded wallet, every chain&rdquo; usually means an
                        EOA-style key reused across networks, or an account-abstraction layer on
                        EVM. Chains that are not EVM do not share that account model. If you are
                        building on Starknet, Solana, or Stellar, the adapter has to be native
                        — address derivation, signatures, execution, and fees stay explicit per
                        chain.
                    </p>
                    <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
                        <article className="bg-white p-7">
                            <h3 className="text-lg font-semibold">Starknet</h3>
                            <p className="mt-3 text-sm leading-relaxed text-muted">
                                Accounts are smart contracts. Cavos provisions a Cairo
                                DeviceAccount with on-chain secp256r1 (P-256) verification.
                                Execution routes through a paymaster (SNIP-9{' '}
                                <code className="text-xs bg-surface px-1 py-0.5 rounded">
                                    execute_from_outside
                                </code>
                                ) so users pay no gas. The account is derived on connect and
                                deployed lazily on first execute.
                            </p>
                            <p className="mt-4">
                                <Link href="/embedded-starknet-wallet" className={linkClass}>
                                    Embedded Starknet wallet
                                </Link>
                            </p>
                        </article>
                        <article className="bg-white p-7">
                            <h3 className="text-lg font-semibold">Solana</h3>
                            <p className="mt-3 text-sm leading-relaxed text-muted">
                                Cavos provisions a device-account PDA controlled by a P-256
                                device key. Guarded actions pair Solana&apos;s native secp256r1
                                precompile with the device-account program. A relayer co-signs as
                                fee payer so users hold no SOL to start. Arbitrary program calls
                                (SPL, swaps) go through allowlisted programs.
                            </p>
                            <p className="mt-4">
                                <Link href="/embedded-solana-wallet" className={linkClass}>
                                    Embedded Solana wallet
                                </Link>
                            </p>
                        </article>
                        <article className="bg-white p-7">
                            <h3 className="text-lg font-semibold">Stellar</h3>
                            <p className="mt-3 text-sm leading-relaxed text-muted">
                                Cavos provisions a classic G… account — not a Soroban contract —
                                so exchanges and existing tools already understand the address.
                                Each device&apos;s ed25519 public key is a weight-1 Horizon
                                signer. Extra devices, a passkey, and a recovery code are
                                additional signers, not wraps of a shared seed. The relayer
                                sponsors reserves and fee bumps.
                            </p>
                            <p className="mt-4">
                                <Link href="/embedded-stellar-wallet" className={linkClass}>
                                    Embedded Stellar wallet
                                </Link>
                            </p>
                        </article>
                    </div>
                    <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">
                        A typed wallet object from one SDK is not the same as pretending every
                        chain is Ethereum. Cavos currently ships those three adapters. It is not
                        an EVM-wide wallet layer; if your product is EVM-first,{' '}
                        <Link href="/compare/privy" className={linkClass}>
                            Privy
                        </Link>{' '}
                        covers ground Cavos does not.
                    </p>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        How to choose a provider
                    </h2>
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                        Ask the custody question first, then the chain question, then the
                        product-shape question.
                    </p>
                    <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
                        <li>Who can produce a valid signature without the user present?</li>
                        <li>
                            Where does the signing key live — device, MPC shares, HSM, or
                            enclave?
                        </li>
                        <li>
                            Which chains are native, and which are a compatibility layer?
                        </li>
                        <li>How does a second device get authorized?</li>
                        <li>What does recovery actually do, and is it on by default?</li>
                        <li>
                            Do you need to connect existing wallets, or provision new ones?
                        </li>
                    </ol>
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                        Worked comparisons — including when the other product is the better
                        choice — are on the{' '}
                        <Link href="/compare" className={linkClass}>
                            compare pages
                        </Link>
                        :{' '}
                        <Link href="/compare/privy" className={linkClass}>
                            Privy
                        </Link>
                        ,{' '}
                        <Link href="/compare/dynamic" className={linkClass}>
                            Dynamic
                        </Link>
                        ,{' '}
                        <Link href="/compare/turnkey" className={linkClass}>
                            Turnkey
                        </Link>
                        ,{' '}
                        <Link href="/compare/web3auth" className={linkClass}>
                            Web3Auth
                        </Link>
                        , and{' '}
                        <Link href="/compare/magic" className={linkClass}>
                            Magic
                        </Link>
                        .
                    </p>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Where Cavos fits
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            Cavos is device-native embedded wallet infrastructure. Applications
                            resolve a self-custodial account from a stable user identity. Signing
                            keys are created and used on the user&apos;s device — Cavos cannot
                            see them, sign with them, or move funds. Adapters ship today for
                            Starknet, Solana, and Stellar, via{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                @cavos/kit
                            </code>{' '}
                            on web and{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                @cavos/kit/react-native
                            </code>{' '}
                            on mobile (Expo Development Builds, EAS, or bare React Native — Expo
                            Go is not supported).
                        </p>
                        <p>
                            Cavos is not an EVM-wide wallet layer, not a WalletConnect
                            aggregator, and not a drop-in replacement for Privy. It is the better
                            fit when you need those three chains&apos; native account models and
                            a signing architecture with no provider-held reconstructable key. It
                            is the worse fit when you need broad EVM coverage, external wallet
                            connection, or server-side signing as a product feature. The backend
                            is built so it cannot spend user funds or add itself as a signer.
                            Registries, recovery, paymasters, and relayers can coordinate a
                            transaction; they cannot authorize one.
                        </p>
                        <p>
                            The free tier covers the first 1,000 wallet creates.{' '}
                            <Link href="/pricing" className={linkClass}>
                                Pricing
                            </Link>{' '}
                            and the Complete plan&apos;s enclave recovery are documented there.
                            The security write-up is in the{' '}
                            <a
                                href="https://docs.cavos.xyz/docs/concepts"
                                className={linkClass}
                            >
                                concepts
                            </a>{' '}
                            and{' '}
                            <a
                                href="https://docs.cavos.xyz/docs/hardware-isolated-recovery"
                                className={linkClass}
                            >
                                hardware-isolated recovery
                            </a>{' '}
                            docs.
                        </p>
                    </div>
                </section>

                <section className="mt-16" id="faq">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Frequently asked
                    </h2>
                    <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
                        {EMBEDDED_WALLET_FAQ.map((item) => (
                            <article key={item.question}>
                                <h3 className="font-semibold">{item.question}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted">
                                    {item.answer}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand px-8 py-10 text-white md:flex-row md:items-center">
                    <div>
                        <h2 className="text-2xl font-medium">
                            Pick a chain, then the signing model.
                        </h2>
                        <p className="mt-2 max-w-xl text-sm text-white/70">
                            Start with the quickstart, or compare Cavos with the provider you
                            already have on a shortlist.
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
                            href="/compare"
                            className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                        >
                            Compare providers
                        </Link>
                    </div>
                </section>
            </article>

            <Footer />
        </main>
    )
}
