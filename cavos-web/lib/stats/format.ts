import type { Reading } from './types'

/** A failed read is an em dash, never a zero. A zero would be a false claim. */
export const UNREADABLE = '—'

export function formatCount(value: Reading<number>): string {
    if (value === null) return UNREADABLE
    return value.toLocaleString('en-US')
}

export function formatMonth(iso: string): string {
    const [year, month] = iso.split('-')
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
    return date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
}

export function formatDay(iso: string): string {
    const date = new Date(`${iso}T00:00:00Z`)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function formatTimestamp(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
    })
}
