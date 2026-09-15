import { createAdminClient } from '@/lib/supabase/admin'
import {
    CHAIN_LABELS,
    CHAIN_ORDER,
    MAINNET_NETWORKS,
    netOfNetwork,
    NET_ORDER,
    TESTNET_NETWORKS,
    type ChainId,
    type ChainStats,
    type NetSeriesPoint,
    type PublicStatsTotals,
    type Reading,
} from './types'

/** Event types that represent an operation Cavos relayed or sponsored. */
const SPONSORED_EVENT_TYPES = ['relay.submitted', 'transaction.recorded']

const GROWTH_MONTHS = 12
const OPERATIONS_WINDOW_DAYS = 90
const PAGE_SIZE = 1000
const MAX_PAGES = 100

/* eslint-disable @typescript-eslint/no-explicit-any */

let cached: ReturnType<typeof createAdminClient> | null = null

/**
 * RLS denies every table below to `anon`, so the service-role client is the
 * only way to read them. Nothing here hands rows back to a caller: each
 * function collapses to a scalar or a pre-bucketed series.
 */
function admin() {
    if (!cached) cached = createAdminClient()
    return cached
}

function table(name: string) {
    return admin().from(name)
}

function headCount(name: string) {
    return table(name).select('id', { count: 'exact', head: true })
}

async function resolveCount(query: any): Promise<Reading<number>> {
    try {
        const { count, error } = await query
        if (error) return null
        return count ?? null
    } catch {
        return null
    }
}

async function selectAll<T>(
    name: string,
    columns: string,
    refine?: (query: any) => any,
): Promise<Reading<T[]>> {
    try {
        const rows: T[] = []
        for (let page = 0; page < MAX_PAGES; page += 1) {
            const base = table(name).select(columns)
            const query = refine ? refine(base) : base
            const { data, error } = await query.range(
                page * PAGE_SIZE,
                page * PAGE_SIZE + PAGE_SIZE - 1,
            )
            if (error) return null
            if (!data || data.length === 0) break
            rows.push(...(data as T[]))
            if (data.length < PAGE_SIZE) break
        }
        return rows
    } catch {
        return null
    }
}

function networksOfKind(kind: 'mainnet' | 'testnet'): string[] {
    const table = kind === 'mainnet' ? MAINNET_NETWORKS : TESTNET_NETWORKS
    return CHAIN_ORDER.flatMap((chain) => table[chain])
}

function sumNumeric(values: (string | number | null | undefined)[]): number {
    return values.reduce<number>((total, value) => {
        const parsed = typeof value === 'string' ? Number(value) : (value ?? 0)
        return total + (Number.isFinite(parsed) ? parsed : 0)
    }, 0)
}

/**
 * The rollup only lands a day into `daily_operational_metrics` once its
 * `cavos_events` rows pass `expires_at` (30 days), so the recent window lives
 * in one table and the history in the other. Reading either alone undercounts.
 */
async function sponsoredOperations(): Promise<Reading<number>> {
    const [rolled, recent] = await Promise.all([
        selectAll<{ successes: number | string }>(
            'daily_operational_metrics',
            'successes',
            (q) => q.in('event_type', SPONSORED_EVENT_TYPES),
        ),
        resolveCount(
            headCount('cavos_events')
                .in('event_type', SPONSORED_EVENT_TYPES)
                .eq('status', 'success'),
        ),
    ])
    if (rolled === null && recent === null) return null
    const history = rolled === null ? 0 : sumNumeric(rolled.map((row) => row.successes))
    return history + (recent ?? 0)
}

/**
 * One boundary per month, oldest first. Each entry is labelled with the month
 * it closes, and its value is the cumulative count of everything created
 * before the boundary.
 */
function monthBoundaries(count: number): { label: string; before: string }[] {
    const now = new Date()
    const boundaries: { label: string; before: string }[] = []
    for (let back = count - 1; back >= 0; back -= 1) {
        const closes = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1))
        const before = new Date(Date.UTC(closes.getUTCFullYear(), closes.getUTCMonth() + 1, 1))
        boundaries.push({
            label: closes.toISOString().slice(0, 7),
            before: before.toISOString(),
        })
    }
    return boundaries
}

/**
 * Cumulative wallets at each month boundary, split by network kind. Head-counts
 * rather than streaming every `created_at`, so the curve is exact and no rows
 * move. Leading months with nothing in them are trimmed: a flat run of zeros
 * before the first wallet is chart furniture, not history.
 */
async function walletGrowth(): Promise<Reading<NetSeriesPoint[]>> {
    const points = await Promise.all(
        monthBoundaries(GROWTH_MONTHS).map(async ({ label, before }) => {
            const [mainnet, testnet] = await Promise.all(
                NET_ORDER.map((kind) =>
                    resolveCount(
                        headCount('wallets')
                            .in('network', networksOfKind(kind))
                            .lt('created_at', before),
                    ),
                ),
            )
            if (mainnet === null || testnet === null) return null
            return { date: label, mainnet, testnet }
        }),
    )
    if (points.some((point) => point === null)) return null
    const resolved = points as NetSeriesPoint[]
    const firstActive = resolved.findIndex((point) => point.mainnet + point.testnet > 0)
    return firstActive <= 0 ? resolved : resolved.slice(firstActive - 1)
}

/**
 * A continuous day-by-day axis over the whole window. Bucketing only the days
 * that carry events collapses the gaps and turns the x-axis into a category
 * list, which reads as a timeline while lying about the spacing.
 */
async function operationsByNet(): Promise<Reading<NetSeriesPoint[]>> {
    const since = new Date(Date.now() - OPERATIONS_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const sinceIso = since.toISOString()

    const [rolled, recent] = await Promise.all([
        selectAll<{ day: string; network: string | null; successes: number | string }>(
            'daily_operational_metrics',
            'day,network,successes',
            (q) => q.in('event_type', SPONSORED_EVENT_TYPES).gte('day', sinceIso.slice(0, 10)),
        ),
        selectAll<{ created_at: string; network: string | null }>(
            'cavos_events',
            'created_at,network',
            (q) =>
                q
                    .in('event_type', SPONSORED_EVENT_TYPES)
                    .eq('status', 'success')
                    .gte('created_at', sinceIso),
        ),
    ])
    if (rolled === null && recent === null) return null

    const buckets = new Map<string, NetSeriesPoint>()
    const startOfDay = Date.UTC(
        since.getUTCFullYear(),
        since.getUTCMonth(),
        since.getUTCDate(),
    )
    for (let offset = 0; offset <= OPERATIONS_WINDOW_DAYS; offset += 1) {
        const date = new Date(startOfDay + offset * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
        buckets.set(date, { date, mainnet: 0, testnet: 0 })
    }

    const add = (date: string, network: string | null, amount: number) => {
        const kind = netOfNetwork(network)
        const bucket = buckets.get(date)
        if (!kind || !bucket) return
        bucket[kind] += amount
    }

    for (const row of rolled ?? []) {
        add(String(row.day).slice(0, 10), row.network, sumNumeric([row.successes]))
    }
    for (const row of recent ?? []) {
        add(row.created_at.slice(0, 10), row.network, 1)
    }

    return [...buckets.values()]
}

function addReadings(a: Reading<number>, b: Reading<number>): Reading<number> {
    if (a === null && b === null) return null
    return (a ?? 0) + (b ?? 0)
}

async function chainStats(chain: ChainId): Promise<ChainStats> {
    const [mainnet, testnet] = await Promise.all([
        resolveCount(headCount('wallets').in('network', MAINNET_NETWORKS[chain])),
        resolveCount(headCount('wallets').in('network', TESTNET_NETWORKS[chain])),
    ])

    return {
        chain,
        label: CHAIN_LABELS[chain],
        walletsMainnet: mainnet,
        walletsTestnet: testnet,
        wallets: addReadings(mainnet, testnet),
    }
}

async function totals(): Promise<PublicStatsTotals> {
    const [sponsored, wallets, apps, organizations, devices, recovery] = await Promise.all([
        sponsoredOperations(),
        resolveCount(headCount('wallets')),
        resolveCount(headCount('apps')),
        resolveCount(headCount('organizations')),
        resolveCount(headCount('wallet_devices')),
        resolveCount(headCount('social_recovery_enrollments').eq('onchain_status', 'active')),
    ])

    return {
        sponsoredOperations: sponsored,
        walletsRegistered: wallets,
        apps,
        organizations,
        deviceSigners: devices,
        socialRecoveryWallets: recovery,
    }
}

export async function fetchSupabaseStats() {
    const [resolvedTotals, chains, growth, operations] = await Promise.all([
        totals(),
        Promise.all(CHAIN_ORDER.map((chain) => chainStats(chain))),
        walletGrowth(),
        operationsByNet(),
    ])
    return {
        totals: resolvedTotals,
        chains,
        walletGrowth: growth,
        operationsByNet: operations,
    }
}
