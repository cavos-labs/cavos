export const EMBEDDED_WALLET_PATH = '/embedded-wallet'

export const EMBEDDED_WALLET_TITLE =
  'Embedded Wallet: What It Is & How to Choose an SDK (2026)'

export const EMBEDDED_WALLET_DESCRIPTION =
  'What an embedded wallet is, how to choose an SDK, and how providers differ on pricing, chains, and key model for Starknet, Solana, and Stellar.'

export const EMBEDDED_WALLET_PUBLISHED = '2026-10-07'

export const EMBEDDED_WALLET_MODIFIED = '2026-10-22'

export const EMBEDDED_WALLET_INTEGRATION_PATH =
  '/blog/how-to-add-an-embedded-wallet'

export const EMBEDDED_WALLET_INTEGRATION_TITLE =
  'How to Add an Embedded Wallet to a React App'

export const EMBEDDED_WALLET_VS_EXTENSION_PATH =
  '/blog/embedded-wallet-vs-browser-extension'

export const EMBEDDED_WALLET_VS_EXTENSION_TITLE =
  'Embedded Wallet vs Browser Extension: Where Should Users Sign?'

export const STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH =
  '/blog/stellar-embedded-wallet-tutorial'

export const STELLAR_EMBEDDED_WALLET_TUTORIAL_TITLE =
  'How to Add an Embedded Stellar Wallet to Your App'

export const EMBEDDED_WALLET_PROVIDERS_PATH =
  '/blog/embedded-wallet-providers'

export const EMBEDDED_WALLET_PROVIDERS_TITLE =
  'Embedded Wallet Providers Compared (2026)'

export const PRIVY_VS_TURNKEY_PATH = '/blog/privy-vs-turnkey'

export const PRIVY_VS_TURNKEY_TITLE =
  'Privy vs Turnkey: Embedded Wallet SDKs Compared (2026)'

export const EMBEDDED_WALLET_API_PATH = '/blog/embedded-wallet-api'

export const EMBEDDED_WALLET_API_TITLE =
  'Embedded Wallet API: How It Works and What to Look For (2026)'

export const NON_CUSTODIAL_EMBEDDED_WALLET_PATH =
  '/blog/non-custodial-embedded-wallet'

export const NON_CUSTODIAL_EMBEDDED_WALLET_TITLE =
  'Non-Custodial Embedded Wallets: How Self-Custody Works (2026)'

export const WALLET_AS_A_SERVICE_PATH = '/blog/wallet-as-a-service'

export const WALLET_AS_A_SERVICE_TITLE =
  'Wallet-as-a-Service (WaaS): How Embedded Wallet Platforms Work (2026)'

export const DOCS_ORIGIN = 'https://docs.cavos.xyz'

export const DOCS_URLS = {
  home: DOCS_ORIGIN,
  docs: `${DOCS_ORIGIN}/docs`,
  quickstart: `${DOCS_ORIGIN}/docs/quickstart`,
  auth: `${DOCS_ORIGIN}/docs/auth`,
  walletActions: `${DOCS_ORIGIN}/docs/wallet-actions`,
  recovery: `${DOCS_ORIGIN}/docs/recovery`,
  concepts: `${DOCS_ORIGIN}/docs/concepts`,
  react: `${DOCS_ORIGIN}/docs/react`,
} as const

export const EMBEDDED_WALLET_HOW_IT_WORKS = [
  {
    title: 'Sign in',
    body: 'The user authenticates with an identity the product already owns: hosted login including email, or an identity you pass in from your own auth. Authentication selects which user this is. It does not, by itself, authorize a spend.',
  },
  {
    title: 'Key creation',
    body: 'The wallet’s account key is derived on the user’s device from a MasterDEK that stays protected at rest by the platform’s non-extractable key: WebCrypto in the browser, the OS keystore on React Native. Cavos cannot see the key, sign with it, or move funds.',
  },
  {
    title: 'Signing',
    body: 'The device signs. Approval happens in the product UI, not in a browser-extension popup. Gas is often sponsored so the user does not need a native token to start.',
  },
  {
    title: 'Recovery',
    body: 'A new device restores the wallet’s MasterDEK, not by reconstituting a master key on a server. Cavos ships passkey restore and opt-in hardware-isolated social recovery that is off by default; recovery codes remain only for grandfathered Stellar wallets.',
  },
] as const

export const EMBEDDED_WALLET_HOW_TO_INTEGRATE = [
  {
    name: 'Sign in',
    text: 'Authenticate the user with Cavos hosted login (Google, Apple, or email) or pass a stable userId from your own auth. Login selects which user this is. It never signs a transaction.',
    url: DOCS_URLS.auth,
    docsLabel: 'Authentication docs',
  },
  {
    name: 'Resolve the wallet',
    text: 'Call Cavos.connect or mount CavosProvider. The kit looks up (userId, appId, chain) in the registry and returns the existing address, or claims a new one. Connect never deploys Starknet or Stellar.',
    url: DOCS_URLS.quickstart,
    docsLabel: 'Quickstart',
  },
  {
    name: 'Sign and send',
    text: 'Narrow on wallet.chain, then execute. Undeployed and ready wallets can send; the first execute deploys and runs atomically. needs-device-approval means this device has no key yet and must restore the MasterDEK.',
    url: DOCS_URLS.walletActions,
    docsLabel: 'Wallet actions',
  },
  {
    name: 'Set up recovery',
    text: 'Add a second authority before it is needed: a passkey or opt-in hardware-isolated social recovery. None of those paths can be arranged after every device is gone.',
    url: DOCS_URLS.recovery,
    docsLabel: 'Recovery docs',
  },
] as const

export const EMBEDDED_WALLET_HOW_TO = {
  name: 'How to integrate an embedded wallet',
  description:
    'Sign in, resolve a self-custodial embedded wallet with @cavos/kit, sign and send a sponsored transaction, then enroll recovery.',
  steps: EMBEDDED_WALLET_HOW_TO_INTEGRATE,
} as const

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
      'A self-custodial embedded wallet is one the provider cannot spend from. The signing key is created and used on the user’s device and is not reconstructed from provider-held shares. Calling a product non-custodial does not make it so — the test is who can move the assets.',
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
  {
    question: 'What is an embedded wallet SDK?',
    answer:
      'An embedded wallet SDK is the library that provisions the wallet and signs from inside your application. It is not a wallet app or a browser extension the user installs. Authentication selects the user; the SDK looks up or creates an on-chain account; a signer bound to the session or the device authorizes transactions in your UI. Cavos ships that as @cavos/kit on web and @cavos/kit/react-native on mobile.',
  },
  {
    question: 'Which chains does Cavos support for embedded wallets?',
    answer:
      'Cavos currently ships native adapters for Starknet, Solana, and Stellar. It is not an EVM-wide wallet layer. Each adapter uses that chain’s account model, signatures, and fee path. Cavos, LLC is a software and SaaS company; the wallet is the main product.',
  },
  {
    question: 'How do I add an embedded wallet to a React app?',
    answer:
      'Install @cavos/kit, create an app in the Cavos dashboard for an App ID, wrap the tree in CavosProvider, sign the user in, then execute. Connect never deploys Starknet or Stellar; the first execute deploys and runs atomically when the account is still undeployed. The step-by-step integration guide on this site walks through that path.',
  },
] as const
