import { noindexFollowMetadata } from '@/lib/marketing-seo'

export const metadata = noindexFollowMetadata('Reset password')

export default function AppsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
