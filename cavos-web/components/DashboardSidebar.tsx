import Link from 'next/link'

interface DashboardSidebarProps {
    currentPage: 'overview' | 'organizations' | 'apps'
}

export function DashboardSidebar({ currentPage }: DashboardSidebarProps) {
    return (
        <aside className="hidden md:block fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-white border-r border-black/10 p-6">
            <nav className="space-y-2">
                <Link
                    href="/dashboard"
                    className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${currentPage === 'overview'
                            ? 'bg-black/5 text-black'
                            : 'text-black/60 hover:text-black hover:bg-black/5'
                        }`}
                >
                    Overview
                </Link>
                <Link
                    href="/dashboard/organizations"
                    className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${currentPage === 'organizations'
                            ? 'bg-black/5 text-black'
                            : 'text-black/60 hover:text-black hover:bg-black/5'
                        }`}
                >
                    Organizations
                </Link>
                <Link
                    href="/dashboard/apps"
                    className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${currentPage === 'apps'
                            ? 'bg-black/5 text-black'
                            : 'text-black/60 hover:text-black hover:bg-black/5'
                        }`}
                >
                    Applications
                </Link>
            </nav>
        </aside>
    )
}
