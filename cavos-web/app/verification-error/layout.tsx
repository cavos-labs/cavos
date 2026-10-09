import { noindexFollowMetadata } from '@/lib/marketing-seo'

export const metadata = noindexFollowMetadata('Verification error')

export default function VerificationErrorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
