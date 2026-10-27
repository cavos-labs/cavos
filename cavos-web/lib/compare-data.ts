export type CompareRow = {
    feature: string
    cavos: string
    them: string
}

export type Competitor = {
    slug: string
    name: string
    /** Optional longer label for the embedded-wallet comparison table. */
    tableName?: string
    /** Optional compare-page document title (without the layout `| Cavos` suffix). */
    pageTitle?: string
    pageH1?: string
    pageDescription?: string
    /** Short neutral description of what the other product is. */
    summary: string
    /** How Cavos frames the honest, architectural difference. */
    positioning: string
    /** When the other product is genuinely the better pick. */
    chooseThem: string[]
    /** When Cavos is the better pick. */
    chooseCavos: string[]
    rows: CompareRow[]
    faq: { question: string; answer: string }[]
}

const CAVOS_CUSTODY =
    'Self-custodial. A non-exportable device key is the signing authority; Cavos holds no key that can move user funds and uses no MPC shares.'
const CAVOS_CHAINS =
    'One SDK with chain-native adapters. Starknet, Solana, and Stellar available today.'
const CAVOS_ACCOUNT_MODEL =
    'Audited OpenZeppelin account contract (AccountUpgradeable v3.0.0) on Starknet, native Ed25519 system account on Solana, classic G-account on Stellar.'
const CAVOS_GAS =
    'Gas Sponsorship in Any Token. Chain-specific: Starknet paymaster, Solana relayer as fee payer, Stellar sponsored reserves and fee bumps.'
const CAVOS_RECOVERY =
    'Passkey restore on a new device and opt-in hardware-isolated social recovery, both non-custodial.'
const CAVOS_PRICING =
    'Free up to 1,000 wallets. Essential $59/mo. Complete $139/mo.'

/**
 * Public vendor pricing as of October 2026. Cavos fees are from this site
 * (`/pricing`). Other figures are from each vendor's public pricing page:
 * privy.io/pricing, dynamic.xyz/pricing, turnkey.com/pricing,
 * metamask.io/developer/embedded-wallets, magic.link/pricing.
 * Alchemy compute-unit and Gas Manager fees:
 * https://www.alchemy.com/docs/reference/pricing-plans
 */
const PRIVY_PRICING =
    'Free (0–499 MAU) with 50K signatures and $1M volume/mo. Core $299/mo. Scale $499/mo.'
const DYNAMIC_PRICING =
    '$249/mo for up to 5,000 MAUs. Then $0.05 per extra MAU. Sandbox is free.'
const TURNKEY_PRICING =
    'Pay as you go: 1,000 wallets and 25 free signatures/mo, then $0.10/signature. Pro $99/mo.'
const WEB3AUTH_PRICING =
    'Free 1,000 monthly active wallets. Growth $69/mo. Scale $399/mo.'
const MAGIC_PRICING =
    'Free 1,000 monthly active wallets and 50K signatures. $99/mo includes 2,500 MAWs.'
// https://www.alchemy.com/docs/reference/pricing-plans — Free 30M CU/mo; PAYG $0.525/M CU; Gas Manager 8% admin fee on PAYG.
const ALCHEMY_PRICING =
    'Free 30M compute units/mo. PAYG $0.525 per million CUs. Gas Manager: 8% admin fee on PAYG; free on testnets.'

export const PROVIDER_PRICING_AS_OF = 'October 2026'

export const EMBEDDED_WALLET_MARKET_NOTE =
    'The category has consolidated. Stripe acquired Privy in 2025. Fireblocks acquired Dynamic in 2025. Consensys acquired Web3Auth in 2025 and now ships it as MetaMask Embedded Wallets. In 2026 Payward, the parent of Kraken, acquired Magic Labs wallet infrastructure.'

export const COMPETITORS: Competitor[] = [
    {
        slug: 'privy',
        name: 'Privy',
        pageTitle: 'Cavos vs Privy (2026): Pricing, Chains, Custody',
        pageH1: 'Cavos vs Privy: a Privy wallet alternative',
        pageDescription:
            'Cavos vs Privy as a crypto embedded wallet, not the Shopify popup. Pricing, chains, custody. Free up to 1,000 wallets on Starknet, Solana, and Stellar.',
        summary:
            'Privy is a widely adopted embedded wallet and authentication provider focused primarily on EVM chains, offering both embedded wallets and external wallet connection.',
        positioning:
            'Both products embed a wallet into your application and remove the extension requirement. The architectural difference is where signing authority lives and which chains are treated as native. Privy is the more mature choice across the EVM ecosystem; Cavos is built around a non-exportable device key and ships native adapters for Starknet, Solana, and Stellar.',
        chooseThem: [
            'Your product is EVM-first and you need broad, battle-tested EVM coverage today.',
            'You want a single vendor for both embedded wallets and external wallet connection (WalletConnect, injected wallets).',
            'You need the largest available ecosystem of integrations and reference implementations.',
        ],
        chooseCavos: [
            'You are building on Starknet, Solana, or Stellar and want each chain’s native account model rather than an abstraction over it.',
            'Your security or compliance review requires that no provider-side key material can reconstruct a signing key.',
            'You want device-derived authority with passkey-based restore as an explicit, documented model.',
        ],
        rows: [
            { feature: 'Signing authority', cavos: CAVOS_CUSTODY, them: 'Embedded wallet keys are managed through Privy’s key management infrastructure, with configurable self-custody and recovery options.' },
            { feature: 'Chain coverage', cavos: CAVOS_CHAINS, them: 'Broad EVM support plus Solana; coverage and feature parity vary by chain.' },
            { feature: 'Account model', cavos: CAVOS_ACCOUNT_MODEL, them: 'EOA-style embedded wallets, with smart account support through integrations.' },
            { feature: 'Gas sponsorship', cavos: CAVOS_GAS, them: 'Available through paymaster and bundler integrations, typically on EVM smart accounts.' },
            { feature: 'Recovery', cavos: CAVOS_RECOVERY, them: 'Provider-defined recovery options including password and cloud-backup based flows.' },
            { feature: 'Maturity', cavos: 'Newer product; three adapters shipped and documented.', them: 'Established provider with large production adoption.' },
            { feature: 'Pricing', cavos: CAVOS_PRICING, them: PRIVY_PRICING },
        ],
        faq: [
            { question: 'Is Cavos a drop-in replacement for Privy?', answer: 'No. They target different chain ecosystems. If your application is EVM-first, Privy covers ground Cavos does not. Cavos is a direct alternative when you are building on Starknet, Solana, or Stellar and want a device-native, MPC-free signing model.' },
            { question: 'Does Cavos use MPC like some embedded wallet providers?', answer: 'No. Cavos does not split or reconstruct a signing key across servers. Authority is a non-exportable device key. Cavos holds no key that can move user funds and uses no MPC shares.' },
            { question: 'Can I migrate from Privy to Cavos?', answer: 'Wallet addresses are derived differently, so accounts do not transfer automatically. Migration means provisioning new Cavos wallets against your existing stable user IDs and moving assets deliberately. Treat it as a migration project, not a config change.' },
            { question: 'How does Cavos pricing compare to Privy?', answer: 'Cavos is free up to 1,000 wallets, then Essential at $59/mo and Complete at $139/mo. Privy’s public free tier is 0–499 MAU with 50K signatures and $1M volume per month; Core is $299/mo and Scale is $499/mo.' },
        ],
    },
    {
        slug: 'dynamic',
        name: 'Dynamic',
        pageTitle: 'Cavos vs Dynamic (2026): Pricing, Chains, Custody',
        pageDescription:
            'Cavos vs Dynamic on pricing, chains, and custody. Free up to 1,000 wallets. Device-native accounts vs wallet connection across many wallets.',
        summary:
            'Dynamic provides wallet connection, embedded wallets, and authentication tooling with a strong emphasis on multi-wallet login experiences and developer-facing configuration.',
        positioning:
            'Dynamic is strongest as a unified login and wallet-connection layer covering many wallets and chains. Cavos is narrower and more opinionated: one device-native, self-custodial account model implemented natively per chain, currently Starknet, Solana, and Stellar.',
        chooseThem: [
            'You need to support many external wallets alongside embedded ones in a single login flow.',
            'Your users are existing crypto users who already hold wallets you must connect to.',
            'You want extensive dashboard-level configuration of the authentication experience.',
        ],
        chooseCavos: [
            'Your users are not crypto-native and should never see a wallet selection screen at all.',
            'You need Starknet, Solana, or Stellar accounts with the chain’s native execution model exposed and typed.',
            'You require that signing authority is bound to the user’s device and cannot be reconstructed server-side.',
        ],
        rows: [
            { feature: 'Primary focus', cavos: 'Embedded, device-native self-custodial accounts.', them: 'Wallet connection and authentication across many wallets, plus embedded wallets.' },
            { feature: 'Signing authority', cavos: CAVOS_CUSTODY, them: 'Embedded wallet keys managed by the provider’s key infrastructure with configurable custody models.' },
            { feature: 'Chain coverage', cavos: CAVOS_CHAINS, them: 'Multi-chain, with EVM breadth and additional non-EVM support; parity varies by chain.' },
            { feature: 'External wallet connection', cavos: 'Not a goal; Cavos provisions the wallet rather than connecting to existing ones.', them: 'Core capability with broad wallet coverage.' },
            { feature: 'Gas sponsorship', cavos: CAVOS_GAS, them: 'Supported through account abstraction and paymaster integrations, mainly on EVM.' },
            { feature: 'Recovery', cavos: CAVOS_RECOVERY, them: 'Provider-defined recovery and export options.' },
            { feature: 'Pricing', cavos: CAVOS_PRICING, them: DYNAMIC_PRICING },
        ],
        faq: [
            { question: 'Does Cavos support connecting existing wallets like MetaMask?', answer: 'No. Cavos provisions and controls an embedded, device-native account for each user. If connecting existing external wallets is a requirement, a connection-focused provider such as Dynamic is the better fit, and the two models can coexist in one product.' },
            { question: 'Which is better for non-crypto users?', answer: 'Cavos is designed so a user never selects a wallet: they sign in with an identity you already own and a self-custodial account is resolved (the first device to claim names the address). Dynamic can also hide this, but its surface area is broader because it also serves crypto-native connection flows.' },
            { question: 'How does Cavos pricing compare to Dynamic?', answer: 'Cavos is free up to 1,000 wallets, then Essential at $59/mo and Complete at $139/mo. Dynamic lists $249/mo for up to 5,000 MAUs, then $0.05 per extra MAU, with a free sandbox.' },
            { question: 'Which chains does each support?', answer: 'Cavos ships one SDK with chain-native adapters for Starknet, Solana, and Stellar. Dynamic is multi-chain, with EVM breadth and additional non-EVM support; parity varies by chain.' },
        ],
    },
    {
        slug: 'turnkey',
        name: 'Turnkey',
        pageTitle: 'Cavos vs Turnkey (2026): Pricing, Chains, Custody',
        pageDescription:
            'Cavos vs Turnkey on pricing, chains, and custody. Free up to 1,000 wallets. Finished embedded wallet vs enclave key-management infrastructure.',
        summary:
            'Turnkey provides secure key management infrastructure running in hardware-backed secure enclaves, exposed as a low-level API for building wallets and signing systems.',
        positioning:
            'Turnkey and Cavos both take hardware-backed security seriously, but they sit at different layers. Turnkey is key-management infrastructure you build a wallet product on top of. Cavos is a finished embedded wallet product where the user’s own device — not a remote enclave — is the default signing authority.',
        chooseThem: [
            'You are building your own wallet or custody product and want raw, policy-driven signing primitives.',
            'You need server-side signing for automated or backend-initiated transactions at scale.',
            'You want fine-grained organizational policy, quorums, and approval workflows over keys.',
        ],
        chooseCavos: [
            'You want a working embedded wallet with login, recovery, and sponsorship rather than building one.',
            'You want the signing key on the user’s device rather than in a remote enclave you delegate to.',
            'You are targeting Starknet, Solana, or Stellar and want native adapters out of the box.',
        ],
        rows: [
            { feature: 'Layer', cavos: 'Complete embedded wallet SDK: auth, wallet, recovery, sponsorship.', them: 'Key management infrastructure and signing API; you build the wallet experience.' },
            { feature: 'Where keys live', cavos: 'On the end user’s device, non-exportable.', them: 'In hardware-backed secure enclaves operated as infrastructure.' },
            { feature: 'Time to integrate', cavos: 'Quickstart to sponsored transaction with one SDK.', them: 'Longer: you assemble the product layer yourself.' },
            { feature: 'Server-side signing', cavos: 'Not a general capability; the account key is derived on the user’s device and Cavos holds no key that can spend.', them: 'A core capability with policy controls.' },
            { feature: 'Chain coverage', cavos: CAVOS_CHAINS, them: 'Broad cryptographic curve and chain support at the signing primitive level.' },
            { feature: 'Recovery', cavos: CAVOS_RECOVERY, them: 'You design recovery on top of the provided primitives.' },
            { feature: 'Pricing', cavos: CAVOS_PRICING, them: TURNKEY_PRICING },
        ],
        faq: [
            { question: 'Is Turnkey a competitor or a building block?', answer: 'Mostly a building block. Teams frequently use Turnkey to build something similar to what Cavos ships as a product. The decision is usually build-versus-buy rather than a feature comparison.' },
            { question: 'Does Cavos ever use enclaves?', answer: 'Only for opt-in hardware-isolated social recovery, which runs in an AWS Nitro Enclave with pinned attestation measurements and unwraps a MasterDEK onto a new device. It is off by default and is not a general server-side signing capability. On Starknet the account is the standard OpenZeppelin AccountUpgradeable; the enclave has no on-chain recovery role.' },
            { question: 'How does Cavos pricing compare to Turnkey?', answer: 'Cavos is free up to 1,000 wallets, then Essential at $59/mo and Complete at $139/mo. Turnkey’s public pay as you go tier includes 1,000 wallets and 25 free signatures per month, then $0.10 per signature; Pro is $99/mo.' },
            { question: 'Where do the keys live?', answer: 'On Cavos, keys live on the end user’s device and are non-exportable. On Turnkey, keys live in hardware-backed secure enclaves operated as infrastructure.' },
        ],
    },
    {
        slug: 'web3auth',
        name: 'Web3Auth',
        tableName: 'Web3Auth / MetaMask Embedded Wallets',
        pageTitle: 'Cavos vs Web3Auth (2026): Pricing, Chains, Custody',
        pageDescription:
            'Cavos vs Web3Auth on pricing, chains, and custody. Free up to 1,000 wallets. Device-native keys vs MPC shares that reconstruct a private key.',
        summary:
            'Web3Auth provides social-login wallets using multi-party computation, splitting key shares across the user’s device, the provider’s network, and recovery factors.',
        positioning:
            'This is the clearest architectural contrast in the category. Web3Auth reconstructs a private key from distributed shares; Cavos never reconstructs a key at all, because the device derives the account key and signs directly.',
        chooseThem: [
            'You need very broad chain coverage from a single social-login wallet layer.',
            'You want a key you can export and use in other tooling.',
            'Your users expect a familiar social-login wallet with a long track record.',
        ],
        chooseCavos: [
            'Your threat model rules out any architecture where a provider holds a reconstructable key share.',
            'You want the account key derived on the user’s device rather than assembled from off-chain shares.',
            'You are targeting Starknet, Solana, or Stellar specifically.',
        ],
        rows: [
            { feature: 'Key architecture', cavos: 'No key reconstruction. The device derives the account key from a MasterDEK and signs.', them: 'MPC / threshold shares combined to reconstruct a private key.' },
            { feature: 'Provider role in signing', cavos: 'None. Cavos cannot produce a valid signature for a user.', them: 'The provider network holds a share used in reconstruction.' },
            { feature: 'Key export', cavos: 'Not exportable by design.', them: 'Export is supported.' },
            { feature: 'Adding a new device', cavos: 'The new device restores the MasterDEK with a passkey or the enclave.', them: 'Reassembling shares on the new device.' },
            { feature: 'Chain coverage', cavos: CAVOS_CHAINS, them: 'Broad multi-chain coverage.' },
            { feature: 'Gas sponsorship', cavos: CAVOS_GAS, them: 'Depends on the chain and any account abstraction layer you add.' },
            { feature: 'Pricing', cavos: CAVOS_PRICING, them: WEB3AUTH_PRICING },
        ],
        faq: [
            { question: 'Is MPC insecure?', answer: 'No. MPC is a legitimate and widely deployed design, and Web3Auth is a serious implementation of it. The difference is the trust surface: MPC requires trusting that shares are not combined improperly, while Cavos removes key reconstruction from the design entirely. Which trade-off is right depends on your threat model.' },
            { question: 'Can I export my key from Cavos?', answer: 'No. The device key is non-exportable, which is the property that makes the model work. Portability is handled through passkey and enclave restore instead of key export.' },
            { question: 'How does Cavos pricing compare to Web3Auth?', answer: 'Cavos is free up to 1,000 wallets, then Essential at $59/mo and Complete at $139/mo. Web3Auth lists a free 1,000 monthly active wallets, Growth at $69/mo, and Scale at $399/mo.' },
            { question: 'Which chains does each support?', answer: 'Cavos ships one SDK with chain-native adapters for Starknet, Solana, and Stellar. Web3Auth documents broad multi-chain coverage.' },
        ],
    },
    {
        slug: 'magic',
        name: 'Magic',
        pageTitle: 'Cavos vs Magic (2026): Pricing, Chains, Custody',
        pageDescription:
            'Cavos vs Magic on pricing, chains, and custody. Free up to 1,000 wallets. Starknet, Solana, and Stellar vs Magic’s EVM-focused wallets.',
        summary:
            'Magic offers embedded wallets and passwordless authentication, historically known for email magic-link login and a delegated key management model backed by hardware security modules.',
        positioning:
            'Magic pioneered invisible wallet onboarding and remains a strong choice for simple, email-first flows on EVM chains. Cavos pursues the same invisible UX with a different custody model: the key is created and used on the user’s device rather than delegated to provider-operated infrastructure.',
        chooseThem: [
            'You want the simplest possible email-link onboarding on EVM chains.',
            'You prefer a mature, long-established provider for a straightforward wallet requirement.',
            'You need a broad set of prebuilt login methods with minimal configuration.',
        ],
        chooseCavos: [
            'You want the signing key to be device-bound and non-exportable rather than provider-delegated.',
            'You need Starknet, Solana, or Stellar with native account and execution semantics.',
            'You need documented, non-custodial recovery and passkey restore on new devices.',
        ],
        rows: [
            { feature: 'Signing authority', cavos: CAVOS_CUSTODY, them: 'Delegated key management backed by hardware security modules operated by the provider.' },
            { feature: 'Onboarding', cavos: 'Sign in with an identity you already own; the account is resolved registry-first.', them: 'Email magic link and social login.' },
            { feature: 'Chain coverage', cavos: CAVOS_CHAINS, them: 'EVM-focused with additional chain support.' },
            { feature: 'Account model', cavos: CAVOS_ACCOUNT_MODEL, them: 'Primarily EOA-style wallets.' },
            { feature: 'Gas sponsorship', cavos: CAVOS_GAS, them: 'Available through account abstraction integrations.' },
            { feature: 'Recovery', cavos: CAVOS_RECOVERY, them: 'Tied to the authentication factor and provider-side key infrastructure.' },
            { feature: 'Pricing', cavos: CAVOS_PRICING, them: MAGIC_PRICING },
        ],
        faq: [
            { question: 'Is email-link login enough for self-custody?', answer: 'It depends on what backs the key. If access to the email account grants the provider the ability to sign, the security of the wallet reduces to the security of that email account. Cavos separates the two: identity selects which account you are, but a device factor is required to sign.' },
            { question: 'Does Cavos support email login?', answer: 'Yes. Cavos supports hosted login including email, or you can bring your own auth and pass an identity directly. In both cases signing still requires an enrolled device.' },
            { question: 'How does Cavos pricing compare to Magic?', answer: 'Cavos is free up to 1,000 wallets, then Essential at $59/mo and Complete at $139/mo. Magic’s public Developer plan includes 1,000 monthly active wallets and 50K signatures; $99/mo includes 2,500 MAWs.' },
            { question: 'Which chains does each support?', answer: 'Cavos ships one SDK with chain-native adapters for Starknet, Solana, and Stellar. Magic is EVM-focused with additional chain support.' },
        ],
    },
    {
        // Alchemy Account Kit / Wallet APIs facts from public docs (October 2026):
        // Deprecation + Privy as recommended signer: https://www.alchemy.com/docs/wallets/account-kit-deprecated
        // Wallet APIs capabilities: https://www.alchemy.com/docs/wallets
        // Signup cutoff 18 June 2026: https://www.alchemy.com/docs/changelog/2026/6/18
        // Pricing: https://www.alchemy.com/docs/reference/pricing-plans
        // Chain coverage: https://www.alchemy.com/docs/wallets/supported-chains
        // EIP-7702 Modular Account v2: https://www.alchemy.com/docs/wallets/transactions/using-eip-7702
        slug: 'alchemy',
        name: 'Alchemy',
        tableName: 'Alchemy Account Kit',
        pageTitle: 'Cavos vs Alchemy (2026): Pricing, Chains, Custody',
        pageH1: 'Cavos vs Alchemy Account Kit',
        pageDescription:
            'Cavos vs Alchemy Account Kit. Free up to 1,000 wallets. Alchemy Wallet APIs sponsor gas; they recommend Privy as the signer, not as a replacement.',
        summary:
            'Alchemy Account Kit (v4), including its embedded wallets, signer support, and key management, is deprecated. Alchemy now ships Wallet APIs as a signer-agnostic transaction layer and recommends Privy or another provider for login and keys.',
        positioning:
            'This is not a like-for-like embedded-wallet swap. Cavos is a finished embedded wallet SDK: auth, a device-native account, recovery, and Gas Sponsorship in Any Token. Alchemy Wallet APIs sponsor gas, batch calls, and upgrade an existing EOA to a smart wallet with EIP-7702; they do not replace the signer. Alchemy documents Privy as the recommended signer, alongside Turnkey, Openfort, and any viem-compatible signer.',
        chooseThem: [
            'You need a transaction layer — gas sponsorship, batching, and EIP-7702 — on many EVM chains, and already have a signer such as Privy or Turnkey.',
            'You want ERC-20 gas payments or Bundler Sponsored Operations on EVM, which Alchemy documents on Wallet APIs.',
            'You are migrating an existing Account Kit or Alchemy Signer integration and need Alchemy’s remaining login endpoints while you switch signers.',
        ],
        chooseCavos: [
            'You want one SDK for login, wallet, recovery, and sponsorship rather than Wallet APIs plus a separate signer.',
            'You are building on Starknet or Stellar, which Cavos ships as native adapters; Alchemy Wallet APIs document EVM networks plus Solana.',
            'You need signing authority on the user’s device, with Cavos holding no key that can move funds.',
        ],
        rows: [
            { feature: 'Product layer', cavos: 'Complete embedded wallet SDK: auth, wallet, recovery, Gas Sponsorship in Any Token.', them: 'Wallet APIs are the transaction layer after your signer. Account Kit embedded wallets, signer, and key management are deprecated.' },
            { feature: 'Signing authority', cavos: CAVOS_CUSTODY, them: 'Bring-your-own signer. Wallet APIs leave login and keys to Privy (recommended), Turnkey, Openfort, or a viem-compatible signer.' },
            { feature: 'Chain coverage', cavos: CAVOS_CHAINS, them: 'Many EVM networks plus Solana. Bundler, ERC-20 gas payments, and Bundler Sponsored Operations are documented for those EVM networks, not for Solana.' },
            { feature: 'Account model', cavos: CAVOS_ACCOUNT_MODEL, them: 'EVM defaults to EIP-7702: the EOA delegates to Modular Account v2 without changing address. Signers that cannot sign EIP-7702 authorizations use non-7702 mode, which creates a separate smart wallet address.' },
            { feature: 'Gas sponsorship', cavos: CAVOS_GAS, them: 'Gas sponsorship on EVM and Solana, ERC-20 gas payments, batching, session keys, and automatic fee bumps, as documented for Wallet APIs.' },
            { feature: 'Recovery', cavos: CAVOS_RECOVERY, them: 'Not provided by Wallet APIs. Recovery belongs to the signer you bring, such as Privy or Turnkey.' },
            { feature: 'Pricing', cavos: CAVOS_PRICING, them: ALCHEMY_PRICING },
        ],
        faq: [
            { question: 'Is Alchemy Account Kit still an embedded wallet I can sign up for?', answer: 'No. Alchemy documents Account Kit (v4), including embedded wallets, signer support, and key management, as deprecated. New sign-ups for the Alchemy Signer, Account Kit, and Embedded Wallets have been turned off since 18 June 2026. Wallet APIs are the supported successor.' },
            { question: 'Is Alchemy vs Privy a like-for-like choice?', answer: 'No. Alchemy Wallet APIs are a transaction layer: gas sponsorship, batching, and EIP-7702. Alchemy recommends Privy or another provider for signer support. Cavos is a finished embedded wallet SDK with login, a device-native account, recovery, and Gas Sponsorship in Any Token.' },
            { question: 'Which chains does each support?', answer: 'Cavos ships Starknet, Solana, and Stellar. Alchemy Wallet APIs document gas sponsorship on many EVM networks and on Solana. Bundler, ERC-20 gas payments, and Bundler Sponsored Operations are documented for those EVM networks, not for Solana.' },
            { question: 'How does Cavos pricing compare to Alchemy?', answer: 'Cavos is free up to 1,000 wallets, then Essential at $59/mo and Complete at $139/mo. Alchemy prices infrastructure in compute units: the free tier includes 30 million CUs per month, PAYG is $0.525 per million CUs, and Gas Manager lists an 8% admin fee on PAYG.' },
        ],
    },
]

export function getCompetitor(slug: string): Competitor | undefined {
    return COMPETITORS.find((c) => c.slug === slug)
}

function rowMatching(competitor: Competitor, pattern: RegExp): CompareRow | undefined {
    return competitor.rows.find((row) => pattern.test(row.feature))
}

export type EmbeddedWalletProviderRow = {
    slug: string
    name: string
    href: string
    pricing: string
    chains: string
    keyModel: string
}

const COMPETITOR_PRICING: Record<string, string> = {
    privy: PRIVY_PRICING,
    dynamic: DYNAMIC_PRICING,
    turnkey: TURNKEY_PRICING,
    web3auth: WEB3AUTH_PRICING,
    magic: MAGIC_PRICING,
    alchemy: ALCHEMY_PRICING,
}

/** Compact provider rows for the embedded-wallet guide table. Cavos plus COMPETITORS. */
export function embeddedWalletProviderRows(): EmbeddedWalletProviderRow[] {
    const cavos: EmbeddedWalletProviderRow = {
        slug: 'cavos',
        name: 'Cavos',
        href: '/pricing',
        pricing: CAVOS_PRICING,
        chains: 'Starknet, Solana, and Stellar.',
        keyModel:
            'Device-native. One stark key from MasterDEK and app salt. No MPC. Starknet uses an audited OpenZeppelin AccountUpgradeable v3.0.0.',
    }

    const others = COMPETITORS.map((competitor) => {
        const signing = rowMatching(
            competitor,
            /signing authority|key architecture|where keys live/i,
        )
        const chains = rowMatching(competitor, /chain coverage/i)
        return {
            slug: competitor.slug,
            name: competitor.tableName ?? competitor.name,
            href: `/compare/${competitor.slug}`,
            pricing: COMPETITOR_PRICING[competitor.slug] ?? 'See the vendor pricing page.',
            chains: chains?.them ?? competitor.summary,
            keyModel: signing?.them ?? competitor.summary,
        }
    })

    return [cavos, ...others]
}
