export type ChainId = 'starknet' | 'solana' | 'stellar'

/**
 * `null` means the value could not be read, not that it is zero. Rendering a
 * failed read as 0 would publish a false number, so the two states stay
 * distinct all the way to the surface.
 */
export type Reading<T> = T | null

export interface DayPoint {
    date: string
    value: number
}

export type NetKind = 'mainnet' | 'testnet'

export interface NetSeriesPoint {
    date: string
    mainnet: number
    testnet: number
}

export interface ChainStats {
    chain: ChainId
    label: string
    /** Only Starknet is live on mainnet today; the split keeps that visible. */
    walletsMainnet: Reading<number>
    walletsTestnet: Reading<number>
    wallets: Reading<number>
}

export interface PackageStats {
    name: string
    latestVersion: Reading<string>
    downloads30d: Reading<number>
    series: Reading<DayPoint[]>
}

export interface PublicStatsTotals {
    sponsoredOperations: Reading<number>
    walletsRegistered: Reading<number>
    apps: Reading<number>
    organizations: Reading<number>
    deviceSigners: Reading<number>
    socialRecoveryWallets: Reading<number>
}

export interface PublicStats {
    generatedAt: string
    totals: PublicStatsTotals
    chains: ChainStats[]
    walletGrowth: Reading<NetSeriesPoint[]>
    operationsByNet: Reading<NetSeriesPoint[]>
    packages: PackageStats[]
}

export const CHAIN_LABELS: Record<ChainId, string> = {
    starknet: 'Starknet',
    solana: 'Solana',
    stellar: 'Stellar',
}

export const CHAIN_COLORS: Record<ChainId, string> = {
    starknet: '#402AFF',
    solana: '#0F9B8E',
    stellar: '#E0761A',
}

export const CHAIN_ORDER: ChainId[] = ['starknet', 'solana', 'stellar']

export const NET_ORDER: NetKind[] = ['mainnet', 'testnet']

export const NET_LABELS: Record<NetKind, string> = {
    mainnet: 'Mainnet',
    testnet: 'Testnet',
}

/** Validated against the dataviz six checks on a white surface. */
export const NET_COLORS: Record<NetKind, string> = {
    mainnet: '#402AFF',
    testnet: '#0F9B8E',
}

/**
 * `wallets.network` is a free-form TEXT column, and Starknet's values carry no
 * chain prefix, so mainnet and testnet ids are enumerated rather than matched.
 */
export const MAINNET_NETWORKS: Record<ChainId, string[]> = {
    starknet: ['mainnet'],
    solana: ['solana-mainnet'],
    stellar: ['stellar-mainnet'],
}

export const TESTNET_NETWORKS: Record<ChainId, string[]> = {
    starknet: ['sepolia', 'goerli'],
    solana: ['solana-devnet', 'solana-testnet'],
    stellar: ['stellar-testnet'],
}

/**
 * `lib/constants/networks.ts` cannot be reused here: its `Chain` union has no
 * Stellar member, and its Starknet ids are the bare strings `mainnet` /
 * `sepolia` / `goerli` with no chain prefix.
 */
export function chainOfNetwork(network: string | null): ChainId | null {
    if (!network) return null
    if (network.startsWith('solana-')) return 'solana'
    if (network.startsWith('stellar-')) return 'stellar'
    if (network === 'mainnet' || network === 'sepolia' || network === 'goerli') return 'starknet'
    return null
}

/** An unrecognised network is dropped rather than guessed into either bucket. */
export function netOfNetwork(network: string | null): NetKind | null {
    if (!network) return null
    for (const kind of NET_ORDER) {
        const table = kind === 'mainnet' ? MAINNET_NETWORKS : TESTNET_NETWORKS
        if (CHAIN_ORDER.some((chain) => table[chain].includes(network))) return kind
    }
    return null
}
