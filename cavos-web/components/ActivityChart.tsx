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
import { Card } from '@/components/ui/Card'

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
            <Card className="h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
            </Card>
        )
    }

    if (!data || data.length === 0) {
        return (
            <Card className="h-[400px] flex items-center justify-center text-black/40">
                No activity data available
            </Card>
        )
    }

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Activity Overview</h3>
            <div className="h-[300px] w-full">
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
                                <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#666666" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#666666" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666666', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666666', fontSize: 12 }}
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
                            stroke="#000000"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorWallets)"
                        />
                        <Area
                            type="monotone"
                            dataKey="transactions"
                            name="Transactions"
                            stroke="#666666"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorTx)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
