import type { Metadata } from 'next'
import { AlternativesGuidePage } from '@/components/AlternativesGuidePage'
import { marketingPageMetadata } from '@/lib/marketing-seo'
import {
    DYNAMIC_ALTERNATIVES_DESCRIPTION,
    DYNAMIC_ALTERNATIVES_MODIFIED,
    DYNAMIC_ALTERNATIVES_PATH,
    DYNAMIC_ALTERNATIVES_PUBLISHED,
    DYNAMIC_ALTERNATIVES_TITLE,
    dynamicAlternativesGuide,
} from '@/lib/dynamic-alternatives'

export const metadata: Metadata = marketingPageMetadata({
    title: DYNAMIC_ALTERNATIVES_TITLE,
    description: DYNAMIC_ALTERNATIVES_DESCRIPTION,
    path: DYNAMIC_ALTERNATIVES_PATH,
    type: 'article',
    publishedTime: DYNAMIC_ALTERNATIVES_PUBLISHED,
    modifiedTime: DYNAMIC_ALTERNATIVES_MODIFIED,
})

export default function DynamicAlternativesPage() {
    return <AlternativesGuidePage guide={dynamicAlternativesGuide} />
}
