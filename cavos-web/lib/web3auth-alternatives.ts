import {
  CAVOS_CHAIN_ACCOUNT_PARAGRAPH,
  CAVOS_RELATED_LINKS,
  DEFAULT_HOW_TO_CHOOSE,
  DEFAULT_HOW_TO_CHOOSE_OUTRO,
  DYNAMIC_VS_EXTENSION_LINKS,
  TURNKEY_VS_PRIVY_LINKS,
  type AlternativesGuide,
  type AlternativeSection,
  alternativesItemList,
  vendorSection,
} from './alternatives-guide'
import { getCompetitor } from './compare-data'

/**
 * Replacement shortlist for Web3Auth / MetaMask Embedded Wallets. Facts reuse
 * lib/compare-data.ts (Web3Auth vs Cavos and sibling competitors). Public
 * vendor pricing as of October 2026 from:
 * privy.io/pricing, dynamic.xyz/pricing, turnkey.com/pricing,
 * metamask.io/developer/embedded-wallets, magic.link/pricing.
 * Cavos fees: `/pricing`. MPC share reconstruction vs device-native key
 * claims follow the Web3Auth competitor config. Consensys acquired Web3Auth
 * in 2025 and ships it as MetaMask Embedded Wallets. Verify any new vendor
 * claim against those pages before editing.
 */

export const WEB3AUTH_ALTERNATIVES_PATH = '/web3auth-alternatives'

export const WEB3AUTH_ALTERNATIVES_TITLE =
  '5 Web3Auth Alternatives (2026): Free 1,000 Wallets'

/** 142 characters. Document title omits "| Cavos"; the layout template adds it. */
export const WEB3AUTH_ALTERNATIVES_DESCRIPTION =
  'Web3Auth alternatives, Web3Auth competitors, and MetaMask Embedded Wallet alternatives: Cavos, Privy, Dynamic, Turnkey. Free to 1,000 wallets.'

export const WEB3AUTH_ALTERNATIVES_H1 =
  '5 Web3Auth alternatives compared in 2026'

export const WEB3AUTH_ALTERNATIVES_PUBLISHED = '2026-11-06'

export const WEB3AUTH_ALTERNATIVES_MODIFIED = '2026-11-06'

export const WEB3AUTH_ALTERNATIVES_CRUMB = 'Web3Auth alternatives'

export const WEB3AUTH_ALTERNATIVE_SECTIONS: AlternativeSection[] = [
  {
    name: 'Cavos',
    href: '/compare/web3auth',
    linkLabel: 'Web3Auth vs Cavos',
    paragraphs: [
      'Cavos is a Web3Auth alternative, and a MetaMask Embedded Wallets alternative, when the security review requires a device-native key. The wallet is embedded in the application. Signing authority is a non-exportable device key: keys never leave the device in plaintext, signing happens on the device, and Cavos holds no key that can move user funds. Cavos does not reconstruct a master key with MPC and cannot decrypt the MasterDEK. Recovery is a synced passkey or opt-in hardware-isolated restore in an AWS Nitro Enclave.',
      CAVOS_CHAIN_ACCOUNT_PARAGRAPH,
      'Cavos is not a drop-in for Web3Auth. MetaMask Embedded Wallets is stronger for very broad social-login chain coverage and a key you can export. Cavos is Starknet, Solana, and Stellar with native adapters and Gas Sponsorship in Any Token (USDC is one example). The published free tier covers the first 1,000 wallet creates; Essential is $59/mo and Complete is $139/mo.',
    ],
    chooseWhen: getCompetitor('web3auth')?.chooseCavos ?? [],
    relatedLinks: CAVOS_RELATED_LINKS,
  },
  vendorSection('privy', [
    { href: '/privy-alternatives', label: 'Privy alternatives' },
  ]),
  vendorSection('dynamic', [
    ...DYNAMIC_VS_EXTENSION_LINKS,
    { href: '/dynamic-alternatives', label: 'Dynamic alternatives' },
  ]),
  vendorSection('turnkey', [
    ...TURNKEY_VS_PRIVY_LINKS,
    { href: '/turnkey-alternatives', label: 'Turnkey alternatives' },
  ]),
  vendorSection('magic', [
    { href: '/magic-alternatives', label: 'Magic alternatives' },
    { href: '/dfns-alternatives', label: 'Dfns alternatives' },
  ]),
]

export function web3authChooseThem(): string[] {
  return getCompetitor('web3auth')?.chooseThem ?? []
}

export function web3authAlternativesItemList() {
  return alternativesItemList(
    'Web3Auth alternatives',
    WEB3AUTH_ALTERNATIVE_SECTIONS,
  )
}

export const WEB3AUTH_WHY_LOOK = [
  {
    title: 'Where signing authority lives',
    body: 'Web3Auth / MetaMask Embedded Wallets splits key shares across the user’s device, the provider’s network, and recovery factors. Signing reconstructs or jointly computes a signature from those shares. Some reviews require a device-native key that the vendor cannot help produce a signature with. That is a different architecture, not a smaller feature set.',
  },
  {
    title: 'Key export versus restore',
    body: 'MetaMask’s product page states that Embedded Wallets use MPC with threshold signatures and Shamir’s Secret Sharing, and that export is part of the model. Cavos restores the MasterDEK on a new device. It does not advertise a seed or private-key export.',
  },
  {
    title: 'Chain coverage',
    body: 'MetaMask Embedded Wallets lists native support for EVM and Solana, plus additional networks including Bitcoin and StarkNet. Feature parity still varies by chain. Teams that want each chain’s native account model on Starknet, Solana, and Stellar, rather than a social-login wallet layer, look past that breadth.',
  },
  {
    title: 'Commercial terms and vendor risk',
    body: 'Web3Auth / MetaMask Embedded Wallets starts free at 1,000 monthly active wallets. Growth is $69/mo. Scale is $399/mo. Cavos is free up to 1,000 wallets, then Essential at $59/mo and Complete at $139/mo. Consensys acquired Web3Auth in 2025 and now ships it as MetaMask Embedded Wallets. Acquisition is a vendor-risk input. It does not change who can produce a signature.',
  },
] as const

export const WEB3AUTH_HOW_TO_CHOOSE = DEFAULT_HOW_TO_CHOOSE

export const WEB3AUTH_ALTERNATIVES_FAQ = [
  {
    question: 'What is the best Web3Auth alternative?',
    answer:
      'There is no single best Web3Auth alternative. The right pick depends on chain and key model. Cavos is the alternative when the product is on Starknet, Solana, or Stellar and the review requires a device-native key. Privy is the more mature finished SDK across EVM. Dynamic is stronger when you must connect wallets users already hold. Turnkey is key-management infrastructure, not a finished SDK. Magic fits simple email-first EVM onboarding. Web3Auth / MetaMask Embedded Wallets itself remains a strong pick for broad social-login chain coverage and a key you can export.',
  },
  {
    question: 'Is there a free Web3Auth alternative?',
    answer:
      'Yes. Cavos is free for the first 1,000 wallet creates, then Essential at $59/mo and Complete at $139/mo. Magic’s Developer plan includes 1,000 monthly active wallets and 50,000 signatures at $0/mo. Turnkey’s Pay as you go tier includes 1,000 wallets and 25 free signatures per month. Privy’s own Developer free tier is 0–499 MAU. Web3Auth / MetaMask Embedded Wallets already starts free at 1,000 monthly active wallets. Those figures are from each vendor’s public pricing page as of October 2026 and can change.',
  },
  {
    question: 'Which Web3Auth alternative is best for Starknet, Solana, or Stellar?',
    answer:
      'Cavos ships native adapters for all three: an audited OpenZeppelin account contract on Starknet, a native Ed25519 system account on Solana, and a classic G-account on Stellar. The OpenZeppelin audit covers that contract, not Cavos. MetaMask Embedded Wallets lists EVM, Solana, and additional networks including StarkNet on its product page; feature parity still varies by chain.',
  },
  {
    question: 'Is Cavos a drop-in replacement for Web3Auth?',
    answer:
      'No. They sit on different key models. Web3Auth / MetaMask Embedded Wallets is a social-login MPC wallet layer with broad chain coverage and key export. Cavos is a finished embedded wallet SDK: auth, a device-native account, passkey or Nitro Enclave sealed restore, and Gas Sponsorship in Any Token on Starknet, Solana, and Stellar. Wallet addresses are derived differently, so accounts do not transfer as a config change.',
  },
  {
    question: 'Is Web3Auth the same as MetaMask Embedded Wallets?',
    answer:
      'Yes. Consensys acquired Web3Auth in 2025 and now ships it as MetaMask Embedded Wallets. This page is the shortlist for Web3Auth alternatives, Web3Auth competitors, and MetaMask Embedded Wallet alternatives. The one-to-one is Web3Auth vs Cavos.',
  },
  {
    question: 'What are MetaMask Embedded Wallet alternatives?',
    answer:
      'Cavos, Privy, Dynamic, Turnkey, and Magic are the five MetaMask Embedded Wallet alternatives compared here. They are also the usual Web3Auth competitors. Cavos fits Starknet, Solana, or Stellar with a device-native key. Privy is the closer finished-SDK comparison on EVM. Dynamic fits connecting wallets users already hold. Turnkey is signing infrastructure. Magic fits email-first EVM onboarding.',
  },
  {
    question: 'Who are Web3Auth competitors?',
    answer:
      'If you want an embedded wallet instead of Web3Auth / MetaMask Embedded Wallets, the usual shortlist is Cavos, Privy, Dynamic, Turnkey, and Magic. Cavos is the comparison when the product is on Starknet, Solana, or Stellar and the review requires a device-native key. Privy is the closer finished-SDK comparison on EVM. The one-to-one is Web3Auth vs Cavos.',
  },
] as const

export const web3authAlternativesGuide: AlternativesGuide = {
  path: WEB3AUTH_ALTERNATIVES_PATH,
  title: WEB3AUTH_ALTERNATIVES_TITLE,
  description: WEB3AUTH_ALTERNATIVES_DESCRIPTION,
  h1: WEB3AUTH_ALTERNATIVES_H1,
  published: WEB3AUTH_ALTERNATIVES_PUBLISHED,
  modified: WEB3AUTH_ALTERNATIVES_MODIFIED,
  crumb: WEB3AUTH_ALTERNATIVES_CRUMB,
  jsonLdId: 'web3auth-alternatives-json-ld',
  answerHeading: 'What are MetaMask Embedded Wallet alternatives? (November 2026)',
  answerParagraphs: [
    [
      'Cavos, Privy, Dynamic, Turnkey, and Magic are the five Web3Auth alternatives compared here. They are also the Web3Auth competitors and the usual MetaMask Embedded Wallet alternatives. Consensys acquired Web3Auth in 2025 and now ships it as MetaMask Embedded Wallets. This page is the shortlist. The one-to-one is ',
      { href: '/compare/web3auth', label: 'Web3Auth vs Cavos' },
      '.',
    ],
    [
      'Cavos fits Starknet, Solana, or Stellar with a device-native key: hardware-isolated, non-custodial, passkey or Nitro Enclave sealed restore, keys never leaving the device in plaintext. Privy is the more mature finished SDK across EVM. Dynamic fits connecting wallets users already hold. Turnkey is signing infrastructure. Magic fits email-first EVM onboarding. Web3Auth / MetaMask Embedded Wallets remains a strong pick for broad social-login chain coverage and a key you can export.',
    ],
  ],
  introParagraphs: [
    [
      'Cavos, Privy, Dynamic, Turnkey, and Magic are the five Web3Auth alternatives compared here for an ',
      { href: '/embedded-wallet', label: 'embedded wallet' },
      '. They are also Web3Auth competitors and MetaMask Embedded Wallet alternatives. MetaMask Embedded Wallets is the current name for Web3Auth after the 2025 Consensys acquisition.',
    ],
    [
      'The sections below use the same facts as the ',
      { href: '/compare', label: 'compare pages' },
      '. Cavos publishes its own fees on the ',
      { href: '/pricing', label: 'pricing page' },
      '; other vendors set theirs independently. The one-to-one write-up is ',
      { href: '/compare/web3auth', label: 'Web3Auth vs Cavos' },
      '. Replacement shortlists also exist for ',
      { href: '/privy-alternatives', label: 'Privy' },
      ', ',
      { href: '/turnkey-alternatives', label: 'Turnkey' },
      ', ',
      { href: '/dynamic-alternatives', label: 'Dynamic' },
      ', ',
      { href: '/magic-alternatives', label: 'Magic' },
      ', ',
      { href: '/para-alternatives', label: 'Para' },
      ', and ',
      { href: '/dfns-alternatives', label: 'Dfns' },
      '. Migration is a project, not a config change: wallet addresses are derived differently, so accounts do not transfer automatically.',
    ],
  ],
  whyLookHeading: 'Why teams look for a Web3Auth alternative',
  whyLookIntro:
    'Web3Auth / MetaMask Embedded Wallets is not the weaker product. It covers ground several of these alternatives do not, especially broad social-login chain coverage and key export. Teams still shortlist replacements when they want a device-native key, or when the chain is Starknet, Solana, or Stellar with a native account model.',
  whyLook: WEB3AUTH_WHY_LOOK,
  comparedHeading: 'Web3Auth alternatives and competitors',
  comparedIntro:
    'Cavos, Privy, Dynamic, Turnkey, Web3Auth / MetaMask Embedded Wallets, and Magic all ship an embedded wallet. They do not share a key model, the same native chain coverage, or the same pricing. Each name opens the full comparison except Cavos, which links to published fees.',
  sections: WEB3AUTH_ALTERNATIVE_SECTIONS,
  howToChooseHeading: 'How to choose a Web3Auth alternative',
  howToChooseIntro:
    'Ask the custody question first (whether a provider network share participates in reconstruction), then the chain question, then whether you are buying a wallet product or signing infrastructure.',
  howToChoose: WEB3AUTH_HOW_TO_CHOOSE,
  howToChooseOutro: DEFAULT_HOW_TO_CHOOSE_OUTRO,
  stayHeading: 'When Web3Auth is still the right choice',
  stayIntro:
    'Web3Auth / MetaMask Embedded Wallets is a strong pick for broad social-login chain coverage and a key you can export. It is not the weaker product; it covers ground Cavos does not. Stay with Web3Auth when the following are true.',
  chooseThem: web3authChooseThem,
  faq: WEB3AUTH_ALTERNATIVES_FAQ,
  itemListName: 'Web3Auth alternatives',
}
