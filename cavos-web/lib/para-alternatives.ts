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
 * Replacement shortlist for Para (getpara.com, formerly Capsule). Facts from
 * Para public docs as of November 2026:
 * docs.getpara.com/v3/concepts/architecture,
 * docs.getpara.com/v3/concepts/key-management,
 * docs.getpara.com/v3/introduction/chain-support,
 * getpara.com/pricing.
 * Sibling vendor facts reuse lib/compare-data.ts. Cavos fees: `/pricing`.
 * This page is getpara.com the embedded wallet, not ParaSwap and not a
 * Cosmos app chain named Para. There is no Cavos vs Para compare page.
 */

export const PARA_ALTERNATIVES_PATH = '/para-alternatives'

export const PARA_ALTERNATIVES_TITLE =
  '5 Para Alternatives (2026): Free 1,000 Wallets'

/** 142 characters. Document title omits "| Cavos"; the layout template adds it. */
export const PARA_ALTERNATIVES_DESCRIPTION =
  'Para alternatives for getpara.com: Cavos, Privy, Dynamic, Turnkey, Web3Auth. Free to 1,000 wallets on Starknet, Solana, Stellar. Not ParaSwap.'

export const PARA_ALTERNATIVES_H1 = '5 Para alternatives compared in 2026'

export const PARA_ALTERNATIVES_PUBLISHED = '2026-11-02'

export const PARA_ALTERNATIVES_MODIFIED = '2026-11-06'

export const PARA_ALTERNATIVES_CRUMB = 'Para alternatives'

export const PARA_CHOOSE_THEM = [
  'You want a 2-of-2 MPC embedded wallet whose user share lives on the device and whose other share lives in Para HSMs.',
  'You need one wallet that Para documents as portable across apps, with email, social, or passkey login.',
  'You want EVM, Solana, Cosmos, and Stellar from one vendor, and you accept Para’s published chain-support table rather than a Starknet native adapter.',
  'You want Para’s drop-in modal, pregenerated wallets, or server-side flows, including the MPC path Para documents for signing without assembling the full key.',
] as const

export const PARA_ALTERNATIVE_SECTIONS: AlternativeSection[] = [
  {
    name: 'Cavos',
    href: '/compare',
    linkLabel: 'Compare providers',
    paragraphs: [
      'Cavos is a Para alternative when the product is on Starknet, Solana, or Stellar and the security review requires a device-native key. The wallet is embedded in the application. Signing authority is a non-exportable device key: Cavos holds no key that can move user funds and does not reconstruct a master key with MPC. Para’s public architecture docs describe a 2-of-2 MPC split: a user share on the device and a Para share in cloud HSMs.',
      CAVOS_CHAIN_ACCOUNT_PARAGRAPH,
      'Cavos is not a drop-in for Para. Para is stronger when you want a universal wallet across EVM, Solana, Cosmos, and Stellar, or a drop-in modal with pregenerated wallets. Cavos does not connect existing extensions and is not an EVM-wide wallet layer. The published free tier covers the first 1,000 wallet creates; Essential is $59/mo and Complete is $139/mo.',
    ],
    chooseWhen: getCompetitor('privy')?.chooseCavos ?? [],
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
  vendorSection('web3auth', [
    { href: '/magic-alternatives', label: 'Magic alternatives' },
    { href: '/web3auth-alternatives', label: 'Web3Auth alternatives' },
    { href: '/dfns-alternatives', label: 'Dfns alternatives' },
  ]),
]

export function paraChooseThem(): string[] {
  return [...PARA_CHOOSE_THEM]
}

export function paraAlternativesItemList() {
  return alternativesItemList('Para alternatives', PARA_ALTERNATIVE_SECTIONS)
}

export const PARA_WHY_LOOK = [
  {
    title: 'Where signing authority lives',
    body: 'Para’s public key-management docs describe a 2-of-2 MPC system (DKLS19): a user share on the device, protected by a passkey, and a Para share in cloud HSMs. Both shares join a signing ceremony; Para says the full private key is never assembled. Some reviews want a device-native key the vendor cannot help produce a signature with. That is a different architecture, not a smaller feature set.',
  },
  {
    title: 'Universal wallet versus one app',
    body: 'Para documents wallets that work across apps, chains, and platforms after one onboarding. That is extra surface area when the product should only provision an account inside one application and should never show a wallet that follows the user elsewhere.',
  },
  {
    title: 'Chain coverage',
    body: 'Para’s chain-support intro lists all EVM chains, Solana, Cosmos chains, Stellar, and Sui. The named table on that page lists EVM networks, Solana, Noble, Initia, Osmosis, and Stellar. The architecture page’s native-support table lists EVM, Solana, Stellar, and Cosmos via CosmJS. Teams shipping Starknet, or that want each chain’s native account model on Solana and Stellar without MPC, look past that table.',
  },
  {
    title: 'Commercial terms',
    body: 'Para’s public pricing page lists a Free plan up to 1,200 monthly active users, then Starter at $200/mo (2.5k MAUs), Growth at $500/mo (10k), and Scale at $1,000/mo (25k), with overage at $0.06, $0.05, and $0.04 per extra MAU. Cavos prices on wallet creates: free up to 1,000 wallets, Essential $59/mo, Complete $139/mo. Those figures are from each vendor’s public pricing page as of November 2026 and can change.',
  },
] as const

export const PARA_HOW_TO_CHOOSE = DEFAULT_HOW_TO_CHOOSE

export const PARA_ALTERNATIVES_FAQ = [
  {
    question: 'What is the best Para alternative?',
    answer:
      'There is no single best Para alternative. The right pick depends on chain and key model. Cavos is the alternative when the product is on Starknet, Solana, or Stellar and the review requires a device-native key. Privy is the more mature finished auth and wallet product across EVM. Dynamic is stronger when you must connect wallets users already hold. Turnkey is key-management infrastructure, not a finished SDK. Web3Auth / MetaMask Embedded Wallets fits broad social-login chain coverage. Para itself remains a strong pick for 2-of-2 MPC with a drop-in modal and a wallet Para documents as portable across apps.',
  },
  {
    question: 'Is there a free Para alternative?',
    answer:
      'Yes. Cavos is free for the first 1,000 wallet creates, then Essential at $59/mo and Complete at $139/mo. Web3Auth / MetaMask Embedded Wallets starts free at 1,000 monthly active wallets. Turnkey’s Pay as you go tier includes 1,000 wallets and 25 free signatures per month. Privy’s own Developer free tier is 0–499 MAU. Para’s public Free plan already covers up to 1,200 monthly active users. Those figures are from each vendor’s public pricing page as of November 2026 and can change.',
  },
  {
    question: 'Which Para alternative is best for Starknet, Solana, or Stellar?',
    answer:
      'Cavos ships native adapters for all three: an audited OpenZeppelin account contract on Starknet, a native Ed25519 system account on Solana, and a classic G-account on Stellar. Para’s named chain-support table lists Solana and Stellar; it does not list Starknet. MetaMask Embedded Wallets lists EVM, Solana, and additional networks including StarkNet on its product page; feature parity still varies by chain.',
  },
  {
    question: 'Is Cavos a drop-in replacement for Para?',
    answer:
      'No. Para is a 2-of-2 MPC embedded wallet with a drop-in modal, pregenerated wallets, and a wallet it documents as portable across apps. Cavos is a finished embedded wallet SDK: auth, a device-native account, recovery, and Gas Sponsorship in Any Token on Starknet, Solana, and Stellar. Wallet addresses are derived differently, so accounts do not transfer as a config change.',
  },
  {
    question: 'Is this page about ParaSwap or a Cosmos chain named Para?',
    answer:
      'No. This page is about Para the embedded wallet at getpara.com, formerly Capsule. ParaSwap and any Cosmos app chain that happens to share the name are different products.',
  },
  {
    question: 'Who are getpara.com competitors?',
    answer:
      'If you want an embedded wallet instead of Para’s 2-of-2 MPC stack, the usual shortlist is Cavos, Privy, Dynamic, Turnkey, and Web3Auth / MetaMask Embedded Wallets. Cavos is the comparison when the product is on Starknet, Solana, or Stellar and the review requires a device-native key. Privy is the closer finished-SDK comparison on EVM. There is no Cavos vs Para one-to-one page; start at compare.',
  },
  {
    question: 'Does Para support Sui, Aleo, or Midnight?',
    answer:
      'Para’s chain-support intro and public pricing FAQ mention Sui. The named table on the chain-support page lists EVM networks, Solana, Noble, Initia, Osmosis, and Stellar, and does not include a Sui, Aleo, or Midnight row. This page does not treat Sui as a named-table chain, and it does not claim Aleo or Midnight.',
  },
] as const

export const paraAlternativesGuide: AlternativesGuide = {
  path: PARA_ALTERNATIVES_PATH,
  title: PARA_ALTERNATIVES_TITLE,
  description: PARA_ALTERNATIVES_DESCRIPTION,
  h1: PARA_ALTERNATIVES_H1,
  published: PARA_ALTERNATIVES_PUBLISHED,
  modified: PARA_ALTERNATIVES_MODIFIED,
  crumb: PARA_ALTERNATIVES_CRUMB,
  jsonLdId: 'para-alternatives-json-ld',
  introParagraphs: [
    [
      'Cavos, Privy, Dynamic, Turnkey, and Web3Auth are the five Para alternatives compared here for the ',
      { href: '/embedded-wallet', label: 'embedded wallet' },
      ' at getpara.com, formerly Capsule. This page is that wallet, not ParaSwap the DEX aggregator, and not a Cosmos app chain that shares the name.',
    ],
    [
      'The sections below use the same facts as the ',
      { href: '/compare', label: 'compare pages' },
      '. Cavos publishes its own fees on the ',
      { href: '/pricing', label: 'pricing page' },
      '; other vendors set theirs independently. There is no Cavos vs Para one-to-one. Replacement shortlists also exist for ',
      { href: '/privy-alternatives', label: 'Privy' },
      ', ',
      { href: '/turnkey-alternatives', label: 'Turnkey' },
      ', ',
      { href: '/dynamic-alternatives', label: 'Dynamic' },
      ', ',
      { href: '/magic-alternatives', label: 'Magic' },
      ', ',
      { href: '/web3auth-alternatives', label: 'Web3Auth alternatives' },
      ', and ',
      { href: '/dfns-alternatives', label: 'Dfns alternatives' },
      '. Migration is a project, not a config change: wallet addresses are derived differently, so accounts do not transfer automatically.',
    ],
  ],
  whyLookHeading: 'Why teams look for a Para alternative',
  whyLookIntro:
    'Para is not the weaker product. It covers ground several of these alternatives do not, especially a 2-of-2 MPC wallet Para documents as portable across apps. Teams still shortlist replacements when they want a device-native key, or when the chain is Starknet. If the search was for ParaSwap, this page is the wrong product: start from getpara.com, not paraswap.io.',
  whyLook: PARA_WHY_LOOK,
  decisionHeading: 'Custody, pricing, and architecture across Para alternatives',
  decisionIntro: [
    'This table is the decision layer for Para alternatives (getpara.com, not ParaSwap): who can produce a signature, how the invoice is metered, and whether you are buying a portable MPC wallet or an in-app ',
    { href: '/embedded-wallet', label: 'embedded wallet' },
    ' SDK. Figures are from each vendor’s public docs and pricing pages as of November 2026 and can change. Cavos fees are on the ',
    { href: '/pricing', label: 'pricing' },
    ' page. Sibling shortlists: ',
    { href: '/privy-alternatives', label: 'Privy alternatives' },
    ', ',
    { href: '/turnkey-alternatives', label: 'Turnkey alternatives' },
    ', ',
    { href: '/dynamic-alternatives', label: 'Dynamic alternatives' },
    ', ',
    { href: '/magic-alternatives', label: 'Magic alternatives' },
    ', ',
    { href: '/web3auth-alternatives', label: 'Web3Auth alternatives' },
    ', and ',
    { href: '/dfns-alternatives', label: 'Dfns alternatives' },
    '.',
  ],
  decisionRows: [
    {
      point: 'Who can produce a signature',
      detail:
        'Para’s public key-management docs describe a 2-of-2 MPC split (DKLS19): a user share on the device, protected by a passkey, and a Para share in cloud HSMs. Both shares join a signing ceremony; Para says the full private key is never assembled. Privy’s public security docs describe a 2-of-2 Shamir split reconstituted only inside AWS Nitro Enclaves. Dynamic documents TSS-MPC (default 2-of-2). Turnkey decrypts a key only inside a TEE; custody is who can authorize that enclave. Web3Auth uses MPC with threshold signatures. Cavos is hardware-isolated and non-custodial: a non-exportable device key signs on the user’s device, Cavos holds no spend key, and recovery stores an encrypted copy of the master key for restore.',
    },
    {
      point: 'Pricing unit and published free tier',
      detail:
        'Para meters monthly active users: Free covers up to 1,200 MAUs, then Starter $200/mo (2.5k), Growth $500/mo (10k), and Scale $1,000/mo (25k), with overage at $0.06, $0.05, and $0.04 per extra MAU on the public page. Privy also meters MAUs: Developer free is 0–499 MAU with 50,000 signatures and $1M volume per month; Core is $299/mo and Scale is $499/mo. Dynamic meters MAUs: Growth is $249/mo for up to 5,000 MAUs and the sandbox is free; the extra-MAU rate is omitted because the public plan card and FAQ disagree. Turnkey meters signatures: Pay as you go includes 1,000 wallets and 25 free signatures per month, then $0.10 per signature; Pro is $99/mo. Web3Auth starts free at 1,000 monthly active wallets (Growth $69/mo, Scale $399/mo). Cavos meters wallet creates: free up to 1,000 wallets, Essential $59/mo, Complete $139/mo. Those figures are published list prices, not a quote.',
    },
    {
      point: 'Portable MPC wallet versus one-app provision',
      detail:
        'Para documents wallets that work across apps, chains, and platforms after one onboarding, with a drop-in modal and pregenerated wallets. That is extra surface area when the product should only provision an account inside one application. Privy, Dynamic, and Magic are finished embedded-wallet products; Dynamic also connects wallets users already hold. Turnkey and Dfns are signing infrastructure you build on. Cavos only provisions a hardware-isolated, non-custodial device-native account inside your app and does not connect existing extensions.',
    },
    {
      point: 'Native chains versus a compatibility layer',
      detail:
        'Para’s named chain-support table lists EVM networks, Solana, Noble, Initia, Osmosis, and Stellar. The intro also mentions Sui; this page does not treat Sui as a named-table chain. Privy’s published coverage is broad EVM plus Solana at managed send. Dynamic is multi-chain, with EVM breadth and additional non-EVM support; parity varies by chain. Turnkey is broad at the cryptographic-curve and signing-primitive level; you still assemble the wallet UX. MetaMask Embedded Wallets lists EVM, Solana, and additional networks including StarkNet. Cavos ships native adapters for Starknet (an audited OpenZeppelin account contract), Solana, and Stellar, and is not an EVM-wide wallet layer. Para does not list Starknet on that named table.',
    },
  ],
  comparedHeading: 'Para alternatives and getpara.com competitors',
  comparedIntro:
    'The table below is the same shortlist used on the other alternatives pages: Cavos, Privy, Dynamic, Turnkey, Web3Auth / MetaMask Embedded Wallets, and Magic. Para is the incumbent, summarized in the sections that follow. They do not share a key model, the same native chain coverage, or the same pricing. Each name opens the full comparison except Cavos, which links to published fees.',
  sections: PARA_ALTERNATIVE_SECTIONS,
  howToChooseHeading: 'How to choose a Para alternative',
  howToChooseIntro:
    'Ask the custody question first (whether a vendor HSM share participates in every signature), then the chain question, then whether you are buying a wallet product or signing infrastructure.',
  howToChoose: PARA_HOW_TO_CHOOSE,
  howToChooseOutro: DEFAULT_HOW_TO_CHOOSE_OUTRO,
  stayHeading: 'When Para is still the right choice',
  stayIntro:
    'Para is a strong pick when you want 2-of-2 MPC with a drop-in modal and a wallet it documents as portable across apps. It is not the weaker product; it covers ground Cavos does not. Stay with Para when the following are true.',
  chooseThem: paraChooseThem,
  faq: PARA_ALTERNATIVES_FAQ,
  itemListName: 'Para alternatives',
}
