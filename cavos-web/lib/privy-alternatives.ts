import {
  EMBEDDED_WALLET_INTEGRATION_PATH,
  EMBEDDED_WALLET_INTEGRATION_TITLE,
  EMBEDDED_WALLET_PROVIDERS_PATH,
  EMBEDDED_WALLET_PROVIDERS_TITLE,
  PRIVY_VS_TURNKEY_PATH,
  PRIVY_VS_TURNKEY_TITLE,
  WALLET_AS_A_SERVICE_PATH,
  WALLET_AS_A_SERVICE_TITLE,
} from './embedded-wallet-guide'
import { getCompetitor } from './compare-data'

export const PRIVY_ALTERNATIVES_PATH = '/privy-alternatives'

export const PRIVY_ALTERNATIVES_TITLE =
  'Privy Alternatives (2026): Wallet SDKs Compared'

/** 156 characters. Document title omits "| Cavos"; the layout template adds it. */
export const PRIVY_ALTERNATIVES_DESCRIPTION =
  'Privy alternatives for embedded crypto wallets, not the Shopify popup. Compare Cavos, Dynamic, Turnkey, Web3Auth, and Magic on custody, chains, and pricing.'

export const PRIVY_ALTERNATIVES_H1 = 'Privy alternatives for embedded wallets'

export const PRIVY_ALTERNATIVES_PUBLISHED = '2026-10-11'

export const PRIVY_ALTERNATIVES_MODIFIED = '2026-10-20'

export const PRIVY_ALTERNATIVES_CRUMB = 'Privy alternatives'

export type AlternativeRelatedLink = {
  href: string
  label: string
}

export type AlternativeSection = {
  name: string
  href: string
  linkLabel: string
  paragraphs: string[]
  chooseWhen: string[]
  relatedLinks?: AlternativeRelatedLink[]
}

export const PRIVY_ALTERNATIVE_SECTIONS: AlternativeSection[] = [
  {
    name: 'Cavos',
    href: '/compare/privy',
    linkLabel: 'Cavos vs Privy',
    paragraphs: [
      'Cavos is a Privy alternative when the product is on Starknet, Solana, or Stellar and the security review requires a device-native key. The wallet is embedded in the application. Signing authority is a non-exportable device key: Cavos holds no key that can move user funds and does not reconstruct a master key with MPC.',
      'One SDK ships chain-native adapters for those three networks. On Starknet each wallet is an audited OpenZeppelin account contract — AccountUpgradeable v3.0.0 — controlled by one stark key derived from the MasterDEK and app salt. Solana uses a native Ed25519 system account. Stellar uses a classic G-account. Recovery is off-chain: a new device restores the MasterDEK with a passkey or an opt-in hardware-isolated enclave. There is no on-chain device-signer list and no on-chain social recovery.',
      'Cavos is not a drop-in replacement for Privy. It does not connect existing extensions, and it is not an EVM-wide wallet layer. The published free tier covers the first 1,000 wallet creates; Essential is $59/mo and Complete is $139/mo.',
    ],
    chooseWhen: getCompetitor('privy')?.chooseCavos ?? [],
    relatedLinks: [
      { href: '/embedded-starknet-wallet', label: 'Embedded Starknet wallet' },
      { href: '/embedded-solana-wallet', label: 'Embedded Solana wallet' },
      { href: '/embedded-stellar-wallet', label: 'Embedded Stellar wallet' },
      {
        href: EMBEDDED_WALLET_INTEGRATION_PATH,
        label: EMBEDDED_WALLET_INTEGRATION_TITLE,
      },
      {
        href: EMBEDDED_WALLET_PROVIDERS_PATH,
        label: EMBEDDED_WALLET_PROVIDERS_TITLE,
      },
      {
        href: WALLET_AS_A_SERVICE_PATH,
        label: WALLET_AS_A_SERVICE_TITLE,
      },
    ],
  },
  {
    name: 'Dynamic',
    href: '/compare/dynamic',
    linkLabel: 'Cavos vs Dynamic',
    paragraphs: [
      'Dynamic provides wallet connection, embedded wallets, and authentication tooling with a strong emphasis on multi-wallet login experiences and developer-facing configuration. Connecting existing external wallets is a core capability. Cavos provisions the wallet rather than connecting to one the user already holds. The two models can coexist in one product.',
      'Embedded wallet keys are managed by the provider’s key infrastructure with configurable custody models. Dynamic’s public pricing page lists TSS-MPC key management as a plan feature. Chain coverage is multi-chain, with EVM breadth and additional non-EVM support; parity varies by chain. Gas sponsorship is supported through account abstraction and paymaster integrations, mainly on EVM.',
      'Fireblocks acquired Dynamic in 2025. That is a vendor-risk and custody-stack input, not a reason to treat the products as interchangeable. Dynamic’s public Growth plan is $249/mo for up to 5,000 monthly active users, then $0.05 per extra MAU. A sandbox is available for integration testing before live mode.',
    ],
    chooseWhen: getCompetitor('dynamic')?.chooseThem ?? [],
  },
  {
    name: 'Turnkey',
    href: '/compare/turnkey',
    linkLabel: 'Cavos vs Turnkey',
    paragraphs: [
      'Privy vs Turnkey is usually a layer question, not a feature checklist. Privy is a finished embedded wallet and authentication product. Turnkey is secure key-management infrastructure running in hardware-backed secure enclaves, exposed as a low-level API for building wallets and signing systems. You assemble the wallet experience on top of policy-driven signing primitives.',
      'Keys live in remote enclaves, not on the end user’s device. Server-side signing, organizational policy, quorums, and approval workflows are the point of that design. Chain coverage is broad at the cryptographic-curve and signing-primitive level. Recovery is something you design on top of those primitives.',
      'Choose Turnkey when you are building your own wallet or custody product. Choose a finished SDK when you want login, recovery, and sponsorship already wired. Turnkey’s public Pay as you go tier includes 1,000 wallets and 25 free signatures per month, then $0.10 per signature. Pro is $99/mo.',
    ],
    chooseWhen: getCompetitor('turnkey')?.chooseThem ?? [],
    relatedLinks: [
      {
        href: PRIVY_VS_TURNKEY_PATH,
        label: PRIVY_VS_TURNKEY_TITLE,
      },
    ],
  },
  {
    name: 'Web3Auth',
    href: '/compare/web3auth',
    linkLabel: 'Cavos vs Web3Auth',
    paragraphs: [
      'Web3Auth — shipped by Consensys as MetaMask Embedded Wallets after the 2025 acquisition — provides social-login wallets using multi-party computation. Key shares are split across the user’s device, the provider’s network, and recovery factors. Signing reconstructs or jointly computes a signature from those shares.',
      'That is the clearest architectural contrast with Cavos. Cavos never reconstructs a signing key: the device derives the account key and signs. MetaMask’s product page states that Embedded Wallets use MPC with threshold signatures and Shamir’s Secret Sharing, and that export is part of the model. The same page lists native support for EVM and Solana, plus additional networks including Bitcoin and StarkNet.',
      'Choose Web3Auth when you need very broad chain coverage from a single social-login wallet layer, or a key you can export and use in other tooling. Public pricing starts at a free Base plan with 1,000 monthly active wallets. Growth is $69/mo. Scale is $399/mo.',
    ],
    chooseWhen: getCompetitor('web3auth')?.chooseThem ?? [],
  },
  {
    name: 'Magic',
    href: '/compare/magic',
    linkLabel: 'Cavos vs Magic',
    paragraphs: [
      'Magic offers embedded wallets and passwordless authentication, historically known for email magic-link login and a delegated key management model backed by hardware security modules. It pioneered invisible wallet onboarding and remains a strong choice for simple, email-first flows on EVM chains.',
      'Signing is delegated to provider-operated infrastructure rather than a device-bound key. If access to the email account grants the provider the ability to sign, wallet security reduces to the security of that inbox. Cavos separates the two: identity selects which account you are, but a device factor is required to sign. In 2026 Payward, the parent of Kraken, acquired Magic Labs wallet infrastructure.',
      'Choose Magic when you want the simplest possible email-link onboarding on EVM, or a mature provider for a straightforward wallet requirement. The public Developer plan includes 1,000 monthly active wallets and 50,000 signatures at $0/mo. The next listed team plan is $99/mo with 2,500 monthly active wallets.',
    ],
    chooseWhen: getCompetitor('magic')?.chooseThem ?? [],
  },
]

export function privyChooseThem(): string[] {
  return getCompetitor('privy')?.chooseThem ?? []
}

export const PRIVY_WHY_LOOK = [
  {
    title: 'Chain coverage',
    body: 'Privy is the more mature choice across the EVM ecosystem and also covers Solana. Teams building on Starknet or Stellar, or that want each chain’s native account model rather than an abstraction over it, look past an EVM-first SDK.',
  },
  {
    title: 'Where signing authority lives',
    body: 'Privy manages embedded wallet keys through its key-management infrastructure, with configurable self-custody and recovery options. Some security and compliance reviews require that no provider-side key material can reconstruct a signing key. That is a different architecture, not a smaller feature set.',
  },
  {
    title: 'Product shape',
    body: 'Privy offers both embedded wallets and external wallet connection. That is the right default when users already hold wallets you must connect to. It is extra surface area when the product should never show a wallet picker and should only provision new accounts.',
  },
  {
    title: 'Commercial terms and vendor risk',
    body: 'Free tiers, MAU definitions, and signature allowances differ enough to change the bill at a few thousand active users. Stripe acquired Privy in 2025. The category also consolidated around Dynamic, Web3Auth, and Magic. Acquisition is a vendor-risk input. It does not change who can produce a signature.',
  },
] as const

export const PRIVY_HOW_TO_CHOOSE = [
  'Who can produce a valid signature without the user present?',
  'Where does the signing key live — device, MPC shares, HSM, or remote enclave?',
  'Which chains are native, and which are a compatibility layer?',
  'Do you need to connect existing wallets, or only provision new ones?',
  'Do you want a finished embedded-wallet SDK, or key-management infrastructure you build on?',
  'What does recovery actually do, and is it on-chain or off-chain?',
] as const

export const PRIVY_ALTERNATIVES_FAQ = [
  {
    question: 'Is Cavos a drop-in replacement for Privy?',
    answer:
      'No. They target different chain ecosystems. If your application is EVM-first, Privy covers ground Cavos does not. Cavos is a direct alternative when you are building on Starknet, Solana, or Stellar and want a device-native, MPC-free signing model.',
  },
  {
    question: 'Which Privy alternative is best for connecting existing wallets?',
    answer:
      'Dynamic. Connecting existing external wallets is a core Dynamic capability and is not a Cavos goal — Cavos provisions the wallet rather than connecting to one the user already holds. The two models can coexist in one product.',
  },
  {
    question: 'Do these alternatives use MPC?',
    answer:
      'Web3Auth does: it reconstructs a private key from distributed shares, and the provider network holds a share used in reconstruction. MetaMask’s Embedded Wallets page describes that design as MPC with threshold signatures and Shamir’s Secret Sharing. Dynamic’s public pricing page lists TSS-MPC key management. Cavos does not split or reconstruct a signing key with MPC. Turnkey holds keys in remote enclaves. Magic uses delegated key management backed by provider-operated HSMs. Privy manages keys through its own infrastructure.',
  },
  {
    question: 'Can I migrate from Privy without changing wallet addresses?',
    answer:
      'Not automatically. Wallet addresses are derived differently, so accounts do not transfer as a config change. Migration means provisioning new wallets against your existing stable user IDs and moving assets deliberately.',
  },
  {
    question: 'What is the difference between Privy and Turnkey?',
    answer:
      'Privy is a finished embedded wallet and authentication product. Turnkey is key-management infrastructure: hardware-backed enclaves and a signing API you build a wallet on top of. Privy vs Turnkey is usually build-versus-buy, not a like-for-like SDK swap.',
  },
  {
    question: 'Which Privy alternative is best for Starknet, Solana, or Stellar?',
    answer:
      'Cavos ships native adapters for all three: an audited OpenZeppelin account contract on Starknet, a native Ed25519 system account on Solana, and a classic G-account on Stellar. Privy’s published coverage is broad EVM plus Solana. MetaMask Embedded Wallets lists EVM, Solana, and additional networks including StarkNet on its product page; feature parity still varies by chain.',
  },
  {
    question: 'Is this page about the Shopify Privy popup app?',
    answer:
      'No. This page is about Privy the embedded crypto wallet and authentication provider. The Shopify popup tool of the same name is a different product.',
  },
  {
    question: 'How much do Privy alternatives cost?',
    answer:
      'Cavos is free for the first 1,000 wallet creates, then Essential at $59/mo and Complete at $139/mo. Privy’s public Developer free tier is 0–499 MAU with 50,000 signatures and $1M volume per month; Core is $299/mo and Scale is $499/mo. Dynamic’s public Growth plan is $249/mo for up to 5,000 MAUs. Turnkey’s Pay as you go tier includes 1,000 wallets and 25 free signatures per month. Web3Auth / MetaMask Embedded Wallets starts free at 1,000 monthly active wallets, with Growth at $69/mo and Scale at $399/mo. Magic’s Developer plan includes 1,000 monthly active wallets and 50,000 signatures at $0/mo. Those figures are from each vendor’s public pricing page as of October 2026 and can change.',
  },
] as const
