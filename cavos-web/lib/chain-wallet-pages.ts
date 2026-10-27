import {
  SOLANA_WALLET_DESCRIPTION,
  SOLANA_WALLET_FAQ,
  SOLANA_WALLET_PATH,
  SOLANA_WALLET_TITLE,
  STARKNET_WALLET_DESCRIPTION,
  STARKNET_WALLET_FAQ,
  STARKNET_WALLET_PATH,
  STARKNET_WALLET_TITLE,
  STELLAR_WALLET_DESCRIPTION,
  STELLAR_WALLET_FAQ,
  STELLAR_WALLET_PATH,
  STELLAR_WALLET_TITLE,
} from './marketing-seo'

export const CHAIN_WALLET_PUBLISHED = '2026-10-09'
export const CHAIN_WALLET_MODIFIED = '2026-10-27'

export const STARKNET_FAQ = STARKNET_WALLET_FAQ
export const SOLANA_FAQ = SOLANA_WALLET_FAQ
export const STELLAR_FAQ = STELLAR_WALLET_FAQ

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
    'Gas Sponsorship in Any Token',
    'Pay fees and reserves in any token the user holds; USDC is one example. The relayer can also sponsor XLM reserves and fees when an App ID is set.',
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
    "A device-native, self-custodial embedded wallet SDK for Stellar. The signing key is created and used on the user's device. Classic G… account whose spend key is HKDF of a MasterDEK, with Gas Sponsorship in Any Token and Soroban contract support.",
  featureList: [
    'Device-native signing key from a MasterDEK',
    'Classic G… Stellar account',
    'Gas Sponsorship in Any Token',
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
