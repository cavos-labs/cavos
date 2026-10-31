import {
  CAVOS_CHAIN_ACCOUNT_PARAGRAPH,
  CAVOS_RELATED_LINKS,
  DEFAULT_HOW_TO_CHOOSE_OUTRO,
  DYNAMIC_VS_EXTENSION_LINKS,
  TURNKEY_VS_PRIVY_LINKS,
  type AlternativeRelatedLink,
  type AlternativeSection,
  type AlternativesGuide,
  vendorSection,
} from './alternatives-guide'
import { PRIVY_VS_TURNKEY_PATH } from './embedded-wallet-guide'
import { getCompetitor } from './compare-data'

export const PRIVY_ALTERNATIVES_PATH = '/privy-alternatives'

export const PRIVY_ALTERNATIVES_TITLE =
  'Privy Alternatives and Competitors Guide (2026)'

/** 140 characters. Document title omits "| Cavos"; the layout template adds it. */
export const PRIVY_ALTERNATIVES_DESCRIPTION =
  'Privy alternatives compared: Cavos, Dynamic, Turnkey, Web3Auth, Magic. Five Privy competitors. Free to 1,000 wallets. Not the Shopify popup.'

export const PRIVY_ALTERNATIVES_H1 = 'Privy alternatives'

export const PRIVY_ALTERNATIVES_PUBLISHED = '2026-10-11'

export const PRIVY_ALTERNATIVES_MODIFIED = '2026-10-31'

export const PRIVY_ALTERNATIVES_CRUMB = 'Privy alternatives'

export type { AlternativeRelatedLink, AlternativeSection }

export const PRIVY_ALTERNATIVE_SECTIONS: AlternativeSection[] = [
  {
    name: 'Cavos',
    href: '/compare/privy',
    linkLabel: 'Cavos vs Privy',
    paragraphs: [
      'Cavos is a Privy alternative when the product is on Starknet, Solana, or Stellar and the security review requires a device-native key. The wallet is embedded in the application. Signing authority is a non-exportable device key: Cavos holds no key that can move user funds and does not reconstruct a master key with MPC.',
      CAVOS_CHAIN_ACCOUNT_PARAGRAPH,
      'Cavos is not a drop-in replacement for Privy. It does not connect existing extensions, and it is not an EVM-wide wallet layer. The published free tier covers the first 1,000 wallet creates; Essential is $59/mo and Complete is $139/mo.',
    ],
    chooseWhen: getCompetitor('privy')?.chooseCavos ?? [],
    relatedLinks: CAVOS_RELATED_LINKS,
  },
  vendorSection('dynamic', [
    ...DYNAMIC_VS_EXTENSION_LINKS,
    { href: '/dynamic-alternatives', label: 'Dynamic alternatives' },
  ]),
  vendorSection('turnkey', [
    ...TURNKEY_VS_PRIVY_LINKS,
    { href: '/turnkey-alternatives', label: 'Turnkey alternatives' },
  ]),
  vendorSection('web3auth'),
  vendorSection('magic', [
    { href: '/magic-alternatives', label: 'Magic alternatives' },
  ]),
]

export function privyChooseThem(): string[] {
  return getCompetitor('privy')?.chooseThem ?? []
}

export function privyAlternativesItemList() {
  return {
    name: 'Privy alternatives',
    items: PRIVY_ALTERNATIVE_SECTIONS.map((section) => ({
      name: section.name,
      path: section.href,
    })),
  }
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
  'Where does the signing key live: device, MPC shares, HSM, or remote enclave?',
  'Which chains are native, and which are a compatibility layer?',
  'Do you need to connect existing wallets, or only provision new ones?',
  'Do you want a finished embedded-wallet SDK, or key-management infrastructure you build on?',
  'What does recovery actually do, and is it on-chain or off-chain?',
] as const

export const PRIVY_ALTERNATIVES_FAQ = [
  {
    question: 'What is the best Privy alternative?',
    answer:
      'There is no single best Privy alternative. The right pick depends on chain and key model. Cavos is the alternative when the product is on Starknet, Solana, or Stellar and the review requires a device-native key. Dynamic is stronger when you must connect wallets users already hold. Turnkey is key-management infrastructure, not a finished SDK. Web3Auth / MetaMask Embedded Wallets fits broad social-login chain coverage. Magic fits simple email-first EVM onboarding. Privy itself remains the more mature choice across the EVM ecosystem.',
  },
  {
    question: 'Is there a free Privy alternative?',
    answer:
      'Yes. Cavos is free for the first 1,000 wallet creates, then Essential at $59/mo and Complete at $139/mo. Web3Auth / MetaMask Embedded Wallets starts free at 1,000 monthly active wallets. Magic’s Developer plan includes 1,000 monthly active wallets and 50,000 signatures at $0/mo. Turnkey’s Pay as you go tier includes 1,000 wallets and 25 free signatures per month. Privy’s own Developer free tier is 0–499 MAU. Those figures are from each vendor’s public pricing page as of October 2026 and can change.',
  },
  {
    question: 'Which Privy alternative is best for Starknet, Solana, or Stellar?',
    answer:
      'Cavos ships native adapters for all three: an audited OpenZeppelin account contract on Starknet, a native Ed25519 system account on Solana, and a classic G-account on Stellar. Privy’s published coverage is broad EVM plus Solana. MetaMask Embedded Wallets lists EVM, Solana, and additional networks including StarkNet on its product page; feature parity still varies by chain.',
  },
  {
    question: 'Is Cavos a drop-in replacement for Privy?',
    answer:
      'No. They target different chain ecosystems. If your application is EVM-first, Privy covers ground Cavos does not. Cavos is a direct alternative when you are building on Starknet, Solana, or Stellar and want a device-native, MPC-free signing model. Wallet addresses are derived differently, so accounts do not transfer as a config change.',
  },
  {
    question: 'What is the difference between Privy and Turnkey?',
    answer:
      'Privy is a finished embedded wallet and authentication product. Turnkey is key-management infrastructure: hardware-backed enclaves and a signing API you build a wallet on top of. Privy vs Turnkey is usually build-versus-buy, not a like-for-like SDK swap.',
  },
  {
    question: 'Is this page about the Shopify Privy popup app?',
    answer:
      'No. This page is about Privy the embedded crypto wallet and authentication provider. The Shopify popup tool of the same name is a different product.',
  },
  {
    question: 'What are some alternatives to Privy?',
    answer:
      'Cavos, Dynamic, Turnkey, Web3Auth / MetaMask Embedded Wallets, and Magic are the five Privy alternatives compared here. Cavos fits Starknet, Solana, or Stellar with a device-native key. Dynamic fits connecting wallets users already hold. Turnkey is signing infrastructure. Web3Auth fits broad social-login chain coverage. Magic fits email-first EVM onboarding. Privy remains the more mature EVM choice.',
  },
  {
    question: 'Who are Privy wallet competitors?',
    answer:
      'Privy wallet competitors, the same five compared here, are Cavos, Dynamic, Turnkey, Web3Auth / MetaMask Embedded Wallets, and Magic. They compete with Privy in embedded wallets, not the Shopify popup. Which Privy alternative fits depends on chain and key model; the one-to-one is Cavos vs Privy.',
  },
] as const

export const privyAlternativesGuide: AlternativesGuide = {
  path: PRIVY_ALTERNATIVES_PATH,
  title: PRIVY_ALTERNATIVES_TITLE,
  description: PRIVY_ALTERNATIVES_DESCRIPTION,
  h1: PRIVY_ALTERNATIVES_H1,
  published: PRIVY_ALTERNATIVES_PUBLISHED,
  modified: PRIVY_ALTERNATIVES_MODIFIED,
  crumb: PRIVY_ALTERNATIVES_CRUMB,
  jsonLdId: 'privy-alternatives-json-ld',
  introParagraphs: [
    [
      'Cavos, Dynamic, Turnkey, Web3Auth, and Magic are the five Privy alternatives and competitors compared here. This page is the shortlist for that query: an ',
      { href: '/embedded-wallet', label: 'embedded wallet' },
      ' replacement for Privy, not the Shopify popup of the same name. A Privy alternative is a different product in this category, not a drop-in.',
    ],
    [
      'The sections below use the same facts as the ',
      { href: '/compare', label: 'compare pages' },
      '. Cavos publishes its own fees on the ',
      { href: '/pricing', label: 'pricing page' },
      '; other vendors set theirs independently. If the question is a finished SDK versus key-management infrastructure, start with ',
      { href: PRIVY_VS_TURNKEY_PATH, label: 'Privy vs Turnkey' },
      '. Replacement shortlists also exist for ',
      { href: '/turnkey-alternatives', label: 'Turnkey' },
      ', ',
      { href: '/dynamic-alternatives', label: 'Dynamic' },
      ', and ',
      { href: '/magic-alternatives', label: 'Magic' },
      '. Migration is a project, not a config change: wallet addresses are derived differently, so accounts do not transfer automatically.',
    ],
  ],
  whyLookHeading: 'Why teams look for a Privy alternative',
  whyLookIntro:
    'Privy is not the weaker product. It covers ground several of these alternatives do not, especially on EVM. Teams still shortlist replacements when one of the following no longer matches the product they are shipping.',
  whyLook: PRIVY_WHY_LOOK,
  comparedHeading: 'Privy alternatives and competitors',
  comparedIntro:
    'Cavos, Privy, Dynamic, Turnkey, Web3Auth / MetaMask Embedded Wallets, and Magic all ship an embedded wallet. They do not share a key model, the same native chain coverage, or the same pricing. Each name opens the full comparison except Cavos, which links to published fees.',
  sections: PRIVY_ALTERNATIVE_SECTIONS,
  howToChooseHeading: 'How to choose a Privy alternative',
  howToChooseIntro:
    'Ask the custody question first, then the chain question, then whether you are buying a wallet product or signing infrastructure.',
  howToChoose: PRIVY_HOW_TO_CHOOSE,
  howToChooseOutro: DEFAULT_HOW_TO_CHOOSE_OUTRO,
  stayHeading: 'When Privy is still the right choice',
  stayIntro:
    'Privy is the more mature choice across the EVM ecosystem. It is not the weaker product; it covers ground Cavos does not. Stay with Privy when the following are true.',
  chooseThem: privyChooseThem,
  faq: PRIVY_ALTERNATIVES_FAQ,
  itemListName: 'Privy alternatives',
}
