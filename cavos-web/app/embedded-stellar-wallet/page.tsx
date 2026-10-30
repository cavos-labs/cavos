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
    STELLAR_CONNECT_CODE,
    STELLAR_FAQ,
    STELLAR_FEATURES,
    STELLAR_SOFTWARE,
} from '@/lib/chain-wallet-pages'
import {
    STELLAR_WALLET_DESCRIPTION,
    STELLAR_WALLET_PATH,
    STELLAR_WALLET_TITLE,
    chainWalletPageJsonLd,
    marketingPageMetadata,
} from '@/lib/marketing-seo'

const meta = CHAIN_WALLET_META.stellar

export const metadata: Metadata = marketingPageMetadata({
    title: STELLAR_WALLET_TITLE,
    description: STELLAR_WALLET_DESCRIPTION,
    path: STELLAR_WALLET_PATH,
    type: 'article',
    publishedTime: CHAIN_WALLET_PUBLISHED,
    modifiedTime: CHAIN_WALLET_MODIFIED,
})

export default function EmbeddedStellarWalletPage() {
    const jsonLd = chainWalletPageJsonLd({
        title: meta.title,
        description: meta.description,
        path: meta.path,
        softwareName: STELLAR_SOFTWARE.name,
        softwareDescription: STELLAR_SOFTWARE.description,
        applicationSubCategory: STELLAR_SOFTWARE.subCategory,
        featureList: STELLAR_SOFTWARE.featureList,
        datePublished: CHAIN_WALLET_PUBLISHED,
        dateModified: CHAIN_WALLET_MODIFIED,
        crumbName: meta.crumbName,
        faq: STELLAR_FAQ,
    })

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <script
                id="embedded-stellar-wallet-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <article className="mx-auto max-w-4xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        Embedded Stellar Wallet
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        A device-native, self-custodial{' '}
                        <Link href="/embedded-wallet" className={MARKETING_PROSE_LINK}>
                            embedded wallet
                        </Link>{' '}
                        for Stellar. The signing key is created and used on the user&apos;s
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
                        The{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">G…</code> is
                        HKDF of the same MasterDEK as Solana. In the browser that Ed25519 control
                        key is a non-extractable WebCrypto key held by the Cavos vault. On React
                        Native it uses the OS keystore. The SDK does not enforce
                        non-extractability on Node or other server runtimes.
                    </p>
                </header>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Evaluate a Stellar embedded wallet
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            This page is for teams that need a Stellar embedded wallet inside the
                            product — a classic{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">G…</code>{' '}
                            the rest of the ecosystem already understands, not a Soroban contract
                            account and not a Freighter connect flow. Login selects the user.{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                @cavos/kit
                            </code>{' '}
                            looks up{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                (userId, appId, chain, network)
                            </code>{' '}
                            in the registry and returns that address, or claims a new one. The
                            first device to register wins. Signing is local. Cavos cannot see the
                            key, cannot sign with it, and cannot move funds.
                        </p>
                        <p>
                            Authentication is separate from signing. Hosted login is Google,
                            Apple, or an enclave-verified 9-character email code the recovery
                            enclave mails and verifies. If you already authenticate users, pass a
                            stable{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                userId
                            </code>
                            . Use an immutable primary key, not an email that can change. Email
                            sign-in is not available on React Native yet; use Google or Apple
                            there. The address is available before the account exists on-chain.
                            Share it, fund it, then execute.
                        </p>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        How the Stellar account signs
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            Cavos provisions a <strong>classic G… Stellar account</strong> — not
                            a Soroban contract. It is the same address format that wallets,
                            exchanges, and every Stellar tool already understand. That{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">G…</code>{' '}
                            is one Ed25519 spend key, HKDF of the MasterDEK (
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                cavos-ed25519-stellar-v1
                            </code>
                            , salted by{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                appSalt
                            </code>
                            ). A new device restores the MasterDEK and derives the same key.
                            Changing{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                appSalt
                            </code>{' '}
                            derives a different address that will not match the registry row.
                        </p>
                        <p>
                            Connect never creates the account. An{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                undeployed
                            </code>{' '}
                            wallet already has a{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">G…</code>{' '}
                            from the registry; the first{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                execute
                            </code>{' '}
                            creates the account (sponsored, 0 XLM cost to the user) and runs the
                            operation. After that, status is{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                ready
                            </code>
                            .{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                execute(amount, destination)
                            </code>{' '}
                            moves{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                amount
                            </code>{' '}
                            stroops of native XLM (1 XLM = 10,000,000 stroops).{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                wallet.balance()
                            </code>{' '}
                            returns that native balance.{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                signMessage
                            </code>{' '}
                            works while undeployed. An App ID activates the gasless relayer.
                        </p>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Gas Sponsorship in Any Token
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            Gas Sponsorship in Any Token means the user can pay fees and
                            reserves in any token they hold; USDC is one example. Every Stellar
                            account locks XLM reserves (a base reserve plus about 0.5 XLM per
                            subentry). With the relayer, those reserves and all fees are
                            sponsored, so the user locks no XLM. The relayer is only a fee payer
                            and reserve sponsor — never a custodian or identity authority. A bad
                            or absent relayer can cost fees; it cannot move funds or squat an
                            address. Pass{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                {'{ sponsored: false }'}
                            </code>{' '}
                            to submit directly from the account&apos;s own XLM. Without an App
                            ID, a funded{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                stellarSourceKeypair
                            </code>{' '}
                            can fund reserves and pay fees.
                        </p>
                        <p>
                            Because the control key is a real Stellar signer, the same{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">G…</code>{' '}
                            can invoke Soroban contracts and satisfy{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                require_auth
                            </code>
                            .{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                invokeContract
                            </code>{' '}
                            simulates the call, re-signs only this account&apos;s auth entry, and
                            submits it — sponsored by default.{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                invokeContract
                            </code>{' '}
                            and{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                addTrustline
                            </code>{' '}
                            require{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                status === &quot;ready&quot;
                            </code>
                            ; call{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                execute
                            </code>{' '}
                            first if the account does not exist yet.{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                signXdr
                            </code>{' '}
                            signs an unsigned envelope without submitting it. The kit also ships{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                deployEscrow
                            </code>{' '}
                            and{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                TrustlessWorkEscrow
                            </code>{' '}
                            for milestone escrows. Paying reserves in a held token (USDC, not
                            sponsored XLM) is a separate package,{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                @cavos/reserve
                            </code>
                            , signed with{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                wallet.signXdr
                            </code>
                            .
                        </p>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Recovery on a new device
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            There is one spend key. After login, call{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                enrollPasskeyDefault()
                            </code>
                            . Signing up never prompts. The passkey stores an encrypted copy of
                            the MasterDEK; it is not 2FA. Anyone with that synced passkey can
                            open the wallet. Hardware-isolated recovery, opt-in per environment,
                            unwraps the same DEK when the user signs in again with Google, Apple,
                            or an enclave-verified email code. Restore paths are another
                            signed-in device, a passkey, and that opt-in enclave. If every device
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
                        . The Stellar-only path — social login, the{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            G…
                        </code>{' '}
                        before create, and the first sponsored execute — is in{' '}
                        <Link
                            href="/blog/stellar-embedded-wallet-tutorial"
                            className={MARKETING_PROSE_LINK}
                        >
                            How to add an embedded Stellar wallet
                        </Link>
                        . The method-level surface is the{' '}
                        <Link
                            href="/blog/embedded-wallet-api"
                            className={MARKETING_PROSE_LINK}
                        >
                            embedded wallet API
                        </Link>
                        . Platform parts and pricing models are in{' '}
                        <Link
                            href="/blog/wallet-as-a-service"
                            className={MARKETING_PROSE_LINK}
                        >
                            wallet-as-a-service
                        </Link>
                        .{' '}
                        For a side-by-side of other providers, see the{' '}
                        <Link
                            href="/blog/best-embedded-wallets-stellar"
                            className={MARKETING_PROSE_LINK}
                        >
                            best embedded wallets for Stellar
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
                            chains: [&quot;stellar&quot;]
                        </code>
                        .{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            network: &quot;testnet&quot;
                        </code>{' '}
                        resolves to stellar-testnet.{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            execute
                        </code>{' '}
                        works when status is{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            &quot;undeployed&quot;
                        </code>{' '}
                        or{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            &quot;ready&quot;
                        </code>
                        . Narrow on{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            wallet.chain === &quot;stellar&quot;
                        </code>
                        . In React, call{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            wallet.execute
                        </code>{' '}
                        on the Stellar handle; the context{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            execute
                        </code>{' '}
                        is Starknet-only.
                    </p>
                    <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-[#1a1a1a] p-5 text-sm">
                        <pre className="text-white/90 whitespace-pre-wrap">
                            <code>{STELLAR_CONNECT_CODE}</code>
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
                        What is shared, what is Stellar-only
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            Login, registry lookup, the MasterDEK, passkey and enclave restore,
                            and the kit packages are shared with the{' '}
                            <Link href="/embedded-starknet-wallet" className={MARKETING_PROSE_LINK}>
                                Starknet embedded wallet
                            </Link>{' '}
                            and the{' '}
                            <Link href="/embedded-solana-wallet" className={MARKETING_PROSE_LINK}>
                                Solana embedded wallet
                            </Link>
                            . One{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                Cavos.connect
                            </code>{' '}
                            can configure all three. Each chain still has its own address.
                        </p>
                        <p>
                            Stellar-only: the classic{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">G…</code>,
                            stroop{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                execute
                            </code>
                            , reserve sponsorship,{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                invokeContract
                            </code>
                            , trustlines, and{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                signXdr
                            </code>
                            . If you are
                            still choosing a provider, the{' '}
                            <Link href="/compare" className={MARKETING_PROSE_LINK}>
                                compare
                            </Link>{' '}
                            pages and{' '}
                            <Link href="/privy-alternatives" className={MARKETING_PROSE_LINK}>
                                Privy alternatives
                            </Link>
                            ,{' '}
                            <Link href="/turnkey-alternatives" className={MARKETING_PROSE_LINK}>
                                Turnkey alternatives
                            </Link>
                            ,{' '}
                            <Link href="/dynamic-alternatives" className={MARKETING_PROSE_LINK}>
                                Dynamic alternatives
                            </Link>
                            , and{' '}
                            <Link href="/magic-alternatives" className={MARKETING_PROSE_LINK}>
                                Magic alternatives
                            </Link>{' '}
                            state when another product is the better fit.{' '}
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
                        {STELLAR_FEATURES.map(([title, body]) => (
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
                        {STELLAR_FAQ.map((item) => (
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
                        <h2 className="text-2xl font-medium">Start building on Stellar.</h2>
                        <p className="mt-2 text-sm text-white/60">
                            Follow the quickstart to reach a sponsored transaction.
                        </p>
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
            </article>

            <Footer />
        </main>
    )
}
