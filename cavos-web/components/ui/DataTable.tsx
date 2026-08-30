import React from 'react'

interface DataTableProps {
    headers: React.ReactNode[]
    children: React.ReactNode
    className?: string
}

export function DataTable({ headers, children, className = '' }: DataTableProps) {
    return (
        <div className={`overflow-x-auto rounded-xl border border-line bg-white ${className}`}>
            <table className="w-full text-left text-sm">
                <thead className="bg-surface">
                    <tr>
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                className="px-4 py-2.5 text-[10px] font-medium text-muted"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-line/70">{children}</tbody>
            </table>
        </div>
    )
}

export function DataTableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <tr className={className}>{children}</tr>
}

export function DataTableCell({ children, mono, className = '' }: { children: React.ReactNode; mono?: boolean; className?: string }) {
    return (
        <td className={`px-4 py-3 ${mono ? 'font-mono tabular-nums text-xs text-muted' : ''} ${className}`}>
            {children}
        </td>
    )
}
