import { noindexFollowMetadata } from '@/lib/marketing-seo'

export const metadata = noindexFollowMetadata('Sign in')

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
