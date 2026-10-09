import { noindexFollowMetadata } from '@/lib/marketing-seo'
import { DashboardShell } from './DashboardShell'

export const metadata = noindexFollowMetadata('Dashboard')

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <DashboardShell>{children}</DashboardShell>
}
