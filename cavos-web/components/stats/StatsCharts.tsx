'use client'

import { useMemo, useState, type ReactNode } from 'react'
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { formatDay, formatMonth } from '@/lib/stats/format'
import {
    NET_COLORS,
    NET_LABELS,
    NET_ORDER,
    type DayPoint,
    type NetKind,
    type NetSeriesPoint,
} from '@/lib/stats/types'

const GRID = '#F0F0F4'
const AXIS_TICK = { fill: '#A5A5B3', fontSize: 11 } as const
const CHART_HEIGHT = 260

/* ── Shell and controls ─────────────────────────────────────────────── */

function Panel({
    title,
    readout,
    controls,
    children,
}: {
    title: string
    readout: ReactNode
    controls?: ReactNode
    children: ReactNode
}) {
    return (
        <div data-reveal className="flex flex-col rounded-xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
                    <div className="mt-1.5">{readout}</div>
                </div>
                {controls}
            </div>
            <div className="mt-5 border-t border-line pt-5">{children}</div>
        </div>
    )
}

function Readout({ value, caption }: { value: string; caption: string }) {
    return (
        <>
            <p className="font-mono text-2xl font-semibold tabular-nums leading-none text-ink">
                {value}
            </p>
            <p className="mt-1.5 text-[11px] text-muted">{caption}</p>
        </>
    )
}

function Segmented<T extends string>({
    options,
    value,
    onChange,
    label,
}: {
    options: { value: T; label: string }[]
    value: T
    onChange: (next: T) => void
    label: string
}) {
    return (
        <div
            role="group"
            aria-label={label}
            className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5"
        >
            {options.map((option) => {
                const selected = option.value === value
                return (
                    <button
                        key={option.value}
                        type="button"
                        data-pressable
                        aria-pressed={selected}
                        onClick={() => onChange(option.value)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 ${
                            selected
                                ? 'bg-white text-ink shadow-[0_1px_2px_-1px_rgba(10,10,15,0.16)]'
                                : 'text-muted hover:text-ink'
                        }`}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}

/** The legend is the series control: clicking a name isolates or restores it. */
function Legend({
    hidden,
    onToggle,
    totals,
}: {
    hidden: Record<NetKind, boolean>
    onToggle: (kind: NetKind) => void
    totals: Record<NetKind, number>
}) {
    return (
        <div className="mb-4 flex flex-wrap items-center gap-4">
            {NET_ORDER.map((kind) => {
                const off = hidden[kind]
                return (
                    <button
                        key={kind}
                        type="button"
                        aria-pressed={!off}
                        onClick={() => onToggle(kind)}
                        className={`group flex items-center gap-2 text-[11px] font-medium transition-opacity duration-150 ${
                            off ? 'opacity-40' : 'opacity-100'
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className="h-2 w-2 rounded-sm ring-1 ring-inset ring-black/10"
                            style={{
                                backgroundColor: off ? 'transparent' : NET_COLORS[kind],
                            }}
                        />
                        <span className="text-muted group-hover:text-ink">{NET_LABELS[kind]}</span>
                        <span className="font-mono tabular-nums text-ink/70">
                            {totals[kind].toLocaleString('en-US')}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

function Unavailable({ label }: { label: string }) {
    return (
        <div
            className="flex items-center justify-center rounded-lg border border-dashed border-line text-sm text-muted"
            style={{ height: CHART_HEIGHT }}
        >
            {label}
        </div>
    )
}

interface TooltipEntry {
    name?: string
    value?: number
    color?: string
}

function ChartTooltip({
    active,
    payload,
    label,
    labelFormatter,
}: {
    active?: boolean
    payload?: TooltipEntry[]
    label?: string | number
    labelFormatter?: (value: string) => string
}) {
    if (!active || !payload || payload.length === 0) return null
    const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0)

    return (
        <div className="rounded-lg border border-line-strong bg-white px-3 py-2.5 shadow-[0_8px_24px_-12px_rgba(10,10,15,0.18)]">
            <p className="font-mono text-[11px] tabular-nums text-muted">
                {labelFormatter ? labelFormatter(String(label)) : String(label)}
            </p>
            <div className="mt-2 space-y-1">
                {payload.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2.5">
                        <span
                            aria-hidden="true"
                            className="h-2 w-2 shrink-0 rounded-sm"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-[12px] text-muted">{entry.name}</span>
                        <span className="ml-auto font-mono text-[12px] font-medium tabular-nums text-ink">
                            {(entry.value ?? 0).toLocaleString('en-US')}
                        </span>
                    </div>
                ))}
                {payload.length > 1 ? (
                    <div className="flex items-center gap-6 border-t border-line pt-1">
                        <span className="text-[12px] text-muted">Total</span>
                        <span className="ml-auto font-mono text-[12px] font-medium tabular-nums text-ink">
                            {total.toLocaleString('en-US')}
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

function useSeriesToggle() {
    const [hidden, setHidden] = useState<Record<NetKind, boolean>>({
        mainnet: false,
        testnet: false,
    })
    const toggle = (kind: NetKind) =>
        setHidden((current) => {
            const next = { ...current, [kind]: !current[kind] }
            // Never let the reader hide every series and stare at an empty grid.
            if (NET_ORDER.every((each) => next[each])) return current
            return next
        })
    return { hidden, toggle }
}

/** Recharts reports the active index as a number or a string, depending on chart. */
function useHoverIndex() {
    const [index, setIndex] = useState<number | null>(null)
    const handlers = {
        onMouseMove: (state: { activeTooltipIndex?: number | string | null }) => {
            const raw = state?.activeTooltipIndex
            const parsed = typeof raw === 'string' ? Number(raw) : raw
            setIndex(typeof parsed === 'number' && Number.isInteger(parsed) ? parsed : null)
        },
        onMouseLeave: () => setIndex(null),
    }
    return { index, handlers }
}

/* ── Wallets registered ─────────────────────────────────────────────── */

type GrowthMode = 'cumulative' | 'net'

const GROWTH_MODES: { value: GrowthMode; label: string }[] = [
    { value: 'cumulative', label: 'Total' },
    { value: 'net', label: 'New' },
]

export function GrowthPanel({ data }: { data: NetSeriesPoint[] | null }) {
    const [mode, setMode] = useState<GrowthMode>('cumulative')
    const { hidden, toggle } = useSeriesToggle()
    const { index, handlers } = useHoverIndex()

    const series = useMemo(() => {
        if (!data) return null
        if (mode === 'cumulative') return data
        return data.map((point, i) => {
            const previous = i === 0 ? null : data[i - 1]
            return {
                date: point.date,
                mainnet: point.mainnet - (previous?.mainnet ?? 0),
                testnet: point.testnet - (previous?.testnet ?? 0),
            }
        })
    }, [data, mode])

    if (!series || series.length === 0) {
        return (
            <Panel title="Wallets registered" readout={<Readout value="—" caption="No history" />}>
                <Unavailable label="Wallet history is unavailable right now." />
            </Panel>
        )
    }

    const active = index !== null && series[index] ? series[index] : series[series.length - 1]
    const visible = NET_ORDER.filter((kind) => !hidden[kind])
    const shown = visible.reduce((sum, kind) => sum + active[kind], 0)
    // The legend tracks whatever the readout is describing: the hovered month,
    // or the latest one when the cursor is away.
    const legendTotals = { mainnet: active.mainnet, testnet: active.testnet }

    return (
        <Panel
            title="Wallets registered"
            readout={
                <Readout
                    value={shown.toLocaleString('en-US')}
                    caption={`${mode === 'cumulative' ? 'Total by' : 'New in'} ${formatMonth(active.date)} · ${visible.map((kind) => NET_LABELS[kind]).join(' + ')}`}
                />
            }
            controls={
                <Segmented
                    label="Wallet count mode"
                    options={GROWTH_MODES}
                    value={mode}
                    onChange={setMode}
                />
            }
        >
            <Legend hidden={hidden} onToggle={toggle} totals={legendTotals} />
            <div style={{ height: CHART_HEIGHT }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        key={mode}
                        data={series}
                        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                        {...handlers}
                    >
                        <defs>
                            {NET_ORDER.map((kind) => (
                                <linearGradient
                                    key={kind}
                                    id={`statsGrowth-${kind}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor={NET_COLORS[kind]} stopOpacity={0.22} />
                                    <stop offset="100%" stopColor={NET_COLORS[kind]} stopOpacity={0.04} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="2 5" vertical={false} stroke={GRID} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatMonth}
                            axisLine={false}
                            tickLine={false}
                            tick={AXIS_TICK}
                            dy={10}
                            interval="preserveStartEnd"
                            minTickGap={16}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={AXIS_TICK}
                            width={40}
                            allowDecimals={false}
                        />
                        <Tooltip
                            cursor={{ stroke: '#C9C9D2', strokeWidth: 1 }}
                            content={<ChartTooltip labelFormatter={formatMonth} />}
                        />
                        {NET_ORDER.filter((kind) => !hidden[kind]).map((kind) => (
                            <Area
                                key={kind}
                                type="monotone"
                                dataKey={kind}
                                name={NET_LABELS[kind]}
                                stackId="wallets"
                                stroke={NET_COLORS[kind]}
                                strokeWidth={2}
                                fill={`url(#statsGrowth-${kind})`}
                                fillOpacity={1}
                                isAnimationActive={false}
                                dot={false}
                                activeDot={{
                                    r: 4,
                                    fill: NET_COLORS[kind],
                                    stroke: '#fff',
                                    strokeWidth: 2,
                                }}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Panel>
    )
}

/* ── Sponsored operations ───────────────────────────────────────────── */

const RANGES: { value: string; label: string; days: number }[] = [
    { value: '7d', label: '7d', days: 7 },
    { value: '30d', label: '30d', days: 30 },
    { value: '90d', label: '90d', days: 90 },
]

export function OperationsPanel({ data }: { data: NetSeriesPoint[] | null }) {
    const [range, setRange] = useState('90d')
    const { hidden, toggle } = useSeriesToggle()
    const { index, handlers } = useHoverIndex()

    const days = RANGES.find((option) => option.value === range)?.days ?? 90
    const series = useMemo(() => (data ? data.slice(-days) : null), [data, days])

    if (!series || series.length === 0) {
        return (
            <Panel
                title="Sponsored operations"
                readout={<Readout value="—" caption="No history" />}
            >
                <Unavailable label="Operation history is unavailable right now." />
            </Panel>
        )
    }

    const visible = NET_ORDER.filter((kind) => !hidden[kind])
    const totals = {
        mainnet: series.reduce((sum, row) => sum + row.mainnet, 0),
        testnet: series.reduce((sum, row) => sum + row.testnet, 0),
    }
    const hovered = index !== null ? series[index] : null
    const shown = hovered
        ? visible.reduce((sum, kind) => sum + hovered[kind], 0)
        : visible.reduce((sum, kind) => sum + totals[kind], 0)
    const activeDays = series.filter((row) => row.mainnet + row.testnet > 0)

    return (
        <Panel
            title="Sponsored operations"
            readout={
                <Readout
                    value={shown.toLocaleString('en-US')}
                    caption={
                        hovered
                            ? `On ${formatDay(hovered.date)} · ${visible.map((kind) => NET_LABELS[kind]).join(' + ')}`
                            : `Across the last ${days} days · ${visible.map((kind) => NET_LABELS[kind]).join(' + ')}`
                    }
                />
            }
            controls={
                <Segmented
                    label="Time range"
                    options={RANGES.map(({ value, label }) => ({ value, label }))}
                    value={range}
                    onChange={setRange}
                />
            }
        >
            <Legend
                hidden={hidden}
                onToggle={toggle}
                totals={hovered ? { mainnet: hovered.mainnet, testnet: hovered.testnet } : totals}
            />
            <div style={{ height: CHART_HEIGHT }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        key={range}
                        data={series}
                        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                        {...handlers}
                    >
                        <CartesianGrid strokeDasharray="2 5" vertical={false} stroke={GRID} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatDay}
                            axisLine={false}
                            tickLine={false}
                            tick={AXIS_TICK}
                            dy={10}
                            interval="preserveStartEnd"
                            minTickGap={48}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={AXIS_TICK}
                            width={40}
                            allowDecimals={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(10,10,15,0.04)' }}
                            content={<ChartTooltip labelFormatter={formatDay} />}
                        />
                        {NET_ORDER.filter((kind) => !hidden[kind]).map((kind, position, shownKinds) => (
                            <Bar
                                key={kind}
                                dataKey={kind}
                                name={NET_LABELS[kind]}
                                stackId="ops"
                                fill={NET_COLORS[kind]}
                                isAnimationActive={false}
                                radius={position === shownKinds.length - 1 ? [2, 2, 0, 0] : undefined}
                                maxBarSize={days > 30 ? 10 : 22}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {activeDays.length > 0 ? (
                <details className="mt-5 border-t border-line pt-3">
                    <summary className="cursor-pointer text-[11px] font-medium text-muted">
                        View the {activeDays.length} active days as a table
                    </summary>
                    <div className="mt-3 max-h-64 overflow-auto">
                        <table className="w-full border-collapse text-left">
                            <thead className="bg-surface">
                                <tr>
                                    <th className="px-3 py-2 text-xs font-medium text-muted">Day</th>
                                    {NET_ORDER.map((kind) => (
                                        <th
                                            key={kind}
                                            className="px-3 py-2 text-xs font-medium text-muted"
                                        >
                                            {NET_LABELS[kind]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line/70">
                                {activeDays.map((row) => (
                                    <tr key={row.date}>
                                        <th
                                            scope="row"
                                            className="px-3 py-2 text-left font-mono text-xs font-normal tabular-nums text-muted"
                                        >
                                            {formatDay(row.date)}
                                        </th>
                                        {NET_ORDER.map((kind) => (
                                            <td
                                                key={kind}
                                                className="px-3 py-2 font-mono text-xs tabular-nums text-ink"
                                            >
                                                {row[kind].toLocaleString('en-US')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>
            ) : null}
        </Panel>
    )
}

/* ── SDK sparkline ──────────────────────────────────────────────────── */

export function DownloadsSparkline({ data, id }: { data: DayPoint[] | null; id: string }) {
    if (!data || data.length === 0) {
        return <div style={{ height: 48 }} aria-hidden="true" />
    }

    const fillId = `statsSpark-${id.replace(/[^a-zA-Z0-9]/g, '-')}`

    return (
        <div style={{ height: 48 }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#402AFF" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#402AFF" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <Tooltip
                        cursor={{ stroke: '#C9C9D2', strokeWidth: 1 }}
                        content={<ChartTooltip labelFormatter={formatDay} />}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        name="Downloads"
                        stroke="#402AFF"
                        strokeWidth={1.75}
                        fill={`url(#${fillId})`}
                        fillOpacity={1}
                        isAnimationActive={false}
                        dot={false}
                        activeDot={{ r: 3, fill: '#402AFF', stroke: '#fff', strokeWidth: 1.5 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
