import { fetchPackageStats, PUBLISHED_PACKAGES } from './npm'
import { fetchSupabaseStats } from './supabase'
import { CHAIN_LABELS, CHAIN_ORDER, type PublicStats } from './types'

export * from './types'
export { PUBLISHED_PACKAGES } from './npm'

function unreadableSupabase(): Awaited<ReturnType<typeof fetchSupabaseStats>> {
    return {
        totals: {
            sponsoredOperations: null,
            walletsRegistered: null,
            apps: null,
            organizations: null,
            deviceSigners: null,
            socialRecoveryWallets: null,
        },
        chains: CHAIN_ORDER.map((chain) => ({
            chain,
            label: CHAIN_LABELS[chain],
            walletsMainnet: null,
            walletsTestnet: null,
            wallets: null,
        })),
        walletGrowth: null,
        operationsByNet: null,
    }
}

function unreadablePackages(): PublicStats['packages'] {
    return PUBLISHED_PACKAGES.map((name) => ({
        name,
        latestVersion: null,
        downloads30d: null,
        series: null,
    }))
}

/**
 * The two sources are settled independently. npm going down must not blank the
 * Supabase half of the page, and vice versa.
 */
export async function getPublicStats(): Promise<PublicStats> {
    const [database, packages] = await Promise.allSettled([
        fetchSupabaseStats(),
        fetchPackageStats(),
    ])

    const resolvedDatabase =
        database.status === 'fulfilled' ? database.value : unreadableSupabase()
    const resolvedPackages =
        packages.status === 'fulfilled' ? packages.value : unreadablePackages()

    return {
        generatedAt: new Date().toISOString(),
        ...resolvedDatabase,
        packages: resolvedPackages,
    }
}
