import { getCompetitor } from './compare-data'

export const PRIVY_ALTERNATIVES_PATH = '/privy-alternatives'

export const PRIVY_ALTERNATIVES_TITLE =
  'Privy Alternatives for Embedded Wallets (2026)'

/** 149 characters. Document title omits "| Cavos"; the layout template adds it. */
export const PRIVY_ALTERNATIVES_DESCRIPTION =
  'Compare Privy alternatives for embedded wallets. See how Cavos, Dynamic, Turnkey, Web3Auth, and Magic differ on custody, chain support, and recovery.'

export const PRIVY_ALTERNATIVES_H1 = 'Privy alternatives for embedded wallets'

export type AlternativeSection = {
  name: string
  href: string
  linkLabel: string
  paragraphs: string[]
}

export const PRIVY_ALTERNATIVE_SECTIONS: AlternativeSection[] = [
  {
    name: 'Cavos',
    href: '/compare/privy',
    linkLabel: 'Cavos vs Privy',
    paragraphs: [
      'Cavos embeds a wallet in the application and removes the extension requirement. Signing authority is a non-exportable device key: Cavos holds no key that can move user funds and does not reconstruct a master key with MPC.',
      'One SDK ships chain-native adapters for Starknet, Solana, and Stellar. It is not a drop-in replacement for Privy — the two products target different chain ecosystems.',
      'Choose Cavos when you are building on those three chains and want each chain’s native account model, or when a security review requires that no provider-side key material can reconstruct a signing key.',
    ],
  },
  {
    name: 'Dynamic',
    href: '/compare/dynamic',
    linkLabel: 'Cavos vs Dynamic',
    paragraphs: [
      'Dynamic provides wallet connection, embedded wallets, and authentication tooling with a strong emphasis on multi-wallet login experiences and developer-facing configuration.',
      'It is strongest as a unified login and wallet-connection layer covering many wallets and chains. Embedded wallet keys are managed by the provider’s key infrastructure with configurable custody models.',
      'Choose Dynamic when you need to support many external wallets alongside embedded ones, or when users already hold wallets you must connect to.',
    ],
  },
  {
    name: 'Turnkey',
    href: '/compare/turnkey',
    linkLabel: 'Cavos vs Turnkey',
    paragraphs: [
      'Turnkey provides secure key management infrastructure running in hardware-backed secure enclaves, exposed as a low-level API for building wallets and signing systems.',
      'It sits at a different layer than an embedded wallet product: you assemble the wallet experience on top of policy-driven signing primitives. Keys live in remote enclaves, not on the end user’s device.',
      'Choose Turnkey when you are building your own wallet or custody product, or when you need server-side signing and organizational policy over keys.',
    ],
  },
  {
    name: 'Web3Auth',
    href: '/compare/web3auth',
    linkLabel: 'Cavos vs Web3Auth',
    paragraphs: [
      'Web3Auth provides social-login wallets using multi-party computation, splitting key shares across the user’s device, the provider’s network, and recovery factors.',
      'That reconstructs a private key from distributed shares. MPC is a legitimate design; the difference is the trust surface — the provider network holds a share used in reconstruction, and export is supported.',
      'Choose Web3Auth when you need very broad chain coverage from a single social-login wallet layer, or a key you can export and use in other tooling.',
    ],
  },
  {
    name: 'Magic',
    href: '/compare/magic',
    linkLabel: 'Cavos vs Magic',
    paragraphs: [
      'Magic offers embedded wallets and passwordless authentication, historically known for email magic-link login and a delegated key management model backed by hardware security modules.',
      'It pioneered invisible wallet onboarding and remains a strong choice for simple, email-first flows on EVM chains. Signing is delegated to provider-operated infrastructure rather than a device-bound key.',
      'Choose Magic when you want the simplest possible email-link onboarding on EVM, or a mature provider for a straightforward wallet requirement.',
    ],
  },
]

export function privyChooseThem(): string[] {
  return getCompetitor('privy')?.chooseThem ?? []
}

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
      'Web3Auth does: it reconstructs a private key from distributed shares, and the provider network holds a share used in reconstruction. Cavos does not split or reconstruct a signing key with MPC. Dynamic, Turnkey, Magic, and Privy use other key-management models documented on each comparison page.',
  },
  {
    question: 'Can I migrate from Privy without changing wallet addresses?',
    answer:
      'Not automatically. Wallet addresses are derived differently, so accounts do not transfer as a config change. Migration means provisioning new wallets against your existing stable user IDs and moving assets deliberately.',
  },
] as const
