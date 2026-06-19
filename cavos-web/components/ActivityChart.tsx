'use client'

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
interface ActivityChartProps {
    data: {
        date: string
        wallets: number
        transactions: number
    }[]
    loading?: boolean
}

export function ActivityChart({ data, loading }: ActivityChartProps) {
    if (loading) {
        return (
            <div className="rounded-xl bg-white border border-line h-[300px] flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
            </div>
        )
    }

    if (!data || data.length === 0) {
        return (
            <div className="rounded-xl bg-white border border-line h-[300px] flex items-center justify-center text-black/40 text-sm">
                No activity data available
            </div>
        )
    }

    return (
        <div className="rounded-xl bg-white border border-line p-5" data-dash-panel>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-line">
                <h3 className="text-[13px] font-bold text-ink">Activity</h3>
                <span className="text-[11px] font-medium text-black/40">Last 7 days</span>
            </div>
            <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorWallets" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#402AFF" stopOpacity={0.18} />
                                <stop offset="95%" stopColor="#402AFF" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.12} />
                                <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECECF0" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                            width={28}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E5E5E5',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                            itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                            labelStyle={{ color: '#666666', marginBottom: '4px', fontSize: '12px' }}
                        />
                        <Legend
                            verticalAlign="top"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="wallets"
                            name="New Wallets"
                            stroke="#402AFF"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorWallets)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#402AFF', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="transactions"
                            name="Transactions"
                            stroke="#9CA3AF"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorTx)"
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
