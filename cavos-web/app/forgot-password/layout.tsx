import { noindexFollowMetadata } from '@/lib/marketing-seo'

export const metadata = noindexFollowMetadata('Forgot password')

export default function ForgotPasswordLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
