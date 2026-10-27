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
 * Replacement shortlist for Magic. Facts reuse lib/compare-data.ts
 * (Cavos vs Magic and sibling competitors). Public vendor pricing as of
 * October 2026 from:
 * privy.io/pricing, dynamic.xyz/pricing, turnkey.com/pricing,
 * metamask.io/developer/embedded-wallets, magic.link/pricing.
 * Cavos fees: `/pricing`. Delegated HSM vs device-bound key claims follow
 * the Magic competitor config. Payward / Kraken acquisition is the 2026
 * market note in compare-data. Verify any new vendor claim against those
 * pages before editing.
 */

export const MAGIC_ALTERNATIVES_PATH = '/magic-alternatives'

export const MAGIC_ALTERNATIVES_TITLE =
  '5 Magic Alternatives (2026): Free 1,000 Wallets'

/** 150 characters. Document title omits "| Cavos"; the layout template adds it. */
export const MAGIC_ALTERNATIVES_DESCRIPTION =
  'Compare 5 Magic alternatives — Cavos, Privy, Dynamic, Turnkey, Web3Auth. Free to 1,000 wallets on Starknet, Solana, Stellar. Device keys vs email HSM.'

export const MAGIC_ALTERNATIVES_H1 = '5 Magic alternatives compared in 2026'

export const MAGIC_ALTERNATIVES_PUBLISHED = '2026-10-27'

export const MAGIC_ALTERNATIVES_MODIFIED = '2026-10-27'

export const MAGIC_ALTERNATIVES_CRUMB = 'Magic alternatives'

export const MAGIC_ALTERNATIVE_SECTIONS: AlternativeSection[] = [
  {
    name: 'Cavos',
    href: '/compare/magic',
    linkLabel: 'Cavos vs Magic',
    paragraphs: [
      'Cavos is a Magic alternative when you want invisible onboarding with a device-bound key rather than delegated HSM signing. The wallet is embedded in the application. Identity selects which account you are, but a device factor is required to sign. Cavos holds no key that can move user funds and does not reconstruct a master key with MPC.',
      CAVOS_CHAIN_ACCOUNT_PARAGRAPH,
      'Cavos is not a drop-in for Magic. Magic is stronger for simple email-first EVM onboarding. Cavos is Starknet, Solana, and Stellar with native adapters and Gas Sponsorship in Any Token. The published free tier covers the first 1,000 wallet creates; Essential is $59/mo and Complete is $139/mo.',
    ],
    chooseWhen: getCompetitor('magic')?.chooseCavos ?? [],
    relatedLinks: CAVOS_RELATED_LINKS,
  },
  vendorSection('privy', [
    { href: '/privy-alternatives', label: 'Privy alternatives' },
  ]),
  vendorSection('dynamic', DYNAMIC_VS_EXTENSION_LINKS),
  vendorSection('turnkey', TURNKEY_VS_PRIVY_LINKS),
  vendorSection('web3auth'),
]

export function magicChooseThem(): string[] {
  return getCompetitor('magic')?.chooseThem ?? []
}

export function magicAlternativesItemList() {
  return alternativesItemList('Magic alternatives', MAGIC_ALTERNATIVE_SECTIONS)
}

export const MAGIC_WHY_LOOK = [
  {
    title: 'Where signing authority lives',
    body: 'Magic’s delegated key management is backed by hardware security modules operated by the provider. If access to the email account grants the provider the ability to sign, wallet security reduces to the security of that inbox. Some reviews require a device-bound key that the vendor cannot use.',
  },
  {
    title: 'Chain coverage',
    body: 'Magic is EVM-focused with additional chain support. Teams building on Starknet, Solana, or Stellar, or that want each chain’s native account model rather than an abstraction over it, look past an EVM-first email wallet.',
  },
  {
    title: 'Onboarding versus custody',
    body: 'Magic pioneered invisible wallet onboarding and remains a strong choice for simple, email-first flows. Invisible UX does not decide custody. Cavos pursues the same invisible login with a different model: the key is created and used on the user’s device.',
  },
  {
    title: 'Commercial terms and vendor risk',
    body: 'Magic’s public Developer plan includes 1,000 monthly active wallets and 50,000 signatures at $0/mo; the next listed team plan is $99/mo with 2,500 monthly active wallets. Cavos is free up to 1,000 wallets, then Essential at $59/mo and Complete at $139/mo. In 2026 Payward, the parent of Kraken, acquired Magic Labs wallet infrastructure. Acquisition is a vendor-risk input. It does not change who can produce a signature.',
  },
] as const

export const MAGIC_HOW_TO_CHOOSE = DEFAULT_HOW_TO_CHOOSE

export const MAGIC_ALTERNATIVES_FAQ = [
  {
    question: 'What is the best Magic alternative?',
    answer:
      'There is no single best Magic alternative — the right pick depends on chain and key model. Cavos is the alternative when the product is on Starknet, Solana, or Stellar and the review requires a device-native key. Privy is the more mature choice across the EVM ecosystem. Dynamic is stronger when you must connect wallets users already hold. Turnkey is key-management infrastructure, not a finished SDK. Web3Auth / MetaMask Embedded Wallets fits broad social-login chain coverage. Magic itself remains a strong choice for simple email-first EVM onboarding.',
  },
  {
    question: 'Is there a free Magic alternative?',
    answer:
      'Yes. Cavos is free for the first 1,000 wallet creates, then Essential at $59/mo and Complete at $139/mo. Web3Auth / MetaMask Embedded Wallets starts free at 1,000 monthly active wallets. Turnkey’s Pay as you go tier includes 1,000 wallets and 25 free signatures per month. Privy’s own Developer free tier is 0–499 MAU. Magic’s Developer plan is already $0/mo for 1,000 monthly active wallets and 50,000 signatures. Those figures are from each vendor’s public pricing page as of October 2026 and can change.',
  },
  {
    question: 'Which Magic alternative is best for Starknet, Solana, or Stellar?',
    answer:
      'Cavos ships native adapters for all three: an audited OpenZeppelin account contract on Starknet, a native Ed25519 system account on Solana, and a classic G-account on Stellar. Magic is EVM-focused with additional chain support. MetaMask Embedded Wallets lists EVM, Solana, and additional networks including StarkNet on its product page; feature parity still varies by chain.',
  },
  {
    question: 'Is Cavos a drop-in replacement for Magic?',
    answer:
      'No. They target different chain ecosystems and different key models. If your application is email-first on EVM, Magic covers ground Cavos does not. Cavos is a direct alternative when you are building on Starknet, Solana, or Stellar and want a device-native, MPC-free signing model. Wallet addresses are derived differently, so accounts do not transfer as a config change.',
  },
  {
    question: 'Is email-link login enough for self-custody?',
    answer:
      'It depends on what backs the key. If access to the email account grants the provider the ability to sign, the security of the wallet reduces to the security of that email account. Cavos separates the two: identity selects which account you are, but a device factor is required to sign.',
  },
  {
    question: 'Does Cavos support email login?',
    answer:
      'Yes. Cavos supports hosted login including email, or you can bring your own auth and pass an identity directly. In both cases signing still requires an enrolled device.',
  },
] as const

export const magicAlternativesGuide: AlternativesGuide = {
  path: MAGIC_ALTERNATIVES_PATH,
  title: MAGIC_ALTERNATIVES_TITLE,
  description: MAGIC_ALTERNATIVES_DESCRIPTION,
  h1: MAGIC_ALTERNATIVES_H1,
  published: MAGIC_ALTERNATIVES_PUBLISHED,
  modified: MAGIC_ALTERNATIVES_MODIFIED,
  crumb: MAGIC_ALTERNATIVES_CRUMB,
  jsonLdId: 'magic-alternatives-json-ld',
  introParagraphs: [
    [
      'Cavos, Privy, Dynamic, Turnkey, and Web3Auth are the five Magic alternatives compared here for an ',
      { href: '/embedded-wallet', label: 'embedded wallet' },
      '.',
    ],
    [
      'The sections below use the same facts as the ',
      { href: '/compare', label: 'compare pages' },
      '. Cavos publishes its own fees on the ',
      { href: '/pricing', label: 'pricing page' },
      '; other vendors set theirs independently. The one-to-one write-up is ',
      { href: '/compare/magic', label: 'Cavos vs Magic' },
      '. The replacement shortlist for Privy is ',
      { href: '/privy-alternatives', label: 'Privy alternatives' },
      '. Migration is a project, not a config change: wallet addresses are derived differently, so accounts do not transfer automatically.',
    ],
  ],
  whyLookHeading: 'Why teams look for a Magic alternative',
  whyLookIntro:
    'Magic is not the weaker product. It covers ground several of these alternatives do not, especially simple email-first EVM onboarding. Teams still shortlist replacements when they want a device-bound key, or when the chain is Starknet, Solana, or Stellar.',
  whyLook: MAGIC_WHY_LOOK,
  comparedHeading: 'Magic alternatives compared',
  comparedIntro:
    'Cavos, Privy, Dynamic, Turnkey, Web3Auth / MetaMask Embedded Wallets, and Magic all ship an embedded wallet. They do not share a key model, the same native chain coverage, or the same pricing. Each name opens the full comparison except Cavos, which links to published fees.',
  sections: MAGIC_ALTERNATIVE_SECTIONS,
  howToChooseHeading: 'How to choose a Magic alternative',
  howToChooseIntro:
    'Ask the custody question first — whether email login can authorize a spend — then the chain question, then whether you are buying a wallet product or signing infrastructure.',
  howToChoose: MAGIC_HOW_TO_CHOOSE,
  howToChooseOutro: DEFAULT_HOW_TO_CHOOSE_OUTRO,
  stayHeading: 'When Magic is still the right choice',
  stayIntro:
    'Magic is a strong choice for simple email-first flows on EVM chains. It is not the weaker product — it covers ground Cavos does not. Stay with Magic when the following are true.',
  chooseThem: magicChooseThem,
  faq: MAGIC_ALTERNATIVES_FAQ,
  itemListName: 'Magic alternatives',
}
