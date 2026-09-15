import type { DayPoint, PackageStats, Reading } from './types'

/** Adding a package is a one-line change. */
export const PUBLISHED_PACKAGES = [
    '@cavos/kit',
    '@cavos/react',
    '@cavos/reserve',
] as const

const DOWNLOADS_BASE = process.env.NPM_DOWNLOADS_BASE_URL ?? 'https://api.npmjs.org'
const REGISTRY_BASE = process.env.NPM_REGISTRY_BASE_URL ?? 'https://registry.npmjs.org'

const REVALIDATE_SECONDS = 3600

async function getJson<T>(url: string): Promise<Reading<T>> {
    try {
        const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } })
        if (!response.ok) return null
        return (await response.json()) as T
    } catch {
        return null
    }
}

async function downloadsLastMonth(name: string): Promise<Reading<number>> {
    const body = await getJson<{ downloads?: number }>(
        `${DOWNLOADS_BASE}/downloads/point/last-month/${name}`,
    )
    return typeof body?.downloads === 'number' ? body.downloads : null
}

async function dailySeries(name: string): Promise<Reading<DayPoint[]>> {
    const body = await getJson<{ downloads?: { day: string; downloads: number }[] }>(
        `${DOWNLOADS_BASE}/downloads/range/last-month/${name}`,
    )
    if (!Array.isArray(body?.downloads)) return null
    return body.downloads.map((entry) => ({ date: entry.day, value: entry.downloads }))
}

async function latestVersion(name: string): Promise<Reading<string>> {
    const body = await getJson<{ 'dist-tags'?: { latest?: string } }>(
        `${REGISTRY_BASE}/${name}`,
    )
    return body?.['dist-tags']?.latest ?? null
}

async function packageStats(name: string): Promise<PackageStats> {
    const [downloads, series, version] = await Promise.all([
        downloadsLastMonth(name),
        dailySeries(name),
        latestVersion(name),
    ])
    return { name, downloads30d: downloads, series, latestVersion: version }
}

export async function fetchPackageStats(): Promise<PackageStats[]> {
    return Promise.all(PUBLISHED_PACKAGES.map((name) => packageStats(name)))
}
