import type { Metadata } from 'next'
import { AlternativesGuidePage } from '@/components/AlternativesGuidePage'
import { marketingPageMetadata } from '@/lib/marketing-seo'
import {
    PARA_ALTERNATIVES_DESCRIPTION,
    PARA_ALTERNATIVES_MODIFIED,
    PARA_ALTERNATIVES_PATH,
    PARA_ALTERNATIVES_PUBLISHED,
    PARA_ALTERNATIVES_TITLE,
    paraAlternativesGuide,
} from '@/lib/para-alternatives'

export const metadata: Metadata = marketingPageMetadata({
    title: PARA_ALTERNATIVES_TITLE,
    description: PARA_ALTERNATIVES_DESCRIPTION,
    path: PARA_ALTERNATIVES_PATH,
    type: 'article',
    publishedTime: PARA_ALTERNATIVES_PUBLISHED,
    modifiedTime: PARA_ALTERNATIVES_MODIFIED,
})

export default function ParaAlternativesPage() {
    return <AlternativesGuidePage guide={paraAlternativesGuide} />
}
