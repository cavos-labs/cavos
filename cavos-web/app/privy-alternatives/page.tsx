import type { Metadata } from 'next'
import { AlternativesGuidePage } from '@/components/AlternativesGuidePage'
import { marketingPageMetadata } from '@/lib/marketing-seo'
import {
    PRIVY_ALTERNATIVES_DESCRIPTION,
    PRIVY_ALTERNATIVES_MODIFIED,
    PRIVY_ALTERNATIVES_PATH,
    PRIVY_ALTERNATIVES_PUBLISHED,
    PRIVY_ALTERNATIVES_TITLE,
    privyAlternativesGuide,
} from '@/lib/privy-alternatives'

export const metadata: Metadata = marketingPageMetadata({
    title: PRIVY_ALTERNATIVES_TITLE,
    description: PRIVY_ALTERNATIVES_DESCRIPTION,
    path: PRIVY_ALTERNATIVES_PATH,
    type: 'article',
    publishedTime: PRIVY_ALTERNATIVES_PUBLISHED,
    modifiedTime: PRIVY_ALTERNATIVES_MODIFIED,
})

export default function PrivyAlternativesPage() {
    return <AlternativesGuidePage guide={privyAlternativesGuide} />
}
