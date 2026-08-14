export type CompareRow = {
    feature: string
    cavos: string
    them: string
}

export type Competitor = {
    slug: string
    name: string
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
const CAVOS_GAS =
    'Chain-specific: Starknet paymaster, Solana relayer as fee payer, Stellar sponsored reserves and fee bumps.'
const CAVOS_RECOVERY =
    'Non-custodial recovery codes on every chain, multi-device passkey approval, and opt-in hardware-isolated social recovery.'

export const COMPETITORS: Competitor[] = [
    {
        slug: 'privy',
        name: 'Privy',
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
            'You want device-bound authority with passkey-based device approval as an explicit, documented model.',
        ],
        rows: [
            { feature: 'Signing authority', cavos: CAVOS_CUSTODY, them: 'Embedded wallet keys are managed through Privy’s key management infrastructure, with configurable self-custody and recovery options.' },
            { feature: 'Chain coverage', cavos: CAVOS_CHAINS, them: 'Broad EVM support plus Solana; coverage and feature parity vary by chain.' },
            { feature: 'Account model', cavos: 'Smart account on Starknet, device-account PDA on Solana, classic multisig G-account on Stellar.', them: 'EOA-style embedded wallets, with smart account support through integrations.' },
            { feature: 'Gas sponsorship', cavos: CAVOS_GAS, them: 'Available through paymaster and bundler integrations, typically on EVM smart accounts.' },
            { feature: 'Recovery', cavos: CAVOS_RECOVERY, them: 'Provider-defined recovery options including password and cloud-backup based flows.' },
            { feature: 'Maturity', cavos: 'Newer product; three adapters shipped and documented.', them: 'Established provider with large production adoption.' },
        ],
        faq: [
            { question: 'Is Cavos a drop-in replacement for Privy?', answer: 'No. They target different chain ecosystems. If your application is EVM-first, Privy covers ground Cavos does not. Cavos is a direct alternative when you are building on Starknet, Solana, or Stellar and want a device-native, MPC-free signing model.' },
            { question: 'Does Cavos use MPC like some embedded wallet providers?', answer: 'No. Cavos does not split or reconstruct a signing key across servers. Authority is a non-exportable device key, or on Stellar a control key unwrapped locally on an enrolled device.' },
            { question: 'Can I migrate from Privy to Cavos?', answer: 'Wallet addresses are derived differently, so accounts do not transfer automatically. Migration means provisioning new Cavos wallets against your existing stable user IDs and moving assets deliberately. Treat it as a migration project, not a config change.' },
        ],
    },
    {
        slug: 'dynamic',
        name: 'Dynamic',
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
        ],
        faq: [
            { question: 'Does Cavos support connecting existing wallets like MetaMask?', answer: 'No. Cavos provisions and controls an embedded, device-native account for each user. If connecting existing external wallets is a requirement, a connection-focused provider such as Dynamic is the better fit, and the two models can coexist in one product.' },
            { question: 'Which is better for non-crypto users?', answer: 'Cavos is designed so a user never selects a wallet: they sign in with an identity you already own and a deterministic self-custodial account is derived. Dynamic can also hide this, but its surface area is broader because it also serves crypto-native connection flows.' },
        ],
    },
    {
        slug: 'turnkey',
        name: 'Turnkey',
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
            { feature: 'Server-side signing', cavos: 'Not a general capability; the on-chain account is the sole authority over signers.', them: 'A core capability with policy controls.' },
            { feature: 'Chain coverage', cavos: CAVOS_CHAINS, them: 'Broad cryptographic curve and chain support at the signing primitive level.' },
            { feature: 'Recovery', cavos: CAVOS_RECOVERY, them: 'You design recovery on top of the provided primitives.' },
        ],
        faq: [
            { question: 'Is Turnkey a competitor or a building block?', answer: 'Mostly a building block. Teams frequently use Turnkey to build something similar to what Cavos ships as a product. The decision is usually build-versus-buy rather than a feature comparison.' },
            { question: 'Does Cavos ever use enclaves?', answer: 'Only for opt-in hardware-isolated social recovery, which runs in an AWS Nitro Enclave with pinned attestation measurements and can schedule at most one bounded add-signer operation. It is off by default and is not a general server-side signing capability.' },
        ],
    },
    {
        slug: 'web3auth',
        name: 'Web3Auth',
        summary:
            'Web3Auth provides social-login wallets using multi-party computation, splitting key shares across the user’s device, the provider’s network, and recovery factors.',
        positioning:
            'This is the clearest architectural contrast in the category. Web3Auth reconstructs a private key from distributed shares; Cavos never reconstructs a key at all, because the device key signs directly and the on-chain account decides which signers are authorized.',
        chooseThem: [
            'You need very broad chain coverage from a single social-login wallet layer.',
            'You want a key you can export and use in other tooling.',
            'Your users expect a familiar social-login wallet with a long track record.',
        ],
        chooseCavos: [
            'Your threat model rules out any architecture where a provider holds a reconstructable key share.',
            'You want signer authority enforced on-chain rather than by off-chain share distribution.',
            'You are targeting Starknet, Solana, or Stellar specifically.',
        ],
        rows: [
            { feature: 'Key architecture', cavos: 'No key reconstruction. A non-exportable device key signs; the on-chain account authorizes signers.', them: 'MPC / threshold shares combined to reconstruct a private key.' },
            { feature: 'Provider role in signing', cavos: 'None. Cavos cannot produce a valid signature for a user.', them: 'The provider network holds a share used in reconstruction.' },
            { feature: 'Key export', cavos: 'Not exportable by design.', them: 'Export is supported.' },
            { feature: 'Adding a new device', cavos: 'Explicit on-chain device approval via passkey or recovery code.', them: 'Reassembling shares on the new device.' },
            { feature: 'Chain coverage', cavos: CAVOS_CHAINS, them: 'Broad multi-chain coverage.' },
            { feature: 'Gas sponsorship', cavos: CAVOS_GAS, them: 'Depends on the chain and any account abstraction layer you add.' },
        ],
        faq: [
            { question: 'Is MPC insecure?', answer: 'No. MPC is a legitimate and widely deployed design, and Web3Auth is a serious implementation of it. The difference is the trust surface: MPC requires trusting that shares are not combined improperly, while Cavos removes key reconstruction from the design entirely. Which trade-off is right depends on your threat model.' },
            { question: 'Can I export my key from Cavos?', answer: 'No. The device key is non-exportable, which is the property that makes the model work. Portability is handled through multi-device approval and non-custodial recovery codes instead of key export.' },
        ],
    },
    {
        slug: 'magic',
        name: 'Magic',
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
            'You need documented, non-custodial recovery and explicit multi-device approval.',
        ],
        rows: [
            { feature: 'Signing authority', cavos: CAVOS_CUSTODY, them: 'Delegated key management backed by hardware security modules operated by the provider.' },
            { feature: 'Onboarding', cavos: 'Sign in with an identity you already own; the account is derived deterministically.', them: 'Email magic link and social login.' },
            { feature: 'Chain coverage', cavos: CAVOS_CHAINS, them: 'EVM-focused with additional chain support.' },
            { feature: 'Account model', cavos: 'Native smart accounts and device-account programs per chain.', them: 'Primarily EOA-style wallets.' },
            { feature: 'Gas sponsorship', cavos: CAVOS_GAS, them: 'Available through account abstraction integrations.' },
            { feature: 'Recovery', cavos: CAVOS_RECOVERY, them: 'Tied to the authentication factor and provider-side key infrastructure.' },
        ],
        faq: [
            { question: 'Is email-link login enough for self-custody?', answer: 'It depends on what backs the key. If access to the email account grants the provider the ability to sign, the security of the wallet reduces to the security of that email account. Cavos separates the two: identity selects which account you are, but a device factor is required to sign.' },
            { question: 'Does Cavos support email login?', answer: 'Yes. Cavos supports hosted login including email, or you can bring your own auth and pass an identity directly. In both cases signing still requires an enrolled device.' },
        ],
    },
]

export function getCompetitor(slug: string): Competitor | undefined {
    return COMPETITORS.find((c) => c.slug === slug)
}
