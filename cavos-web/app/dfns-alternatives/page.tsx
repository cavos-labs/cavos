import type { Metadata } from 'next'
import { AlternativesGuidePage } from '@/components/AlternativesGuidePage'
import { marketingPageMetadata } from '@/lib/marketing-seo'
import {
    DFNS_ALTERNATIVES_DESCRIPTION,
    DFNS_ALTERNATIVES_MODIFIED,
    DFNS_ALTERNATIVES_PATH,
    DFNS_ALTERNATIVES_PUBLISHED,
    DFNS_ALTERNATIVES_TITLE,
    dfnsAlternativesGuide,
} from '@/lib/dfns-alternatives'

export const metadata: Metadata = marketingPageMetadata({
    title: DFNS_ALTERNATIVES_TITLE,
    description: DFNS_ALTERNATIVES_DESCRIPTION,
    path: DFNS_ALTERNATIVES_PATH,
    type: 'article',
    publishedTime: DFNS_ALTERNATIVES_PUBLISHED,
    modifiedTime: DFNS_ALTERNATIVES_MODIFIED,
})

export default function DfnsAlternativesPage() {
    return <AlternativesGuidePage guide={dfnsAlternativesGuide} />
}
