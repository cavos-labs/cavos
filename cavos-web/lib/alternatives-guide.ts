import {
  EMBEDDED_WALLET_API_PATH,
  EMBEDDED_WALLET_API_TITLE,
  EMBEDDED_WALLET_INTEGRATION_PATH,
  EMBEDDED_WALLET_INTEGRATION_TITLE,
  EMBEDDED_WALLET_PROVIDERS_PATH,
  EMBEDDED_WALLET_PROVIDERS_TITLE,
  EMBEDDED_WALLET_VS_EXTENSION_PATH,
  EMBEDDED_WALLET_VS_EXTENSION_TITLE,
  NON_CUSTODIAL_EMBEDDED_WALLET_PATH,
  NON_CUSTODIAL_EMBEDDED_WALLET_TITLE,
  PRIVY_VS_TURNKEY_PATH,
  PRIVY_VS_TURNKEY_TITLE,
  WALLET_AS_A_SERVICE_PATH,
  WALLET_AS_A_SERVICE_TITLE,
} from './embedded-wallet-guide'
import { getCompetitor } from './compare-data'

/**
 * Shared types and vendor copy for /privy-alternatives, /turnkey-alternatives,
 * /dynamic-alternatives, and /magic-alternatives. Competitor facts and public
 * pricing as of October 2026 come from `lib/compare-data.ts`:
 * privy.io/pricing, dynamic.xyz/pricing, turnkey.com/pricing,
 * metamask.io/developer/embedded-wallets, magic.link/pricing.
 * Cavos fees are from `/pricing`. Do not invent REST paths or account models.
 */

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

export type AlternativesInline = string | { href: string; label: string }

export type AlternativesGuide = {
  path: string
  title: string
  description: string
  h1: string
  published: string
  modified: string
  crumb: string
  jsonLdId: string
  introParagraphs: AlternativesInline[][]
  whyLookHeading: string
  whyLookIntro: string
  whyLook: readonly { title: string; body: string }[]
  comparedHeading: string
  comparedIntro: string
  sections: AlternativeSection[]
  howToChooseHeading: string
  howToChooseIntro: string
  howToChoose: readonly string[]
  howToChooseOutro: AlternativesInline[]
  stayHeading: string
  stayIntro: string
  chooseThem: () => string[]
  faq: readonly { question: string; answer: string }[]
  itemListName: string
}

export const CAVOS_CHAIN_ACCOUNT_PARAGRAPH =
  'One SDK ships chain-native adapters for those three networks. On Starknet each wallet is an audited OpenZeppelin account contract — AccountUpgradeable v3.0.0 — controlled by one stark key derived from the MasterDEK and app salt. Solana uses a native Ed25519 system account. Stellar uses a classic G-account. Recovery is off-chain: a new device restores the MasterDEK with a passkey or an opt-in hardware-isolated enclave. There is no on-chain device-signer list and no on-chain social recovery.'

export const CAVOS_RELATED_LINKS: AlternativeRelatedLink[] = [
  { href: '/embedded-starknet-wallet', label: 'Embedded Starknet wallet' },
  { href: '/embedded-solana-wallet', label: 'Embedded Solana wallet' },
  { href: '/embedded-stellar-wallet', label: 'Embedded Stellar wallet' },
  {
    href: EMBEDDED_WALLET_INTEGRATION_PATH,
    label: EMBEDDED_WALLET_INTEGRATION_TITLE,
  },
  {
    href: EMBEDDED_WALLET_API_PATH,
    label: EMBEDDED_WALLET_API_TITLE,
  },
  {
    href: NON_CUSTODIAL_EMBEDDED_WALLET_PATH,
    label: NON_CUSTODIAL_EMBEDDED_WALLET_TITLE,
  },
  {
    href: EMBEDDED_WALLET_PROVIDERS_PATH,
    label: EMBEDDED_WALLET_PROVIDERS_TITLE,
  },
  {
    href: WALLET_AS_A_SERVICE_PATH,
    label: WALLET_AS_A_SERVICE_TITLE,
  },
]

/** Reused vendor bodies. Source: competitor summaries in lib/compare-data.ts. */
export const VENDOR_PARAGRAPHS = {
  privy: [
    'Privy is a widely adopted embedded wallet and authentication provider focused primarily on EVM chains, offering both embedded wallets and external wallet connection.',
    'Privy manages embedded wallet keys through its key-management infrastructure, with configurable self-custody and recovery options. Chain coverage is broad EVM plus Solana. Gas sponsorship is available through paymaster and bundler integrations, typically on EVM smart accounts. Connecting existing extensions is a core capability Cavos does not offer.',
    'Choose Privy when the product is EVM-first, when you want a single vendor for embedded wallets and WalletConnect or injected wallets, or when you need the largest available ecosystem of integrations. Stripe acquired Privy in 2025. The public Developer free tier is 0–499 MAU with 50K signatures and $1M volume per month; Core is $299/mo and Scale is $499/mo.',
  ],
  dynamic: [
    'Dynamic provides wallet connection, embedded wallets, and authentication tooling with a strong emphasis on multi-wallet login experiences and developer-facing configuration. Connecting existing external wallets is a core capability. Cavos provisions the wallet rather than connecting to one the user already holds. The two models can coexist in one product.',
    'Embedded wallet keys are managed by the provider’s key infrastructure with configurable custody models. Dynamic’s public pricing page lists TSS-MPC key management as a plan feature. Chain coverage is multi-chain, with EVM breadth and additional non-EVM support; parity varies by chain. Gas sponsorship is supported through account abstraction and paymaster integrations, mainly on EVM.',
    'Fireblocks acquired Dynamic in 2025. That is a vendor-risk and custody-stack input, not a reason to treat the products as interchangeable. Dynamic’s public Growth plan is $249/mo for up to 5,000 monthly active users, then $0.05 per extra MAU. A sandbox is available for integration testing before live mode.',
  ],
  turnkey: [
    'Privy vs Turnkey is usually a layer question, not a feature checklist. Privy is a finished embedded wallet and authentication product. Turnkey is secure key-management infrastructure running in hardware-backed secure enclaves, exposed as a low-level API for building wallets and signing systems. You assemble the wallet experience on top of policy-driven signing primitives.',
    'Keys live in remote enclaves, not on the end user’s device. Server-side signing, organizational policy, quorums, and approval workflows are the point of that design. Chain coverage is broad at the cryptographic-curve and signing-primitive level. Recovery is something you design on top of those primitives.',
    'Choose Turnkey when you are building your own wallet or custody product. Choose a finished SDK when you want login, recovery, and sponsorship already wired. Turnkey’s public Pay as you go tier includes 1,000 wallets and 25 free signatures per month, then $0.10 per signature. Pro is $99/mo.',
  ],
  web3auth: [
    'Web3Auth — shipped by Consensys as MetaMask Embedded Wallets after the 2025 acquisition — provides social-login wallets using multi-party computation. Key shares are split across the user’s device, the provider’s network, and recovery factors. Signing reconstructs or jointly computes a signature from those shares.',
    'That is the clearest architectural contrast with Cavos. Cavos never reconstructs a signing key: the device derives the account key and signs. MetaMask’s product page states that Embedded Wallets use MPC with threshold signatures and Shamir’s Secret Sharing, and that export is part of the model. The same page lists native support for EVM and Solana, plus additional networks including Bitcoin and StarkNet.',
    'Choose Web3Auth when you need very broad chain coverage from a single social-login wallet layer, or a key you can export and use in other tooling. Public pricing starts at a free Base plan with 1,000 monthly active wallets. Growth is $69/mo. Scale is $399/mo.',
  ],
  magic: [
    'Magic offers embedded wallets and passwordless authentication, historically known for email magic-link login and a delegated key management model backed by hardware security modules. It pioneered invisible wallet onboarding and remains a strong choice for simple, email-first flows on EVM chains.',
    'Signing is delegated to provider-operated infrastructure rather than a device-bound key. If access to the email account grants the provider the ability to sign, wallet security reduces to the security of that inbox. Cavos separates the two: identity selects which account you are, but a device factor is required to sign. In 2026 Payward, the parent of Kraken, acquired Magic Labs wallet infrastructure.',
    'Choose Magic when you want the simplest possible email-link onboarding on EVM, or a mature provider for a straightforward wallet requirement. The public Developer plan includes 1,000 monthly active wallets and 50,000 signatures at $0/mo. The next listed team plan is $99/mo with 2,500 monthly active wallets.',
  ],
} as const

export function vendorSection(
  slug: 'privy' | 'dynamic' | 'turnkey' | 'web3auth' | 'magic',
  relatedLinks?: AlternativeRelatedLink[],
): AlternativeSection {
  const names = {
    privy: 'Privy',
    dynamic: 'Dynamic',
    turnkey: 'Turnkey',
    web3auth: 'Web3Auth',
    magic: 'Magic',
  } as const
  return {
    name: names[slug],
    href: `/compare/${slug}`,
    linkLabel: `Cavos vs ${names[slug]}`,
    paragraphs: [...VENDOR_PARAGRAPHS[slug]],
    chooseWhen: getCompetitor(slug)?.chooseThem ?? [],
    relatedLinks,
  }
}

export function alternativesItemList(
  name: string,
  sections: AlternativeSection[],
) {
  return {
    name,
    items: sections.map((section) => ({
      name: section.name,
      path: section.href,
    })),
  }
}

export const DEFAULT_HOW_TO_CHOOSE = [
  'Who can produce a valid signature without the user present?',
  'Where does the signing key live — device, MPC shares, HSM, or remote enclave?',
  'Which chains are native, and which are a compatibility layer?',
  'Do you need to connect existing wallets, or only provision new ones?',
  'Do you want a finished embedded-wallet SDK, or key-management infrastructure you build on?',
  'What does recovery actually do, and is it on-chain or off-chain?',
] as const

export const DEFAULT_HOW_TO_CHOOSE_OUTRO: AlternativesInline[] = [
  'Worked one-to-one comparisons live on the compare pages. For the category itself — what an embedded wallet is, and how ',
  {
    href: EMBEDDED_WALLET_VS_EXTENSION_PATH,
    label: 'embedded wallets vs browser extensions',
  },
  ', MPC, and device-native models differ — start with the ',
  { href: '/embedded-wallet', label: 'pillar guide' },
  '.',
]

export const DYNAMIC_VS_EXTENSION_LINKS: AlternativeRelatedLink[] = [
  {
    href: EMBEDDED_WALLET_VS_EXTENSION_PATH,
    label: EMBEDDED_WALLET_VS_EXTENSION_TITLE,
  },
]

export const TURNKEY_VS_PRIVY_LINKS: AlternativeRelatedLink[] = [
  {
    href: PRIVY_VS_TURNKEY_PATH,
    label: PRIVY_VS_TURNKEY_TITLE,
  },
]
