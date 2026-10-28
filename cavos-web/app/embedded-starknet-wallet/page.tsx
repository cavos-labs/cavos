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
    STARKNET_CONNECT_CODE,
    STARKNET_FAQ,
    STARKNET_FEATURES,
    STARKNET_SOFTWARE,
} from '@/lib/chain-wallet-pages'
import {
    STARKNET_WALLET_DESCRIPTION,
    STARKNET_WALLET_PATH,
    STARKNET_WALLET_TITLE,
    chainWalletPageJsonLd,
    marketingPageMetadata,
} from '@/lib/marketing-seo'

const meta = CHAIN_WALLET_META.starknet

export const metadata: Metadata = marketingPageMetadata({
    title: STARKNET_WALLET_TITLE,
    description: STARKNET_WALLET_DESCRIPTION,
    path: STARKNET_WALLET_PATH,
    type: 'article',
    publishedTime: CHAIN_WALLET_PUBLISHED,
    modifiedTime: CHAIN_WALLET_MODIFIED,
})

export default function EmbeddedStarknetWalletPage() {
    const jsonLd = chainWalletPageJsonLd({
        title: meta.title,
        description: meta.description,
        path: meta.path,
        softwareName: STARKNET_SOFTWARE.name,
        softwareDescription: STARKNET_SOFTWARE.description,
        applicationSubCategory: STARKNET_SOFTWARE.subCategory,
        featureList: STARKNET_SOFTWARE.featureList,
        datePublished: CHAIN_WALLET_PUBLISHED,
        dateModified: CHAIN_WALLET_MODIFIED,
        crumbName: meta.crumbName,
        faq: STARKNET_FAQ,
    })

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <script
                id="embedded-starknet-wallet-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <article className="mx-auto max-w-4xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        Embedded Starknet Wallet
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        A device-native, self-custodial{' '}
                        <Link href="/embedded-wallet" className={MARKETING_PROSE_LINK}>
                            embedded wallet
                        </Link>{' '}
                        for Starknet. The signing key is created and used on the user&apos;s
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
                        The stark key is derived from a MasterDEK that stays protected at rest by
                        the device&apos;s non-extractable key (WebCrypto in the browser, the OS
                        keystore on React Native). WebCrypto cannot hold a stark key, so outside
                        the Cavos vault it is re-derived into memory for the session. The SDK
                        does not enforce non-extractability on Node or other server runtimes.
                    </p>
                </header>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Evaluate a Starknet embedded wallet
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            This page is for teams shipping on Starknet, not for an EVM-wide
                            wallet layer. If your users should never install a browser extension
                            or handle a seed phrase, an embedded wallet is the product model:
                            login selects the user, the SDK resolves an on-chain account, and
                            approval happens in your UI. Cavos is the device-native version of
                            that model. The signing key is derived on the device from a
                            MasterDEK. Cavos cannot reconstruct it with MPC and cannot spend.
                        </p>
                        <p>
                            Authentication is separate from signing. Hosted login is Google,
                            Apple, or an enclave-verified 9-character email code (
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                sendOtp
                            </code>{' '}
                            /{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                verifyOtp
                            </code>
                            ). If you already have Clerk, Auth0, or your own session, pass a
                            stable{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                userId
                            </code>
                            . Login never authorizes a spend. Use an immutable primary key, not
                            an email that can change: a different{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                userId
                            </code>{' '}
                            is a different registry lookup. Email sign-in is not available on
                            React Native yet; use Google or Apple there.
                        </p>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        How the Starknet account signs
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            Cavos provisions an{' '}
                            <strong>audited OpenZeppelin account contract</strong> —
                            AccountUpgradeable v3.0.0. The audit covers OpenZeppelin&apos;s
                            contract, not Cavos. It is an upgradeable smart contract account
                            controlled by one stark key, the same shape as Argent or Braavos, not
                            a custom Cavos contract. The
                            key is{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                grindKey(HKDF(MasterDEK, appSalt, &quot;cavos-stark-starknet-v1&quot;))
                            </code>
                            . The address is{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                calculateContractAddressFromHash
                            </code>{' '}
                            of that public key and the pinned class hash{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded break-all">
                                0x01d1777db36cdd06dd62cfde77b1b6ae06412af95d57a13dc40ac77b8a702381
                            </code>
                            , declared on mainnet and Sepolia. Changing{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                appSalt
                            </code>{' '}
                            derives a different key and address that will not match the registry
                            row.
                        </p>
                        <p>
                            When you call{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                execute
                            </code>
                            , starknet.js computes the v3 transaction hash, the stark key signs
                            it as a 2-felt{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                [r, s]
                            </code>
                            , and the account&apos;s{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                __validate__
                            </code>{' '}
                            checks that signature against the account&apos;s public key. There is
                            no on-chain device list: a new device restores the MasterDEK off-chain
                            and derives the same key. The kit refuses{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                set_public_key
                            </code>{' '}
                            on the account itself — a rotated key would no longer be controlled
                            by the DEK. Later implementation changes go through{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                wallet.upgrade(newClassHash)
                            </code>
                            , which keeps the address.
                        </p>
                        <p>
                            On the web the key lives inside the Cavos vault, an iframe on a Cavos
                            origin. The vault reads the calls before signing:{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                transfer
                            </code>{' '}
                            on ETH, STRK, and USDC counts against your app&apos;s limits, and
                            calls into the account itself always go to your over-limit rule.
                            Connect never deploys. An{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                undeployed
                            </code>{' '}
                            wallet already has an address in the registry; the first{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                execute
                            </code>{' '}
                            deploys the account and runs the user&apos;s calls in one sponsored
                            transaction. After that, status is{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                ready
                            </code>
                            . An undeployed wallet can also{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                signMessage
                            </code>{' '}
                            (SNIP-12 revision 1 typed data, domain Cavos / 1).
                        </p>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Paymaster sponsorship
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                execute
                            </code>{' '}
                            routes through the Cavos paymaster (SNIP-29, with SRC-9 outside
                            execution). Account deployment and every later execution are
                            sponsored by default, so the user pays no gas and never needs ETH or
                            STRK. After the account is deployed,{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                fee: &apos;self&apos;
                            </code>{' '}
                            pays from the account&apos;s own balance. A self-funded first execute
                            is refused, because an undeployed account has no balance to deploy
                            itself with.
                        </p>
                        <p>
                            Starknet is the only adapter that takes{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                paymasterApiKey
                            </code>
                            . The current web SDK receives that value in browser code, so treat
                            it as a client-visible, app-scoped sponsorship credential — never as
                            an operator or treasury secret. Bind and limit it by app, environment,
                            origin, rate, and spend. Add it only when Starknet is in{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                chains
                            </code>
                            ; a paymaster key on a chain that ignores it is a config error. The
                            backend can transport, sponsor, or submit a transaction. It does not
                            hold the user authority required to move funds.
                        </p>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        Recovery on a new device
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            A Starknet wallet is one key, derived from the MasterDEK. Losing the
                            device loses that wrap unless a second path was set up first. After
                            login, call{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                enrollPasskeyDefault()
                            </code>
                            . Signing up never prompts for a passkey. The passkey stores an
                            encrypted copy of the MasterDEK under its WebAuthn PRF. Cavos stores
                            the ciphertext and cannot open it. Anyone with that synced passkey
                            (iCloud Keychain, Google Password Manager) can open the wallet. It is
                            not 2FA.
                        </p>
                        <p>
                            Hardware-isolated recovery is opt-in per environment, not on by
                            default. When it is enabled, an AWS Nitro enclave seals the MasterDEK
                            and unwraps it on a later sign-in with Google, Apple, or an
                            enclave-verified email code. The enclave does not sign transfers.
                            Email sign-in uses a 9-character code the enclave generates, mails,
                            and verifies; magic links are not part of this path. Recovery codes
                            do not restore Starknet wallets. If every device and every restore
                            factor is gone, Cavos cannot recover the wallet.
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
                        after users exist.                         The React walkthrough lives in{' '}
                        <Link
                            href="/blog/how-to-add-an-embedded-wallet"
                            className={MARKETING_PROSE_LINK}
                        >
                            How to add an embedded wallet
                        </Link>
                        . The Starknet-only path — paymaster-sponsored deploy and
                        execute from an embedded wallet — is in{' '}
                        <Link
                            href="/blog/gasless-starknet-transactions"
                            className={MARKETING_PROSE_LINK}
                        >
                            How to send gasless Starknet transactions
                        </Link>
                        . The method-level surface — auth, connect, execute, gas,
                        recovery — is the{' '}
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
                            chains: [&quot;starknet&quot;]
                        </code>
                        . Connect never deploys the account. You can call{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            execute
                        </code>{' '}
                        when status is{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            &quot;undeployed&quot;
                        </code>{' '}
                        or{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            &quot;ready&quot;
                        </code>
                        . Narrow on{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            wallet.chain
                        </code>{' '}
                        so TypeScript exposes the multicall signature. In React, wrap the tree
                        in{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            CavosProvider
                        </code>{' '}
                        from{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            @cavos/kit/react
                        </code>{' '}
                        and use the context{' '}
                        <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                            execute(calls)
                        </code>{' '}
                        for Starknet.
                    </p>
                    <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-[#1a1a1a] p-5 text-sm">
                        <pre className="text-white/90 whitespace-pre-wrap">
                            <code>{STARKNET_CONNECT_CODE}</code>
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
                        . Email is not available on React Native yet.
                    </p>
                    <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-[#1a1a1a] p-5 text-sm">
                        <pre className="text-white/90 whitespace-pre-wrap">
                            <code>{REACT_PROVIDER_CODE}</code>
                        </pre>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-2xl font-medium tracking-[-0.03em]">
                        What is shared, what is Starknet-only
                    </h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            Login, registry lookup on{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                (userId, appId, chain, network)
                            </code>
                            , the MasterDEK, passkey and enclave restore, and the kit packages
                            are shared with the{' '}
                            <Link href="/embedded-solana-wallet" className={MARKETING_PROSE_LINK}>
                                Solana embedded wallet
                            </Link>{' '}
                            and the{' '}
                            <Link href="/embedded-stellar-wallet" className={MARKETING_PROSE_LINK}>
                                Stellar embedded wallet
                            </Link>
                            . One{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                Cavos.connect
                            </code>{' '}
                            can configure all three chains. Each chain still has its own address
                            and deployment status.
                        </p>
                        <p>
                            Starknet-only: the OpenZeppelin account, the stark curve, multicall{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                execute(calls)
                            </code>
                            , the paymaster and{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                paymasterApiKey
                            </code>
                            , SNIP-12{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                signMessage
                            </code>
                            , and{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                upgrade
                            </code>
                            . Solana uses lamport{' '}
                            <code className="text-xs bg-surface px-1.5 py-0.5 rounded">
                                execute
                            </code>{' '}
                            and a relayer fee payer. Stellar uses stroops and a relayer that
                            sponsors reserves. Cavos is not an EVM-wide wallet layer. If you are
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
                        {STARKNET_FEATURES.map(([title, body]) => (
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
                        {STARKNET_FAQ.map((item) => (
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
                        <h2 className="text-2xl font-medium">Start building on Starknet.</h2>
                        <p className="mt-2 text-sm text-white/60">
                            Follow the quickstart to reach a sponsored transaction.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="https://docs.cavos.xyz/docs/starknet"
                            className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink"
                        >
                            Starknet guide
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
