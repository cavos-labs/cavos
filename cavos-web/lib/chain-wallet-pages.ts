import type { GuideFaqItem } from './marketing-seo'
import {
  SOLANA_WALLET_DESCRIPTION,
  SOLANA_WALLET_PATH,
  SOLANA_WALLET_TITLE,
  STARKNET_WALLET_DESCRIPTION,
  STARKNET_WALLET_PATH,
  STARKNET_WALLET_TITLE,
  STELLAR_WALLET_DESCRIPTION,
  STELLAR_WALLET_PATH,
  STELLAR_WALLET_TITLE,
} from './marketing-seo'

export const CHAIN_WALLET_PUBLISHED = '2026-10-09'
export const CHAIN_WALLET_MODIFIED = '2026-10-26'

export const MARKETING_PROSE_LINK =
  'font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink'

export const STARKNET_CONNECT_CODE = `import { Cavos } from "@cavos/kit";

const session = await Cavos.connect({
  chains: ["starknet"],
  defaultChain: "starknet",
  network: "mainnet",
  identity: { userId: user.id, email: user.email },
  appSalt: "my-app",
  appId: process.env.NEXT_PUBLIC_CAVOS_APP_ID,
  paymasterApiKey: process.env.NEXT_PUBLIC_CAVOS_PAYMASTER_API_KEY,
});

const wallet = session.wallet("starknet");

const { transactionHash } = await wallet.execute([
  {
    contractAddress: TOKEN_ADDRESS,
    entrypoint: "transfer",
    calldata: [recipient, amountLow, amountHigh],
  },
]);`

export const SOLANA_CONNECT_CODE = `import { Cavos } from "@cavos/kit";

const session = await Cavos.connect({
  chains: ["solana"],
  defaultChain: "solana",
  network: "mainnet",
  identity: { userId: user.id, email: user.email },
  appSalt: "my-app",
  appId: process.env.NEXT_PUBLIC_CAVOS_APP_ID,
});

const wallet = session.wallet("solana");

const signature = await wallet.execute(
  1_000_000n, // 0.001 SOL in lamports
  recipientPublicKey,
  { fee: "sponsored" },
);`

export const STELLAR_CONNECT_CODE = `import { Cavos } from "@cavos/kit";

const session = await Cavos.connect({
  chains: ["stellar"],
  defaultChain: "stellar",
  network: "mainnet",
  identity: { userId: user.id, email: user.email },
  appSalt: "my-app",
  appId: process.env.NEXT_PUBLIC_CAVOS_APP_ID,
});

const wallet = session.wallet("stellar");

const hash = await wallet.execute(
  10_000_000n, // 1 XLM in stroops
  "GDESTINATION...ADDRESS",
);`

export const REACT_PROVIDER_CODE = `import { CavosProvider } from "@cavos/kit/react";

export function Providers({ children }) {
  return (
    <CavosProvider
      config={{
        chains: ["solana", "stellar", "starknet"],
        defaultChain: "solana",
        network: "testnet",
        appSalt: "my-app",
        appId: process.env.NEXT_PUBLIC_CAVOS_APP_ID,
        paymasterApiKey: process.env.NEXT_PUBLIC_CAVOS_PAYMASTER_API_KEY,
      }}
      modal={{ appName: "My App" }}
    >
      {children}
    </CavosProvider>
  );
}`

export const STARKNET_FAQ: GuideFaqItem[] = [
  {
    question: 'What is a Starknet embedded wallet?',
    answer:
      'A Starknet embedded wallet is an on-chain Starknet account provisioned inside your application. The user signs in with an identity you already have. @cavos/kit looks up or claims a deterministic address and signs from the device. Cavos cannot see the key, sign with it, or move funds.',
  },
  {
    question: 'Does Cavos use a custom Starknet account contract?',
    answer:
      'No. Each Starknet wallet is an audited OpenZeppelin account contract: AccountUpgradeable v3.0.0, class hash 0x01d1777db36cdd06dd62cfde77b1b6ae06412af95d57a13dc40ac77b8a702381. The audit covers OpenZeppelin’s contract, not Cavos. One stark key, derived from the MasterDEK and app salt, controls the account. There is no on-chain device list and no custom Cavos account class.',
  },
  {
    question: 'How does gas work on a Starknet embedded wallet?',
    answer:
      'execute routes through the Cavos paymaster (SNIP-29, with SRC-9 outside execution). Account deployment and later executions are sponsored by default, so the user does not need ETH or STRK. After the account is deployed, fee: "self" pays from the account’s own balance. A self-funded first execute is refused.',
  },
  {
    question: 'How do I add a Starknet embedded wallet with @cavos/kit?',
    answer:
      'Install @cavos/kit, create an app in the Cavos dashboard, and pass the App ID plus a paymaster API key into Cavos.connect or CavosProvider. Call session.wallet("starknet"), then execute a multicall. Connect never deploys; the first execute deploys and runs atomically.',
  },
  {
    question: 'How does recovery work on a Starknet embedded wallet?',
    answer:
      'Recovery is off-chain. A new device restores the MasterDEK with a Nitro enclave or a synced passkey and derives the same stark key. There are no on-chain device signers and no on-chain social recovery, backup signer, or recovery delay. After login, enrollPasskeyDefault() stores an encrypted copy of that DEK under a passkey. Hardware-isolated recovery, opt-in per environment, unwraps the DEK when the user signs in again with Google, Apple, or an enclave-verified email code. Recovery codes do not restore Starknet wallets.',
  },
  {
    question: 'What is Starknet-specific versus shared across chains?',
    answer:
      'Shared: login, registry lookup on (userId, appId, chain, network), a MasterDEK, passkey and enclave restore, and @cavos/kit on web and React Native. Starknet-specific: the OpenZeppelin account, the stark curve, multicall execute, the paymaster, and SNIP-12 message signatures.',
  },
]

export const SOLANA_FAQ: GuideFaqItem[] = [
  {
    question: 'What is a Solana embedded wallet?',
    answer:
      'A Solana embedded wallet is a native Ed25519 system account provisioned inside your application. The spend key is HKDF of a MasterDEK that stays on the device. The address is an ordinary Solana public key, the same shape as Phantom, not a PDA.',
  },
  {
    question: 'Is a Cavos Solana wallet a program-derived address?',
    answer:
      'No. Cavos provisions a native system account. The user key signs the Solana message. There is no on-chain Cavos program, no secp256r1 precompile account, and no extra on-chain signer to add.',
  },
  {
    question: 'How do fees work on a Solana embedded wallet?',
    answer:
      'Who pays is a per-call choice. Omitting fee (or fee: "self") makes the account pay SOL. fee: "sponsored" names the Cavos relayer as fee payer when an App ID is set. fee: { token } settles the fee in a token the account holds. A co-signer cannot alter the instructions it signs. Sponsorship of extra programs is allowlisted per app, with a 1,000,000 CU cap.',
  },
  {
    question: 'How do I add a Solana embedded wallet with @cavos/kit?',
    answer:
      'Install @cavos/kit, create an app in the Cavos dashboard, and pass the App ID into Cavos.connect or CavosProvider with chains: ["solana"]. Narrow on wallet.chain === "solana", then call execute(amount, destination) in lamports, or executeInstructions for allowlisted programs. Connect does not airdrop SOL.',
  },
  {
    question: 'How does recovery work on a Solana embedded wallet?',
    answer:
      'There is one spend key. A new device restores the MasterDEK with a passkey the user added (enrollPasskeyDefault after login) or with hardware-isolated recovery: sign in again with Google, Apple, or an enclave-verified email code when the enclave is enabled for the app. Recovery codes are not used on Solana.',
  },
  {
    question: 'What is Solana-specific versus shared across chains?',
    answer:
      'Shared: login, registry lookup, a MasterDEK, passkey and enclave restore, and the same kit packages. Solana-specific: the Ed25519 system account, lamport execute, executeInstructions, three fee routes, and the program allowlist. Native Solana has nothing to deploy; the account appears when it first receives lamports.',
  },
]

export const STELLAR_FAQ: GuideFaqItem[] = [
  {
    question: 'What is a Stellar embedded wallet?',
    answer:
      'A Stellar embedded wallet is a classic G… Stellar account provisioned inside your application. The spend key is one Ed25519 key, HKDF of the same MasterDEK as Solana (`cavos-ed25519-stellar-v1`, salted by appSalt). It is not a Soroban contract, so exchanges and existing tools already understand the address.',
  },
  {
    question: 'How do reserves and fees work on a Stellar embedded wallet?',
    answer:
      'When an App ID is set, the Cavos relayer is the transaction source and fee payer and sponsors the account’s XLM reserves. The user does not need to hold lumens to start. Pass { sponsored: false } to have the account pay its own fee. The relayer cannot move funds or squat an address.',
  },
  {
    question: 'How do I add a Stellar embedded wallet with @cavos/kit?',
    answer:
      'Install @cavos/kit, create an app in the Cavos dashboard, and pass the App ID into Cavos.connect or CavosProvider with chains: ["stellar"]. Narrow on wallet.chain === "stellar", then call execute(amount, destination) in stroops. Connect never creates the account; the first execute creates it and runs atomically.',
  },
  {
    question: 'Can a Stellar embedded wallet invoke Soroban contracts?',
    answer:
      'Yes. invokeContract simulates the call, re-signs this account’s Soroban auth entry with the control key, and submits it. The G… can satisfy require_auth in on-chain apps. invokeContract and addTrustline require a deployed account (status ready). Native XLM transfers can create the account on first execute.',
  },
  {
    question: 'How does recovery work on a Stellar embedded wallet?',
    answer:
      'A new device restores the MasterDEK and derives the same Ed25519 spend key. Restore with another signed-in device, a passkey (enrollPasskeyDefault after login), or opt-in hardware-isolated recovery in an AWS Nitro Enclave. If every device and every restore factor is gone, Cavos cannot recover the wallet.',
  },
]

export const STARKNET_FEATURES: [string, string][] = [
  [
    'Self-custodial',
    "Cavos never holds a key that can move user funds. The account key is derived from a MasterDEK that only the user's devices can open.",
  ],
  [
    'Audited OpenZeppelin account',
    'AccountUpgradeable v3.0.0 (class hash 0x01d1777db36cdd06dd62cfde77b1b6ae06412af95d57a13dc40ac77b8a702381). The audit covers OpenZeppelin’s contract, not Cavos.',
  ],
  [
    'Gasless execution',
    'The Cavos paymaster sponsors deployment and every transaction by default. Users never need ETH or STRK. After deploy, fee: "self" is available.',
  ],
  [
    'Arbitrary multicalls',
    'Execute any contract calls: token transfers, DeFi interactions, NFT mints — all in one transaction. The kit refuses set_public_key on the account itself.',
  ],
  [
    'Passkey and enclave restore',
    'A synced passkey or an enclave sign-in restores the MasterDEK on a new device, so the same wallet opens everywhere.',
  ],
  [
    'Lazy deploy',
    'Connect derives the address immediately. The account is deployed on first execute, atomically.',
  ],
]

export const SOLANA_FEATURES: [string, string][] = [
  [
    'Self-custodial',
    "Cavos never holds a key that can move user funds. The spend key is derived from a MasterDEK that only the user's devices can open.",
  ],
  [
    'Native account',
    'A plain Ed25519 system account — no custom on-chain program and no PDA.',
  ],
  [
    'Fee routes',
    'The account can pay SOL, the Cavos relayer can pay (fee: "sponsored"), or the fee can settle in a token the account holds.',
  ],
  [
    'Arbitrary programs',
    'Beyond SOL transfers: SPL tokens, swaps, and other calls via executeInstructions (allowlisted programs, 1,000,000 CU cap).',
  ],
  [
    'Passkey and enclave restore',
    'A synced passkey or an enclave sign-in restores the MasterDEK on a new device.',
  ],
  [
    'No deploy step',
    'Connect unwraps the spend key. A system account appears when it first receives lamports. Connect does not airdrop SOL.',
  ],
]

export const STELLAR_FEATURES: [string, string][] = [
  [
    'Self-custodial',
    'Cavos never holds a key that can move user funds. One Ed25519 spend key, derived from the MasterDEK, controls the classic G… account.',
  ],
  [
    'Classic G… address',
    'Standard Stellar address format compatible with exchanges, wallets, and ecosystem tools. Not a Soroban contract.',
  ],
  [
    'Sponsored reserves',
    'The Cavos relayer sponsors account reserves and pays transaction fees when an App ID is set, so users hold no XLM to start.',
  ],
  [
    'Soroban support',
    'The account can invoke Soroban contracts and satisfy require_auth for on-chain apps. Trustlines and Trustless Work wrappers ship in the kit.',
  ],
  [
    'Passkey and enclave restore',
    'A synced passkey stores an encrypted copy of the MasterDEK. Opt-in enclave sign-in unwraps the same DEK on a new device.',
  ],
  [
    'Lazy deploy',
    'Connect derives the address immediately. The on-chain account is created on first execute, atomically.',
  ],
]

export const STARKNET_SOFTWARE = {
  name: 'Cavos Embedded Starknet Wallet',
  subCategory: 'Embedded Starknet Wallet SDK',
  description:
    "A device-native, self-custodial embedded wallet SDK for Starknet. The signing key is created and used on the user's device. Audited OpenZeppelin AccountUpgradeable v3.0.0 with a stark key derived on the device, and paymaster-sponsored execution.",
  featureList: [
    "Native stark key derived from the user's MasterDEK",
    'Audited OpenZeppelin AccountUpgradeable v3.0.0',
    'Paymaster-sponsored transactions',
    'Arbitrary multicalls',
    'Passkey and enclave restore on new devices',
    'React and React Native SDKs',
  ],
}

export const SOLANA_SOFTWARE = {
  name: 'Cavos Embedded Solana Wallet',
  subCategory: 'Embedded Solana Wallet SDK',
  description:
    "A device-native, self-custodial embedded wallet SDK for Solana. The signing key is created and used on the user's device. Native Ed25519 system account with a spend key derived on the device, and optional relayer fee payment.",
  featureList: [
    "Native Ed25519 spend key derived from the user's MasterDEK",
    'Native system account (same shape as Phantom)',
    'Self, sponsored, or token fee routes',
    'Arbitrary program calls (allowlisted)',
    'Passkey and enclave restore on new devices',
    'React and React Native SDKs',
  ],
}

export const STELLAR_SOFTWARE = {
  name: 'Cavos Embedded Stellar Wallet',
  subCategory: 'Embedded Stellar Wallet SDK',
  description:
    "A device-native, self-custodial embedded wallet SDK for Stellar. The signing key is created and used on the user's device. Classic G… account whose spend key is HKDF of a MasterDEK, with relayer-sponsored reserves and Soroban contract support.",
  featureList: [
    'Device-native signing key from a MasterDEK',
    'Classic G… Stellar account',
    'Relayer-sponsored reserves and fees',
    'Soroban contract invocations',
    'Passkey and enclave restore on new devices',
    'React and React Native SDKs',
  ],
}

export const CHAIN_WALLET_META = {
  starknet: {
    title: STARKNET_WALLET_TITLE,
    description: STARKNET_WALLET_DESCRIPTION,
    path: STARKNET_WALLET_PATH,
    crumbName: 'Embedded Starknet Wallet',
  },
  solana: {
    title: SOLANA_WALLET_TITLE,
    description: SOLANA_WALLET_DESCRIPTION,
    path: SOLANA_WALLET_PATH,
    crumbName: 'Embedded Solana Wallet',
  },
  stellar: {
    title: STELLAR_WALLET_TITLE,
    description: STELLAR_WALLET_DESCRIPTION,
    path: STELLAR_WALLET_PATH,
    crumbName: 'Embedded Stellar Wallet',
  },
} as const
