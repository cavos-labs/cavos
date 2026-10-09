import { noindexFollowMetadata } from '@/lib/marketing-seo'

export const metadata = noindexFollowMetadata('Register')

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
