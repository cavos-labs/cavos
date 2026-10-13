import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
    CHAIN_WALLET_META,
    CHAIN_WALLET_MODIFIED,
    CHAIN_WALLET_PUBLISHED,
    MARKETING_PROSE_LINK,
    REACT_PROVIDER_CODE,
    SOLANA_CONNECT_CODE,
    SOLANA_FAQ,
    SOLANA_FEATURES,
    SOLANA_SOFTWARE,
} from '@/lib/chain-wallet-pages'
import {
    SOLANA_WALLET_DESCRIPTION,
    SOLANA_WALLET_PATH,
    SOLANA_WALLET_TITLE,
    chainWalletPageJsonLd,
    marketingPageMetadata,
} from '@/lib/marketing-seo'

const meta = CHAIN_WALLET_META.solana

export const metadata: Metadata = marketingPageMetadata({
    title: SOLANA_WALLET_TITLE,
    description: SOLANA_WALLET_DESCRIPTION,
    path: SOLANA_WALLET_PATH,
    type: 'article',
    publishedTime: CHAIN_WALLET_PUBLISHED,
    modifiedTime: CHAIN_WALLET_MODIFIED,
})

export default function EmbeddedSolanaWalletPage() {
    const jsonLd = chainWalletPageJsonLd({
        title: meta.title,
        description: meta.description,
        path: meta.path,
        softwareName: SOLANA_SOFTWARE.name,
        softwareDescription: SOLANA_SOFTWARE.description,
        applicationSubCategory: SOLANA_SOFTWARE.subCategory,
        featureList: SOLANA_SOFTWARE.featureList,
        datePublished: CHAIN_WALLET_PUBLISHED,
        dateModified: CHAIN_WALLET_MODIFIED,
        crumbName: meta.crumbName,
        faq: SOLANA_FAQ,
    })

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <script
                id="embedded-solana-wallet-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <article className="mx-auto max-w-4xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        Embedded Solana Wallet
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        A device-native, self-custodial{' '}
                        <Link href="/embedded-wallet" className={MARKETING_PROSE_LINK}>
                            embedded wallet
                        </Link>{' '}
                        for Solana. The signing key is created and used on the user&apos;s
                        device — Cavos cannot see it, cannot sign with it, and cannot move funds.
                        Available via{' '}
                        <code className="text-sm bg-surface px-1.5 py-0.5 rounded">@cavos/kit</code>{' '}
                        for web and{' '}
                        <code className="text-sm bg-surface px-1.5 py-0.5 rounded">
                            @cavos/kit/react-native
                        </code>{' '}
                        for mobile (Expo Development Builds, EAS, or bare React Native — Expo Go
                        is not supported).
                    </p>
                    <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
                        The spend key is derived from a MasterDEK that stays protected at rest by
                        the device&apos;s non-extractable key (WebCrypto in the browser, the OS
                        keystore on React Native). The SDK does not enforce non-extractability on
                        Node or other server runtimes. Pass your own RPC on mainnet; without{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">rpcUrl</code>{' '}
                        the kit falls back to public{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            api.mainnet-beta.solana.com
                        </code>
                        , which is rate-limited.
                    </p>
                </header>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Evaluate a Solana embedded wallet
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            This page is for teams that need a Solana embedded wallet SDK — a
                            native system account inside the product, not a Phantom connect
                            button and not a PDA wrapper. If your users should never install a
                            wallet app or handle a seed phrase, login selects the user,{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                @cavos/kit
                            </code>{' '}
                            resolves an Ed25519 address, and the device signs. Cavos cannot see
                            that key, cannot sign with it, and cannot move funds.
                        </p>
                        <p>
                            Authentication is separate from signing. Hosted login is Google,
                            Apple, or an enclave-verified 9-character email code. If you already
                            authenticate users, pass a stable{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                userId
                            </code>
                            ; Cavos login then turns off. Use an immutable primary key, not an
                            email that can change. Email sign-in is not available on React Native
                            yet. For production RPC, pass Helius, Triton, or QuickNode; the
                            public mainnet endpoint is rate-limited.
                        </p>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        How the Solana account signs
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            Cavos provisions a <strong>native Ed25519 system account</strong> —
                            an ordinary Solana address, the same shape as Phantom, not a PDA and
                            not a P-256 program account. There is no on-chain Cavos program. The
                            spend key is HKDF of the MasterDEK ({' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                cavos-ed25519-solana-v1
                            </code>
                            , salted by{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                appSalt
                            </code>
                            ). The same DEK derives the Stellar{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">G…</code>{' '}
                            and the Starknet stark key in a multi-chain session. Changing{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                appSalt
                            </code>{' '}
                            derives a different address that will not match the registry row.
                        </p>
                        <p>
                            The user&apos;s Ed25519 key signs the Solana transaction message.
                            Solana verifies that signature natively. A relayer can be named fee
                            payer, but a co-signer cannot alter the instructions it signs. On the
                            web the local wrap of the DEK and the spend key live in the IndexedDB
                            of the Cavos vault, filed under your app. The first device mints a
                            random MasterDEK, claims{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                (userId, appId, chain, network)
                            </code>{' '}
                            in the registry, and wins. A later device must unwrap that same DEK.
                        </p>
                        <p>
                            Native Solana does not use{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                undeployed
                            </code>{' '}
                            the way Starknet does. There is nothing to deploy: a system account
                            appears when it first receives lamports. After connect, this device is{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                ready
                            </code>{' '}
                            once it holds the spend key. Connect does not airdrop SOL and there
                            is no{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                initialize
                            </code>{' '}
                            instruction.{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                execute(amount, destination)
                            </code>{' '}
                            moves{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                amount
                            </code>{' '}
                            lamports (1 SOL = 1,000,000,000 lamports).{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                executeInstructions
                            </code>{' '}
                            submits the user&apos;s signed transaction so the account can own
                            ATAs and call allowlisted programs. An App ID activates the relayer.
                        </p>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Who pays the fee
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                fee
                            </code>{' '}
                            answers one question: who pays, and in what.{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                &apos;self&apos;
                            </code>{' '}
                            is the default on Solana — the account pays SOL — because a system
                            account is signer and fee payer at once. A fresh Starknet or Stellar
                            account cannot deploy itself or meet the base reserve without help;
                            that is why those adapters sponsor by default.{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                fee: &apos;sponsored&apos;
                            </code>{' '}
                            names the Cavos relayer as fee payer when an App ID (or a{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                relayer
                            </code>
                            ) is set.{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                fee: {'{ token }'}
                            </code>{' '}
                            settles the fee in a token the account already holds, in the same
                            transaction. No route puts SOL in the account; sponsorship covers the
                            fee, never the balance.
                        </p>
                        <p>
                            The relayer only co-signs instructions whose program ids are in the
                            app&apos;s Solana program allowlist (dashboard → Solana Programs),
                            plus System, SPL Token, Token-2022, and Associated Token. A 1,000,000
                            CU cap also applies.{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                sponsored: true
                            </code>{' '}
                            still works as a deprecated alias for{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                fee: &apos;sponsored&apos;
                            </code>
                            ;{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">fee</code>{' '}
                            wins if both are passed. The backend can transport, sponsor, or
                            submit a transaction. It does not hold the user authority required to
                            move funds.
                        </p>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Recovery on a new device
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            A Solana wallet has one spend key. A new device restores the
                            MasterDEK; it does not add a second signer. After login, call{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                enrollPasskeyDefault()
                            </code>
                            . Signing up never prompts. The passkey stores an encrypted copy of
                            the MasterDEK under its WebAuthn PRF. Anyone with that synced passkey
                            can open the wallet. It is not 2FA. A reconnect that already has the
                            local wrap reseals the enclave so a phone can recover even if the
                            first enroll failed.
                        </p>
                        <p>
                            Hardware-isolated recovery is opt-in per environment. When it is
                            enabled, sign in again with Google, Apple, or an enclave-verified
                            email code and the Nitro enclave unwraps the MasterDEK onto this
                            device. Email uses a 9-character code; it is not available on React
                            Native yet. Recovery codes are not used on Solana. If every device
                            and every restore factor is gone, Cavos cannot recover the wallet.
                        </p>
                    </div>
                </section>

                <section className="mt-16">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">Install</h2>
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
                        Create an app in the Cavos dashboard and copy its App ID. Register
                        callback URLs exactly. Never change{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            appSalt
                        </code>{' '}
                        after users exist. The React walkthrough lives in{' '}
                        <Link
                            href="/blog/how-to-add-an-embedded-wallet"
                            className={MARKETING_PROSE_LINK}
                        >
                            How to add an embedded wallet
                        </Link>
                        .
                    </p>
                    <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-[#1a1a1a] p-5 text-sm">
                        <pre className="text-white/90">
                            <code>npm install @cavos/kit</code>
                        </pre>
                    </div>
                </section>

                <section className="mt-16">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Connect and execute
                    </h2>
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
                        Use{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            Cavos.connect
                        </code>{' '}
                        with{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            chains: [&quot;solana&quot;]
                        </code>
                        .{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            network: &quot;testnet&quot;
                        </code>{' '}
                        resolves to solana-devnet;{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            &quot;mainnet&quot;
                        </code>{' '}
                        resolves to solana-mainnet. Narrow on{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            wallet.chain === &quot;solana&quot;
                        </code>{' '}
                        before chain-native calls. In React, wrap the tree in{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            CavosProvider
                        </code>{' '}
                        and call{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            wallet.execute
                        </code>{' '}
                        on the Solana handle rather than the context{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            execute
                        </code>
                        , which is Starknet-only.
                    </p>
                    <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-[#1a1a1a] p-5 text-sm">
                        <pre className="text-white/90 whitespace-pre-wrap">
                            <code>{SOLANA_CONNECT_CODE}</code>
                        </pre>
                    </div>
                    <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">
                        For UI apps, the same package exports the provider. Pass{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            identity
                        </code>{' '}
                        if you already authenticate users; Cavos login then turns off. Hosted
                        login is Google, Apple, or{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            sendOtp
                        </code>{' '}
                        /{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            verifyOtp
                        </code>
                        .
                    </p>
                    <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-[#1a1a1a] p-5 text-sm">
                        <pre className="text-white/90 whitespace-pre-wrap">
                            <code>{REACT_PROVIDER_CODE}</code>
                        </pre>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        What is shared, what is Solana-only
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            Login, registry lookup, the MasterDEK, passkey and enclave restore,
                            and the kit packages are shared with the{' '}
                            <Link href="/embedded-starknet-wallet" className={MARKETING_PROSE_LINK}>
                                Starknet embedded wallet
                            </Link>{' '}
                            and the{' '}
                            <Link href="/embedded-stellar-wallet" className={MARKETING_PROSE_LINK}>
                                Stellar embedded wallet
                            </Link>
                            . One{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                Cavos.connect
                            </code>{' '}
                            can configure all three. Each chain still has its own address.
                        </p>
                        <p>
                            Solana-only: the Ed25519 system account, lamport{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                execute
                            </code>
                            ,{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                executeInstructions
                            </code>
                            , three fee routes, the program allowlist, and the CU cap. There is
                            no paymaster key. If you are still choosing a provider, the{' '}
                            <Link href="/compare" className={MARKETING_PROSE_LINK}>
                                compare
                            </Link>{' '}
                            pages state when another product is the better fit.{' '}
                            <Link href="/pricing" className={MARKETING_PROSE_LINK}>
                                Pricing
                            </Link>{' '}
                            publishes the free 1,000 wallet creates and paid recovery options.
                        </p>
                    </div>
                </section>

                <section className="mt-16">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">What you get</h2>
                    <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
                        {SOLANA_FEATURES.map(([title, body]) => (
                            <article key={title} className="bg-white p-7">
                                <h3 className="font-semibold">{title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-16" id="faq">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Frequently asked
                    </h2>
                    <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
                        {SOLANA_FAQ.map((item) => (
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
                        <h2 className="text-2xl font-medium">Start building on Solana.</h2>
                        <p className="mt-2 text-sm text-white/60">
                            Follow the quickstart to reach a sponsored transaction.
                        </p>
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
            </article>

            <Footer />
        </main>
    )
}
