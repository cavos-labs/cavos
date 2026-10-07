export const EMBEDDED_WALLET_PATH = '/embedded-wallet'

export const EMBEDDED_WALLET_TITLE = 'What Is an Embedded Wallet?'

export const EMBEDDED_WALLET_DESCRIPTION =
  'What an embedded wallet is, how it differs from extensions and MPC, and how to choose a self-custodial SDK for Starknet, Solana, and Stellar.'

export const EMBEDDED_WALLET_PUBLISHED = '2026-10-07'

export const EMBEDDED_WALLET_FAQ = [
  {
    question: 'What is an embedded wallet?',
    answer:
      'An embedded wallet is a crypto wallet that lives inside an application instead of in a browser extension or a separate wallet app. The user signs in with an identity the product already owns, and the app resolves an on-chain account they can pay, receive, and sign with — without installing software or handling a seed phrase.',
  },
  {
    question: 'How is an embedded wallet different from a browser extension?',
    answer:
      'An extension wallet keeps keys in a separate application the user installs and manages. An embedded wallet is provisioned by the product: login selects the user, the SDK looks up or creates an on-chain account, and approval happens in the app UI. Extensions are the better fit when users already hold wallets you must connect to.',
  },
  {
    question: 'Is an embedded wallet the same as an MPC wallet?',
    answer:
      'No. Embedded describes where the wallet appears. MPC is a key-management design that splits a private key into shares and reconstructs or jointly computes a signature. Some embedded wallets use MPC; others use device-native keys, delegated HSMs, or remote enclaves. The UX label does not decide custody.',
  },
  {
    question: 'What is a self-custodial embedded wallet?',
    answer:
      'A self-custodial embedded wallet is one the provider cannot spend from. The signing key is created and used on the user’s device, is not reconstructed from provider-held shares, and the on-chain account is the authority over signers. Calling a product non-custodial does not make it so — the test is who can move the assets.',
  },
  {
    question: 'Does choosing an embedded wallet make my app a custodian?',
    answer:
      'Only if your company can move the user’s crypto or holds the means of access. The name of the wallet is irrelevant. MiCA, FinCEN, California, and other regimes look at control. Integrating a self-custodial SDK also does not settle exchange, on-ramp, or payment licensing. Recovery paths count; counsel has to read them.',
  },
  {
    question: 'How should I choose an embedded wallet SDK?',
    answer:
      'Ask who can produce a valid signature without the user, where the key lives, which chains are native rather than compatibility layers, how a second device is authorized, and what recovery actually does. Then match that to the product: provision new accounts, or connect existing ones. Worked comparisons live on the Cavos compare pages.',
  },
] as const
