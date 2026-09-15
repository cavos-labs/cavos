import { getPublicStats } from '@/lib/stats'
import { NextResponse } from 'next/server'

export const revalidate = 3600

// GET /api/public/stats - Aggregated public metrics. No auth: returns scalars only.
export async function GET() {
    try {
        const stats = await getPublicStats()
        return NextResponse.json(stats, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        })
    } catch (error) {
        console.error('Error building public stats:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
