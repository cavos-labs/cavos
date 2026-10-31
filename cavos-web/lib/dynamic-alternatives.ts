import {
  CAVOS_CHAIN_ACCOUNT_PARAGRAPH,
  CAVOS_RELATED_LINKS,
  DEFAULT_HOW_TO_CHOOSE,
  DEFAULT_HOW_TO_CHOOSE_OUTRO,
  TURNKEY_VS_PRIVY_LINKS,
  type AlternativesGuide,
  type AlternativeSection,
  alternativesItemList,
  vendorSection,
} from './alternatives-guide'
import { getCompetitor } from './compare-data'

/**
 * Replacement shortlist for Dynamic. Facts reuse lib/compare-data.ts
 * (Cavos vs Dynamic and sibling competitors). Public vendor pricing as of
 * October 2026 from:
 * privy.io/pricing, dynamic.xyz/pricing, turnkey.com/pricing,
 * metamask.io/developer/embedded-wallets, magic.link/pricing.
 * Cavos fees: `/pricing`. Connect-versus-provision claims follow the Dynamic
 * competitor config. TSS-MPC as a plan feature is from Dynamic’s public
 * pricing page as cited on /privy-alternatives. Verify any new vendor claim
 * against those pages before editing.
 */

export const DYNAMIC_ALTERNATIVES_PATH = '/dynamic-alternatives'

export const DYNAMIC_ALTERNATIVES_TITLE =
  '5 Dynamic Alternatives (2026): Free 1,000 Wallets'

/** 153 characters. Document title omits "| Cavos"; the layout template adds it. */
export const DYNAMIC_ALTERNATIVES_DESCRIPTION =
  'Compare 5 Dynamic alternatives: Cavos, Privy, Turnkey, Web3Auth, Magic. Free to 1,000 wallets on Starknet, Solana, Stellar. Provision vs wallet connect.'

export const DYNAMIC_ALTERNATIVES_H1 = '5 Dynamic alternatives compared in 2026'

export const DYNAMIC_ALTERNATIVES_PUBLISHED = '2026-10-27'

export const DYNAMIC_ALTERNATIVES_MODIFIED = '2026-10-31'

export const DYNAMIC_ALTERNATIVES_CRUMB = 'Dynamic alternatives'

export const DYNAMIC_ALTERNATIVE_SECTIONS: AlternativeSection[] = [
  {
    name: 'Cavos',
    href: '/compare/dynamic',
    linkLabel: 'Cavos vs Dynamic',
    paragraphs: [
      'Cavos is a Dynamic alternative when users should never see a wallet picker and the product is on Starknet, Solana, or Stellar. Cavos provisions the wallet rather than connecting to one the user already holds. Signing authority is a non-exportable device key: Cavos holds no key that can move user funds and does not reconstruct a master key with MPC.',
      CAVOS_CHAIN_ACCOUNT_PARAGRAPH,
      'Cavos is not a drop-in for Dynamic. It does not connect existing extensions, and it is not an EVM-wide wallet layer. The two models can coexist in one product. Gas Sponsorship in Any Token is on every plan. The published free tier covers the first 1,000 wallet creates; Essential is $59/mo and Complete is $139/mo.',
    ],
    chooseWhen: getCompetitor('dynamic')?.chooseCavos ?? [],
    relatedLinks: CAVOS_RELATED_LINKS,
  },
  vendorSection('privy', [
    { href: '/privy-alternatives', label: 'Privy alternatives' },
  ]),
  vendorSection('turnkey', TURNKEY_VS_PRIVY_LINKS),
  vendorSection('web3auth'),
  vendorSection('magic'),
]

export function dynamicChooseThem(): string[] {
  return getCompetitor('dynamic')?.chooseThem ?? []
}

export function dynamicAlternativesItemList() {
  return alternativesItemList('Dynamic alternatives', DYNAMIC_ALTERNATIVE_SECTIONS)
}

export const DYNAMIC_WHY_LOOK = [
  {
    title: 'Connect versus provision',
    body: 'Dynamic is strongest as a unified login and wallet-connection layer covering many wallets and chains. Connecting existing external wallets is a core capability. That is extra surface area when the product should never show a wallet picker and should only provision new accounts.',
  },
  {
    title: 'Who the user is',
    body: 'Dynamic serves crypto-native connection flows alongside embedded wallets. Teams whose users are not crypto-native, and should sign in with an identity the product already owns, look for a provision-only SDK.',
  },
  {
    title: 'Chain coverage',
    body: 'Dynamic is multi-chain, with EVM breadth and additional non-EVM support; parity varies by chain. Teams building on Starknet or Stellar, or that want each chain’s native account model rather than an abstraction over it, look past an EVM-first connection layer.',
  },
  {
    title: 'Commercial terms and vendor risk',
    body: 'Dynamic’s public Growth plan is $249/mo for up to 5,000 monthly active users, then $0.05 per extra MAU, with a free sandbox. Cavos is free up to 1,000 wallets, then Essential at $59/mo and Complete at $139/mo. Fireblocks acquired Dynamic in 2025. Acquisition is a vendor-risk input. It does not change who can produce a signature.',
  },
] as const

export const DYNAMIC_HOW_TO_CHOOSE = DEFAULT_HOW_TO_CHOOSE

export const DYNAMIC_ALTERNATIVES_FAQ = [
  {
    question: 'What is the best Dynamic alternative?',
    answer:
      'There is no single best Dynamic alternative. The right pick depends on whether you must connect wallets users already hold. Cavos is the alternative when the product is on Starknet, Solana, or Stellar and users should never see a wallet picker. Privy is the more mature choice across EVM when you still want embedded wallets plus connectors. Turnkey is key-management infrastructure, not a finished SDK. Web3Auth / MetaMask Embedded Wallets fits broad social-login chain coverage. Magic fits simple email-first EVM onboarding. Dynamic itself remains the better pick for multi-wallet login.',
  },
  {
    question: 'Is there a free Dynamic alternative?',
    answer:
      'Yes. Cavos is free for the first 1,000 wallet creates, then Essential at $59/mo and Complete at $139/mo. Web3Auth / MetaMask Embedded Wallets starts free at 1,000 monthly active wallets. Magic’s Developer plan includes 1,000 monthly active wallets and 50,000 signatures at $0/mo. Turnkey’s Pay as you go tier includes 1,000 wallets and 25 free signatures per month. Privy’s own Developer free tier is 0–499 MAU. Dynamic’s sandbox is free; the public Growth plan starts at $249/mo. Those figures are from each vendor’s public pricing page as of October 2026 and can change.',
  },
  {
    question: 'Which Dynamic alternative is best for Starknet, Solana, or Stellar?',
    answer:
      'Cavos ships native adapters for all three: an audited OpenZeppelin account contract on Starknet, a native Ed25519 system account on Solana, and a classic G-account on Stellar. Dynamic is multi-chain, with EVM breadth and additional non-EVM support; parity varies by chain. MetaMask Embedded Wallets lists EVM, Solana, and additional networks including StarkNet on its product page.',
  },
  {
    question: 'Is Cavos a drop-in replacement for Dynamic?',
    answer:
      'No. Dynamic connects existing wallets and embeds new ones. Cavos only provisions a device-native account. If connecting MetaMask or WalletConnect is a requirement, Dynamic (or Privy) is the better fit, and the two models can coexist in one product. Wallet addresses are derived differently, so accounts do not transfer as a config change.',
  },
  {
    question: 'Does Cavos support connecting existing wallets like MetaMask?',
    answer:
      'No. Cavos provisions and controls an embedded, device-native account for each user. If connecting existing external wallets is a requirement, a connection-focused provider such as Dynamic is the better fit.',
  },
  {
    question: 'Which is better for non-crypto users?',
    answer:
      'Cavos is designed so a user never selects a wallet: they sign in with an identity you already own and a self-custodial account is resolved. Dynamic can also hide this, but its surface area is broader because it also serves crypto-native connection flows.',
  },
] as const

export const dynamicAlternativesGuide: AlternativesGuide = {
  path: DYNAMIC_ALTERNATIVES_PATH,
  title: DYNAMIC_ALTERNATIVES_TITLE,
  description: DYNAMIC_ALTERNATIVES_DESCRIPTION,
  h1: DYNAMIC_ALTERNATIVES_H1,
  published: DYNAMIC_ALTERNATIVES_PUBLISHED,
  modified: DYNAMIC_ALTERNATIVES_MODIFIED,
  crumb: DYNAMIC_ALTERNATIVES_CRUMB,
  jsonLdId: 'dynamic-alternatives-json-ld',
  introParagraphs: [
    [
      'Cavos, Privy, Turnkey, Web3Auth, and Magic are the five Dynamic alternatives compared here for an ',
      { href: '/embedded-wallet', label: 'embedded wallet' },
      '.',
    ],
    [
      'The sections below use the same facts as the ',
      { href: '/compare', label: 'compare pages' },
      '. Cavos publishes its own fees on the ',
      { href: '/pricing', label: 'pricing page' },
      '; other vendors set theirs independently. The one-to-one write-up is ',
      { href: '/compare/dynamic', label: 'Cavos vs Dynamic' },
      '. The replacement shortlist for Privy is ',
      { href: '/privy-alternatives', label: 'Privy alternatives' },
      '. Migration is a project, not a config change: wallet addresses are derived differently, so accounts do not transfer automatically.',
    ],
  ],
  whyLookHeading: 'Why teams look for a Dynamic alternative',
  whyLookIntro:
    'Dynamic is not the weaker product. It covers ground several of these alternatives do not, especially multi-wallet login. Teams still shortlist replacements when they only need to provision new accounts, or when the chain is not an EVM connection layer.',
  whyLook: DYNAMIC_WHY_LOOK,
  comparedHeading: 'Dynamic alternatives compared',
  comparedIntro:
    'Cavos, Privy, Dynamic, Turnkey, Web3Auth / MetaMask Embedded Wallets, and Magic all ship an embedded wallet. They do not share a key model, the same native chain coverage, or the same pricing. Each name opens the full comparison except Cavos, which links to published fees.',
  sections: DYNAMIC_ALTERNATIVE_SECTIONS,
  howToChooseHeading: 'How to choose a Dynamic alternative',
  howToChooseIntro:
    'Ask whether you must connect wallets users already hold first, then the custody question, then which chains are native.',
  howToChoose: DYNAMIC_HOW_TO_CHOOSE,
  howToChooseOutro: DEFAULT_HOW_TO_CHOOSE_OUTRO,
  stayHeading: 'When Dynamic is still the right choice',
  stayIntro:
    'Dynamic is the better pick when you need many external wallets alongside embedded ones in a single login flow. It is not the weaker product; it covers ground Cavos does not. Stay with Dynamic when the following are true.',
  chooseThem: dynamicChooseThem,
  faq: DYNAMIC_ALTERNATIVES_FAQ,
  itemListName: 'Dynamic alternatives',
}
