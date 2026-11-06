export const EMBEDDED_WALLET_PATH = '/embedded-wallet'

export const EMBEDDED_WALLET_TITLE =
  'Embedded Wallet SDK: Free to 1,000 Wallets'

export const EMBEDDED_WALLET_DESCRIPTION =
  'Embedded wallets: non-custodial SDK, platform and infrastructure in your app. Free up to 1,000 wallets. Setup in minutes on Starknet, Solana, and Stellar.'

export const EMBEDDED_WALLET_PUBLISHED = '2026-10-07'

export const EMBEDDED_WALLET_MODIFIED = '2026-11-05'

export const EMBEDDED_WALLET_H1 = 'Embedded wallet SDK'

/** Featured-snippet definition rendered under the H1. Keep 40–60 words. */
export const EMBEDDED_WALLET_DEFINITION =
  'Embedded wallets are crypto wallets built into an application instead of a browser extension or a separate wallet app. An embedded wallet lets users sign in the way they already do, and the product resolves an on-chain account they can pay, receive, and sign with. No install, no seed phrase, no trip to another app.'

export const EMBEDDED_WALLET_INTEGRATION_PATH =
  '/blog/how-to-add-an-embedded-wallet'

export const EMBEDDED_WALLET_INTEGRATION_TITLE =
  'How to Add an Embedded Wallet to a React App'

export const EMBEDDED_WALLET_VS_EXTENSION_PATH =
  '/blog/embedded-wallet-vs-browser-extension'

export const EMBEDDED_WALLET_VS_EXTENSION_TITLE =
  'Embedded Wallet vs Browser Extension: Where to Sign'

export const STELLAR_EMBEDDED_WALLET_TUTORIAL_PATH =
  '/blog/stellar-embedded-wallet-tutorial'

export const STELLAR_EMBEDDED_WALLET_TUTORIAL_TITLE =
  'How to Add an Embedded Stellar Wallet to Your App'

export const GASLESS_STARKNET_TRANSACTIONS_PATH =
  '/blog/gasless-starknet-transactions'

export const GASLESS_STARKNET_TRANSACTIONS_TITLE =
  'How to Send Gasless Starknet Transactions'

export const EMBEDDED_WALLET_PROVIDERS_PATH =
  '/blog/embedded-wallet-providers'

export const EMBEDDED_WALLET_PROVIDERS_TITLE =
  'Best Embedded Wallet Providers 2026: Compared'

export const PRIVY_VS_TURNKEY_PATH = '/blog/privy-vs-turnkey'

export const PRIVY_VS_TURNKEY_TITLE =
  'Privy vs Turnkey (2026): Who Holds the Key'

export const PRIVY_VS_DYNAMIC_PATH = '/blog/privy-vs-dynamic'

export const PRIVY_VS_DYNAMIC_TITLE =
  'Privy vs Dynamic (2026): Custody, Pricing'

export const EMBEDDED_WALLET_API_PATH = '/blog/embedded-wallet-api'

export const EMBEDDED_WALLET_API_TITLE =
  'Embedded Wallet API (2026): Auth, Sign, Gas'

export const WHAT_IS_AN_EMBEDDED_WALLET_PATH = '/blog/what-is-an-embedded-wallet'

export const WHAT_IS_AN_EMBEDDED_WALLET_TITLE =
  'What Is an Embedded Wallet? A Developer Definition'

export const NON_CUSTODIAL_EMBEDDED_WALLET_PATH =
  '/blog/non-custodial-embedded-wallet'

export const NON_CUSTODIAL_EMBEDDED_WALLET_TITLE =
  'Non-Custodial Embedded Wallets: What They Are (2026)'

export const WALLET_AS_A_SERVICE_PATH = '/blog/wallet-as-a-service'

export const WALLET_AS_A_SERVICE_TITLE =
  'Wallet as a Service (2026): Providers, Pricing'

export const EMBEDDED_WALLET_COST_PATH = '/blog/embedded-wallet-cost'

export const EMBEDDED_WALLET_COST_TITLE =
  'Embedded Wallet Cost (2026): Privy, Dynamic'

export const EMBEDDED_WALLET_REACT_SDK_PATH = '/blog/embedded-wallet-react-sdk'

export const EMBEDDED_WALLET_REACT_SDK_TITLE =
  'Embedded Wallet React SDK: Best Practices (2026)'

export const ALCHEMY_VS_PRIVY_PATH = '/blog/alchemy-vs-privy'

export const ALCHEMY_VS_PRIVY_TITLE =
  'Alchemy vs Privy (2026): Kit Deprecated'

export const EMBEDDED_WALLET_PAYMENTS_PATH = '/blog/embedded-wallet-payments'

export const EMBEDDED_WALLET_PAYMENTS_TITLE =
  'Embedded Wallet Payments (2026): USDC Guide'

export const EMBEDDED_WALLET_VS_SMART_WALLET_PATH =
  '/blog/embedded-wallet-vs-smart-wallet'

export const EMBEDDED_WALLET_VS_SMART_WALLET_TITLE =
  'Embedded Wallet vs Smart Wallet (2026)'

export const EMBEDDED_WALLET_NEXTJS_PATH = '/blog/embedded-wallet-nextjs'

export const EMBEDDED_WALLET_NEXTJS_TITLE =
  'How to Add an Embedded Wallet to Next.js (2026)'

export const BEST_EMBEDDED_WALLET_PATH = '/blog/best-embedded-wallet'

export const BEST_EMBEDDED_WALLET_TITLE =
  'Best Embedded Wallet (2026): How to Choose'

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
  apiReference: `${DOCS_ORIGIN}/docs/api-reference`,
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
    body: 'A new device restores the wallet’s MasterDEK, not by reconstituting a master key on a server. Restore paths are another signed-in device, a passkey, and opt-in hardware-isolated recovery in an AWS Nitro Enclave (off by default).',
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

export const EMBEDDED_WALLET_SDK_KEY_MODELS = [
  [
    'Device-native',
    'The signing key is created and used on the user device. The provider cannot see it, sign with it, or move funds.',
    'Cavos',
  ],
  [
    'MPC',
    'The private key is split into shares. Signing uses some mix of the user device, the provider network, and a recovery factor.',
    'Web3Auth / MetaMask Embedded Wallets, Dynamic, Para',
  ],
  [
    'Remote TEE',
    'Key material decrypts inside a measured enclave. Who can authorize that enclave decides custody.',
    'Turnkey, Privy user wallets',
  ],
  [
    'Hosted',
    'The provider, or an HSM it operates, can produce a signature. Access to the login is often enough to spend.',
    'Custodial wallet products; some optional paths at finished SDKs',
  ],
] as const

export const EMBEDDED_WALLET_FAQ = [
  {
    question: 'What is an embedded wallet?',
    answer:
      'An embedded wallet is a crypto wallet that lives inside an application instead of in a browser extension or a separate wallet app. The user signs in with an identity the product already owns, and the app resolves an on-chain account they can pay, receive, and sign with, without installing software or handling a seed phrase.',
  },
  {
    question: 'What are embedded wallets?',
    answer:
      'Embedded wallets are in-app crypto wallets. The plural names the category: wallets provisioned inside products so users never install an extension or copy a seed phrase. An embedded wallet SDK is the library that does that job. Cavos ships that SDK as @cavos/kit, hardware-isolated and non-custodial, free up to 1,000 wallets.',
  },
  {
    question: 'How is an embedded wallet different from a browser extension?',
    answer:
      'An extension wallet keeps keys in a separate application the user installs and manages. An embedded wallet is provisioned by the product: login selects the user, the SDK looks up or creates an on-chain account, and approval happens in the app UI. Extensions are the better fit when users already hold wallets you must connect to.',
  },
  {
    question: 'What is an embedded wallet SDK?',
    answer:
      'An embedded wallet SDK is the library that provisions the wallet and signs from inside your application. It is not a wallet app or a browser extension the user installs. Authentication selects the user; the SDK looks up or creates an on-chain account; a signer bound to the session or the device authorizes transactions in your UI. Cavos ships that as @cavos/kit on web and @cavos/kit/react-native on mobile.',
  },
  {
    question: 'What is an embedded wallet as a service?',
    answer:
      'Embedded wallet as a service, also called wallet-as-a-service, is the commercial name for provisioning a crypto wallet through an SDK instead of asking the user to install an extension. Login selects the user, the platform looks up or creates an on-chain account, and approval happens in the product UI. The label does not decide who can sign.',
  },
  {
    question: 'What is an embedded wallet platform?',
    answer:
      'An embedded wallet platform is the hosted infrastructure behind the SDK: authentication, registry lookup or create, gas sponsorship, and recovery. Embedded wallet infrastructure is the same job from the operator side. The commercial name is wallet-as-a-service. The label does not decide who can sign. Cavos is device-native embedded wallet infrastructure for Starknet, Solana, and Stellar.',
  },
  {
    question: 'What is an embedded wallet solution?',
    answer:
      'An embedded wallet solution is the product you ship: login, an in-app approval UI, a chain-native account, and a fee path the user can complete. The SDK and the platform are how you build that. Cavos ships the SDK as @cavos/kit. Compare solutions on custody, native chains, and recovery, not on the login modal.',
  },
  {
    question: 'What are embedded wallet providers?',
    answer:
      'Embedded wallet providers are vendors that ship an in-app wallet through an API or SDK. Cavos, Privy, Dynamic, Turnkey, Web3Auth, and Magic all do this, with different key models, native chains, and pricing. Compare them on the Cavos compare pages, or start with Privy alternatives if you are replacing that stack.',
  },
  {
    question: 'What is a non-custodial embedded wallet?',
    answer:
      'A non-custodial embedded wallet is one the provider cannot spend from. The wallet still lives inside the application, but the signing key is created and used on the user’s device and is not reconstructed from provider-held shares. Calling a product non-custodial does not make it so. The test is who can move the assets.',
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
  {
    question: 'How should I choose an embedded wallet SDK?',
    answer:
      'Ask who can produce a valid signature without the user, where the key lives, which chains are native rather than compatibility layers, how a second device is authorized, and what recovery actually does. Then match that to the product: provision new accounts, or connect existing ones. Worked comparisons live on the Cavos compare pages.',
  },
  {
    question: 'What are embedded wallet payments?',
    answer:
      'Embedded wallet payments are pay, receive, and sign from inside the app: the user does not open an extension or paste a seed. Gas Sponsorship in Any Token removes the native-token wall so the product can sponsor fees, or settle them in a token the user already holds. USDC is one example of such a token, not a required asset.',
  },
  {
    question: 'How long does it take to add an embedded wallet SDK?',
    answer:
      'Setup is minutes, not a week: npm install @cavos/kit, create an app in the dashboard for an App ID, wrap the tree in CavosProvider or call Cavos.connect, sign the user in, then execute. Connect never deploys Starknet or Stellar; the first execute deploys and runs atomically. The free tier covers the first 1,000 wallets.',
  },
  {
    question: 'What is the difference between an embedded wallet and a smart wallet?',
    answer:
      'They answer different questions. Embedded says where the wallet appears: inside the app, provisioned at login. Smart wallet usually means a smart-account or account-abstraction wallet, a contract that can enforce policy, batch calls, or sponsor gas. An embedded wallet can be a smart account. Cavos on Starknet is an audited OpenZeppelin account contract. Cavos on Solana and Stellar uses native system accounts, not contract wallets. A browser extension can also be a smart account.',
  },
  {
    question: 'What is the best embedded wallet?',
    answer:
      'There is no single best embedded wallet. Choose on chain, custody, and whether you provision new accounts or connect existing ones. Cavos is the closer fit when the product is Starknet, Solana, or Stellar and the review requires a device-native key. If the product is EVM-first or must connect MetaMask, Privy or Dynamic cover ground Cavos does not. The dated vendor table is the embedded wallet providers guide.',
  },
] as const
