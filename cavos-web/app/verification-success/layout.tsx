import { noindexFollowMetadata } from '@/lib/marketing-seo'

export const metadata = noindexFollowMetadata('Email verified')

export default function VerificationSuccessLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
