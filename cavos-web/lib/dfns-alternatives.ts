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
import { PRIVY_VS_TURNKEY_PATH } from './embedded-wallet-guide'
import { getCompetitor } from './compare-data'

/**
 * Replacement shortlist for Dfns. Dfns is MPC/TSS wallet infrastructure, not a
 * finished embedded-wallet SDK. Facts from Dfns public docs as of November 2026:
 * docs.dfns.co/core-concepts/how-mpc-wallets-work,
 * docs.dfns.co/advanced/delegated-wallets,
 * docs.dfns.co/solutions/embed-user-wallets,
 * docs.dfns.co/advanced/deployment-models/mpc,
 * docs.dfns.co/networks,
 * dfns.co/pricing.
 * Sibling vendor facts reuse lib/compare-data.ts. Cavos fees: `/pricing`.
 * There is no Cavos vs Dfns compare page; the layer write-up is Privy vs Turnkey.
 */

export const DFNS_ALTERNATIVES_PATH = '/dfns-alternatives'

export const DFNS_ALTERNATIVES_TITLE =
  '5 Dfns Alternatives (2026): Free 1,000 Wallets'

/** 145 characters. Document title omits "| Cavos"; the layout template adds it. */
export const DFNS_ALTERNATIVES_DESCRIPTION =
  'Dfns alternatives and competitors: Cavos, Privy, Dynamic, Turnkey, Web3Auth. MPC/TSS infrastructure vs device-native keys. Free to 1,000 wallets.'

export const DFNS_ALTERNATIVES_H1 = '5 Dfns alternatives compared in 2026'

export const DFNS_ALTERNATIVES_PUBLISHED = '2026-11-06'

export const DFNS_ALTERNATIVES_MODIFIED = '2026-11-06'

export const DFNS_ALTERNATIVES_CRUMB = 'Dfns alternatives'

export const DFNS_CHOOSE_THEM = [
  'You want MPC/TSS wallet infrastructure whose official docs say the private key is never reconstructed.',
  'You want delegated passkey wallets whose key shares stay in Dfns infrastructure and are not stored on the user’s device.',
  'You need hybrid or on-premise signers you operate, which Dfns documents as a deployment model.',
  'You want a long named-network table (EVM networks plus Bitcoin, Solana, Starknet, Stellar, Sui, Cosmos Hub, and others) rather than three native adapters.',
] as const

export const DFNS_ALTERNATIVE_SECTIONS: AlternativeSection[] = [
  {
    name: 'Cavos',
    href: '/compare',
    linkLabel: 'Compare providers',
    paragraphs: [
      'Cavos is a Dfns alternative when you want a finished embedded wallet rather than MPC wallet infrastructure. The wallet is embedded in the application. Signing authority is a non-exportable device key: keys never leave the device in plaintext, signing happens on the device, and Cavos holds no key that can move user funds. Cavos does not reconstruct a master key with MPC and cannot decrypt the MasterDEK. Recovery is a synced passkey or opt-in hardware-isolated restore in an AWS Nitro Enclave.',
      CAVOS_CHAIN_ACCOUNT_PARAGRAPH,
      'Cavos is not a drop-in for Dfns. Dfns is stronger when you want TSS/MPC infrastructure, delegated wallets whose shares stay in the Dfns network, or hybrid and on-prem signers. Cavos is login, recovery, and Gas Sponsorship in Any Token (USDC is one example) already wired on Starknet, Solana, and Stellar. The published free tier covers the first 1,000 wallet creates; Essential is $59/mo and Complete is $139/mo.',
    ],
    chooseWhen: getCompetitor('turnkey')?.chooseCavos ?? [],
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
    { href: '/web3auth-alternatives', label: 'Web3Auth alternatives' },
    { href: '/magic-alternatives', label: 'Magic alternatives' },
  ]),
]

export function dfnsChooseThem(): string[] {
  return [...DFNS_CHOOSE_THEM]
}

export function dfnsAlternativesItemList() {
  return alternativesItemList('Dfns alternatives', DFNS_ALTERNATIVE_SECTIONS)
}

export const DFNS_WHY_LOOK = [
  {
    title: 'Product layer',
    body: 'Dfns is wallet infrastructure: an API, policies, and MPC/TSS signers you build on. Official embed-user-wallets docs describe a delegated path, not a finished consumer SDK with login, recovery, and sponsorship already wired. Teams that want that finished SDK look past assembling one.',
  },
  {
    title: 'Where key shares live',
    body: 'Dfns MPC docs describe a threshold signature scheme: key shares participate in a ceremony and the private key is never reconstructed. In the default cloud, Dfns stores all shares in its geographically distributed datacenters. Delegated wallets keep those shares in the Dfns network; they are not stored on the user’s device. Some reviews want the signing key on the end user’s device, with the vendor holding no share that participates in every signature.',
  },
  {
    title: 'Chain coverage',
    body: 'Dfns publishes a long named-network table: Ethereum and many other EVM networks, plus Bitcoin, Solana, Starknet, Stellar, Sui, TON, TRON, Cardano, and Cosmos Hub, among others, with tier-1 and tier-2 feature depth. That breadth is extra surface area when the product only needs native adapters on Starknet, Solana, and Stellar.',
  },
  {
    title: 'Commercial terms',
    body: 'Dfns public pricing lists Starter at $800 per year ($200 per quarter) for 10 wallets and one blockchain, Basic at $8,000 per year for 10,000 wallets and three blockchains, and Pro at $35,000 per year for 50,000 wallets. Cavos prices on wallet creates: free up to 1,000 wallets, Essential $59/mo, Complete $139/mo. Those figures are from each vendor’s public pricing page as of November 2026 and can change.',
  },
] as const

export const DFNS_HOW_TO_CHOOSE = DEFAULT_HOW_TO_CHOOSE

export const DFNS_ALTERNATIVES_FAQ = [
  {
    question: 'What is the best Dfns alternative?',
    answer:
      'There is no single best Dfns alternative. The right pick depends on whether you want wallet infrastructure or a finished SDK. Cavos is the alternative when the product is on Starknet, Solana, or Stellar and the review requires a device-native key. Privy is the more mature finished auth and wallet product across EVM. Dynamic is stronger when you must connect wallets users already hold. Turnkey is the closer infrastructure comparison (enclaves rather than MPC). Web3Auth / MetaMask Embedded Wallets fits broad social-login chain coverage. Dfns itself remains the better pick when you want MPC/TSS infrastructure, delegated passkey wallets, or hybrid and on-prem signers.',
  },
  {
    question: 'Is there a free Dfns alternative?',
    answer:
      'Yes. Cavos is free for the first 1,000 wallet creates, then Essential at $59/mo and Complete at $139/mo. Web3Auth / MetaMask Embedded Wallets starts free at 1,000 monthly active wallets. Turnkey’s Pay as you go tier includes 1,000 wallets and 25 free signatures per month. Privy’s own Developer free tier is 0–499 MAU. Dfns public Starter pricing is $800 per year for 10 wallets and one blockchain. Those figures are from each vendor’s public pricing page as of November 2026 and can change.',
  },
  {
    question: 'Which Dfns alternative is best for Starknet, Solana, or Stellar?',
    answer:
      'Cavos ships native adapters for all three: an audited OpenZeppelin account contract on Starknet, a native Ed25519 system account on Solana, and a classic G-account on Stellar. The OpenZeppelin audit covers that contract, not Cavos. Dfns names Starknet, Solana, and Stellar on its supported-networks table; feature depth follows that table’s tiers. MetaMask Embedded Wallets lists EVM, Solana, and additional networks including StarkNet; feature parity still varies by chain.',
  },
  {
    question: 'Is Cavos a drop-in replacement for Dfns?',
    answer:
      'No. They sit at different layers. Dfns is MPC/TSS wallet infrastructure: delegated wallets, policies, and optional hybrid or on-prem signers. Cavos is a finished embedded wallet SDK: auth, a device-native account, passkey or Nitro Enclave sealed restore, and Gas Sponsorship in Any Token. Wallet addresses are derived differently, so accounts do not transfer as a config change.',
  },
  {
    question: 'Is Dfns an embedded wallet or wallet infrastructure?',
    answer:
      'Infrastructure. Official docs describe threshold signatures, delegated wallets whose shares stay in the Dfns network, and an embed-user-wallets path. That is closer to Turnkey than to Privy. You still assemble auth, approval UI, and chain adapters. Recovery is something you implement; Dfns documents that it cannot restore a wallet if the only passkey is gone.',
  },
  {
    question: 'Who are Dfns competitors?',
    answer:
      'If you want a finished embedded wallet instead of Dfns MPC infrastructure, the usual shortlist is Cavos, Privy, Dynamic, Turnkey, and Web3Auth / MetaMask Embedded Wallets. Turnkey is the closer infrastructure comparison. Cavos is the comparison when the product is on Starknet, Solana, or Stellar and the review requires a device-native key. There is no Cavos vs Dfns one-to-one page; start at compare, or at Privy vs Turnkey for the three-way with Dfns.',
  },
  {
    question: 'Does Dfns reconstruct the private key?',
    answer:
      'No. Official Dfns MPC docs describe a threshold signature scheme: key shares participate in a ceremony and the private key is never reconstructed. That is not the same as a device-native key. In the default cloud, Dfns stores all shares in its datacenters; delegated wallets are not stored on the user’s device. Cavos also never reconstructs a signing key: the device derives the account key and signs.',
  },
] as const

export const dfnsAlternativesGuide: AlternativesGuide = {
  path: DFNS_ALTERNATIVES_PATH,
  title: DFNS_ALTERNATIVES_TITLE,
  description: DFNS_ALTERNATIVES_DESCRIPTION,
  h1: DFNS_ALTERNATIVES_H1,
  published: DFNS_ALTERNATIVES_PUBLISHED,
  modified: DFNS_ALTERNATIVES_MODIFIED,
  crumb: DFNS_ALTERNATIVES_CRUMB,
  jsonLdId: 'dfns-alternatives-json-ld',
  answerHeading: 'Dfns versus finished embedded wallet alternatives',
  answerParagraphs: [
    [
      "Dfns is MPC/TSS wallet infrastructure. Official docs: key shares participate in a threshold ceremony and the private key is never reconstructed; delegated wallets keep those shares in the Dfns network, not on the user’s device; embed user wallets is that delegated path. Hybrid and on-premise signer deployments exist. That kit does not turn Dfns into a finished consumer wallet SDK.",
    ],
    [
      'A Dfns alternative on this page is a finished ',
      { href: '/embedded-wallet', label: 'embedded wallet' },
      ' SDK, or signing infrastructure at a different layer: login, recovery, and Gas Sponsorship in Any Token already wired, or an enclave signing API. Cavos, Privy, Dynamic, Turnkey, and Web3Auth / MetaMask Embedded Wallets sit there. They are the usual Dfns competitors when you do not want to assemble a wallet on MPC shares. Stay with Dfns when delegated passkey wallets, hybrid signers, or a long named-network table are the product. There is no Cavos vs Dfns one-to-one. The worked layer split with Dfns is ',
      { href: PRIVY_VS_TURNKEY_PATH, label: 'Privy vs Turnkey' },
      '.',
    ],
  ],
  introParagraphs: [
    [
      'Cavos, Privy, Dynamic, Turnkey, and Web3Auth are the five Dfns alternatives compared here for an ',
      { href: '/embedded-wallet', label: 'embedded wallet' },
      '. Each is a Dfns alternative when you want a finished SDK, or enclave signing infrastructure, instead of Dfns MPC/TSS wallet infrastructure.',
    ],
    [
      'The sections below use the same facts as the ',
      { href: '/compare', label: 'compare pages' },
      '. Cavos publishes its own fees on the ',
      { href: '/pricing', label: 'pricing page' },
      '; other vendors set theirs independently. There is no Cavos vs Dfns one-to-one. The layer write-up that includes Dfns is ',
      { href: PRIVY_VS_TURNKEY_PATH, label: 'Privy vs Turnkey' },
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
      { href: '/web3auth-alternatives', label: 'Web3Auth' },
      '. Migration is a project, not a config change: wallet addresses are derived differently, so accounts do not transfer automatically.',
    ],
  ],
  whyLookHeading: 'Why teams look for a Dfns alternative',
  whyLookIntro:
    'Dfns is not the weaker product. It covers ground several of these alternatives do not, especially MPC/TSS infrastructure, delegated passkey wallets, and hybrid or on-prem signers. Teams still shortlist replacements when they want a finished wallet SDK rather than infrastructure they assemble.',
  whyLook: DFNS_WHY_LOOK,
  comparedHeading: 'Dfns alternatives and competitors',
  comparedIntro:
    'The table below is the same shortlist used on the other alternatives pages: Cavos, Privy, Dynamic, Turnkey, Web3Auth / MetaMask Embedded Wallets, and Magic. Dfns is the incumbent, summarized in the sections that follow. They do not share a key model, the same native chain coverage, or the same pricing. Each name opens the full comparison except Cavos, which links to published fees.',
  sections: DFNS_ALTERNATIVE_SECTIONS,
  howToChooseHeading: 'How to choose a Dfns alternative',
  howToChooseIntro:
    'Ask whether you are buying a wallet product or signing infrastructure first, then where key shares live, then which chains are native.',
  howToChoose: DFNS_HOW_TO_CHOOSE,
  howToChooseOutro: DEFAULT_HOW_TO_CHOOSE_OUTRO,
  stayHeading: 'When Dfns is still the right choice',
  stayIntro:
    'Dfns is the better pick when you want MPC/TSS wallet infrastructure, delegated passkey wallets, or hybrid and on-prem signers. It is not the weaker product; it covers ground Cavos does not. Stay with Dfns when the following are true.',
  chooseThem: dfnsChooseThem,
  faq: DFNS_ALTERNATIVES_FAQ,
  itemListName: 'Dfns alternatives',
}
