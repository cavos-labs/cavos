import {
  CAVOS_CHAIN_ACCOUNT_PARAGRAPH,
  CAVOS_RELATED_LINKS,
  DEFAULT_HOW_TO_CHOOSE,
  DEFAULT_HOW_TO_CHOOSE_OUTRO,
  DYNAMIC_VS_EXTENSION_LINKS,
  type AlternativesGuide,
  type AlternativeSection,
  alternativesItemList,
  vendorSection,
} from './alternatives-guide'
import { PRIVY_VS_TURNKEY_PATH } from './embedded-wallet-guide'
import { getCompetitor } from './compare-data'

/**
 * Replacement shortlist for Turnkey. Facts reuse lib/compare-data.ts
 * (Cavos vs Turnkey and sibling competitors). Public vendor pricing as of
 * October 2026 from:
 * privy.io/pricing, dynamic.xyz/pricing, turnkey.com/pricing,
 * metamask.io/developer/embedded-wallets, magic.link/pricing.
 * Cavos fees: `/pricing`. Layer claims (enclave signing API vs finished SDK)
 * follow the Turnkey competitor config. Verify any new vendor claim against
 * those pages before editing.
 */

export const TURNKEY_ALTERNATIVES_PATH = '/turnkey-alternatives'

export const TURNKEY_ALTERNATIVES_TITLE =
  '5 Turnkey Alternatives & Competitors (2026)'

/** 154 characters. Document title omits "| Cavos"; the layout template adds it. */
export const TURNKEY_ALTERNATIVES_DESCRIPTION =
  'Turnkey alternatives and embedded wallet competitors: Cavos, Privy, Dynamic, Web3Auth, Magic. Turnkey vs Privy, SDK vs enclaves. Free to 1,000 wallets.'

export const TURNKEY_ALTERNATIVES_H1 =
  'Turnkey alternatives and embedded wallet competitors'

export const TURNKEY_ALTERNATIVES_PUBLISHED = '2026-10-27'

export const TURNKEY_ALTERNATIVES_MODIFIED = '2026-10-31'

export const TURNKEY_ALTERNATIVES_CRUMB = 'Turnkey alternatives'

export const TURNKEY_ALTERNATIVE_SECTIONS: AlternativeSection[] = [
  {
    name: 'Cavos',
    href: '/compare/turnkey',
    linkLabel: 'Cavos vs Turnkey',
    paragraphs: [
      'Cavos is a Turnkey alternative when you want a finished embedded wallet rather than key-management infrastructure. The wallet is embedded in the application. Signing authority is a non-exportable device key on the user’s device, not a remote enclave: Cavos holds no key that can move user funds and does not reconstruct a master key with MPC.',
      CAVOS_CHAIN_ACCOUNT_PARAGRAPH,
      'Cavos is not a drop-in for Turnkey. Turnkey is a signing API you build on; Cavos is login, recovery, and Gas Sponsorship in Any Token already wired. It does not offer general server-side signing or organizational quorums. The published free tier covers the first 1,000 wallet creates; Essential is $59/mo and Complete is $139/mo.',
    ],
    chooseWhen: getCompetitor('turnkey')?.chooseCavos ?? [],
    relatedLinks: CAVOS_RELATED_LINKS,
  },
  vendorSection('privy', [
    { href: '/privy-alternatives', label: 'Privy alternatives' },
  ]),
  vendorSection('dynamic', DYNAMIC_VS_EXTENSION_LINKS),
  vendorSection('web3auth'),
  vendorSection('magic'),
]

export function turnkeyChooseThem(): string[] {
  return getCompetitor('turnkey')?.chooseThem ?? []
}

export function turnkeyAlternativesItemList() {
  return alternativesItemList('Turnkey alternatives', TURNKEY_ALTERNATIVE_SECTIONS)
}

export const TURNKEY_WHY_LOOK = [
  {
    title: 'Product layer',
    body: 'Turnkey is key-management infrastructure: hardware-backed enclaves and a signing API you build a wallet on top of. Teams that want login, recovery, and sponsorship already wired look for a finished embedded-wallet SDK instead of assembling one.',
  },
  {
    title: 'Where keys live',
    body: 'Turnkey keys live in remote enclaves operated as infrastructure. Some security reviews want the signing key on the end user’s device, with the vendor holding no key that can move funds. That is a different architecture, not a smaller feature set.',
  },
  {
    title: 'Server-side signing',
    body: 'Server-side signing, organizational policy, quorums, and approval workflows are the point of Turnkey. They are extra surface area when the product should only sign from the user’s device and should never initiate a spend from a backend.',
  },
  {
    title: 'Commercial terms and vendor risk',
    body: 'Turnkey’s public Pay as you go tier includes 1,000 wallets and 25 free signatures per month, then $0.10 per signature; Pro is $99/mo. Signature metering changes the bill quickly. Cavos prices on wallet creates: free up to 1,000 wallets, Essential $59/mo, Complete $139/mo.',
  },
] as const

export const TURNKEY_HOW_TO_CHOOSE = DEFAULT_HOW_TO_CHOOSE

export const TURNKEY_ALTERNATIVES_FAQ = [
  {
    question: 'What is the best Turnkey alternative?',
    answer:
      'There is no single best Turnkey alternative. The right pick depends on whether you want a finished SDK or signing infrastructure. Cavos is the alternative when the product is on Starknet, Solana, or Stellar and the review requires a device-native key. Privy is the more mature finished SDK across EVM. Dynamic is stronger when you must connect wallets users already hold. Web3Auth / MetaMask Embedded Wallets fits broad social-login chain coverage. Magic fits simple email-first EVM onboarding. Turnkey itself remains the better pick when you are building a wallet or custody product on policy-driven enclaves.',
  },
  {
    question: 'Is there a free Turnkey alternative?',
    answer:
      'Yes. Cavos is free for the first 1,000 wallet creates, then Essential at $59/mo and Complete at $139/mo. Web3Auth / MetaMask Embedded Wallets starts free at 1,000 monthly active wallets. Magic’s Developer plan includes 1,000 monthly active wallets and 50,000 signatures at $0/mo. Privy’s own Developer free tier is 0–499 MAU. Turnkey’s Pay as you go tier already includes 1,000 wallets and 25 free signatures per month. Those figures are from each vendor’s public pricing page as of October 2026 and can change.',
  },
  {
    question: 'Which Turnkey alternative is best for Starknet, Solana, or Stellar?',
    answer:
      'Cavos ships native adapters for all three: an audited OpenZeppelin account contract on Starknet, a native Ed25519 system account on Solana, and a classic G-account on Stellar. Turnkey’s coverage is broad at the cryptographic-curve and signing-primitive level; you still assemble the wallet UX. MetaMask Embedded Wallets lists EVM, Solana, and additional networks including StarkNet on its product page; feature parity still varies by chain.',
  },
  {
    question: 'Is Cavos a drop-in replacement for Turnkey?',
    answer:
      'No. They sit at different layers. Turnkey is a signing API with remote enclaves, policy, and server-side signing. Cavos is a finished embedded wallet SDK: auth, a device-native account, recovery, and Gas Sponsorship in Any Token. Wallet addresses are derived differently, so accounts do not transfer as a config change.',
  },
  {
    question: 'Is Turnkey a competitor or a building block?',
    answer:
      'Mostly a building block. Teams frequently use Turnkey to build something similar to what Cavos or Privy ships as a product. The decision is usually build-versus-buy rather than a like-for-like SDK swap. Privy vs Turnkey is the same fork from the finished-product side.',
  },
  {
    question: 'What is the difference between Privy and Turnkey?',
    answer:
      'Privy is a finished embedded wallet and authentication product. Turnkey is key-management infrastructure: hardware-backed enclaves and a signing API you build a wallet on top of. The worked write-up is Privy vs Turnkey.',
  },
  {
    question: 'Who are Turnkey embedded wallet competitors?',
    answer:
      'If you want a finished embedded wallet instead of Turnkey’s signing infrastructure, the usual shortlist is Cavos, Privy, Dynamic, Web3Auth / MetaMask Embedded Wallets, and Magic. Privy is the closer finished-SDK comparison; Turnkey vs Privy is build-versus-buy. Cavos is the comparison when the product is on Starknet, Solana, or Stellar and the review requires a device-native key.',
  },
  {
    question: 'What is Turnkey vs Privy?',
    answer:
      'Turnkey vs Privy is the same layer split as Privy vs Turnkey. Privy is a finished auth and wallet product. Turnkey is enclave key-management infrastructure you build on. The worked write-up is Privy vs Turnkey; the Cavos one-to-one is Cavos vs Turnkey.',
  },
] as const

export const turnkeyAlternativesGuide: AlternativesGuide = {
  path: TURNKEY_ALTERNATIVES_PATH,
  title: TURNKEY_ALTERNATIVES_TITLE,
  description: TURNKEY_ALTERNATIVES_DESCRIPTION,
  h1: TURNKEY_ALTERNATIVES_H1,
  published: TURNKEY_ALTERNATIVES_PUBLISHED,
  modified: TURNKEY_ALTERNATIVES_MODIFIED,
  crumb: TURNKEY_ALTERNATIVES_CRUMB,
  jsonLdId: 'turnkey-alternatives-json-ld',
  introParagraphs: [
    [
      'Cavos, Privy, Dynamic, Web3Auth, and Magic are the five Turnkey alternatives and embedded wallet competitors compared here for an ',
      { href: '/embedded-wallet', label: 'embedded wallet' },
      '. Turnkey vs Privy is finished SDK versus enclave infrastructure.',
    ],
    [
      'The sections below use the same facts as the ',
      { href: '/compare', label: 'compare pages' },
      '. Cavos publishes its own fees on the ',
      { href: '/pricing', label: 'pricing page' },
      '; other vendors set theirs independently. If the question is a finished SDK versus key-management infrastructure, start with ',
      { href: '/compare/turnkey', label: 'Cavos vs Turnkey' },
      ' or ',
      { href: PRIVY_VS_TURNKEY_PATH, label: 'Privy vs Turnkey' },
      '. The replacement shortlist for Privy is ',
      { href: '/privy-alternatives', label: 'Privy alternatives' },
      '. Migration is a project, not a config change: wallet addresses are derived differently, so accounts do not transfer automatically.',
    ],
  ],
  whyLookHeading: 'Why teams look for a Turnkey alternative',
  whyLookIntro:
    'Turnkey is not the weaker product. It covers ground several of these alternatives do not, especially policy-driven server-side signing. Teams still shortlist replacements when they want a finished wallet SDK rather than infrastructure they assemble.',
  whyLook: TURNKEY_WHY_LOOK,
  comparedHeading: 'Turnkey alternatives and competitors',
  comparedIntro:
    'Cavos, Privy, Dynamic, Turnkey, Web3Auth / MetaMask Embedded Wallets, and Magic all ship an embedded wallet or the signing layer one is built on. They do not share a key model, the same native chain coverage, or the same pricing. Each name opens the full comparison except Cavos, which links to published fees.',
  sections: TURNKEY_ALTERNATIVE_SECTIONS,
  howToChooseHeading: 'How to choose a Turnkey alternative',
  howToChooseIntro:
    'Ask whether you are buying a wallet product or signing infrastructure first, then where the key lives, then which chains are native.',
  howToChoose: TURNKEY_HOW_TO_CHOOSE,
  howToChooseOutro: DEFAULT_HOW_TO_CHOOSE_OUTRO,
  stayHeading: 'When Turnkey is still the right choice',
  stayIntro:
    'Turnkey is the better pick when you are building a wallet or custody product on policy-driven enclaves. It is not the weaker product; it covers ground Cavos does not. Stay with Turnkey when the following are true.',
  chooseThem: turnkeyChooseThem,
  faq: TURNKEY_ALTERNATIVES_FAQ,
  itemListName: 'Turnkey alternatives',
}
