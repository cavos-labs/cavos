import type { Metadata } from 'next'
import { AlternativesGuidePage } from '@/components/AlternativesGuidePage'
import { marketingPageMetadata } from '@/lib/marketing-seo'
import {
    MAGIC_ALTERNATIVES_DESCRIPTION,
    MAGIC_ALTERNATIVES_MODIFIED,
    MAGIC_ALTERNATIVES_PATH,
    MAGIC_ALTERNATIVES_PUBLISHED,
    MAGIC_ALTERNATIVES_TITLE,
    magicAlternativesGuide,
} from '@/lib/magic-alternatives'

export const metadata: Metadata = marketingPageMetadata({
    title: MAGIC_ALTERNATIVES_TITLE,
    description: MAGIC_ALTERNATIVES_DESCRIPTION,
    path: MAGIC_ALTERNATIVES_PATH,
    type: 'article',
    publishedTime: MAGIC_ALTERNATIVES_PUBLISHED,
    modifiedTime: MAGIC_ALTERNATIVES_MODIFIED,
})

export default function MagicAlternativesPage() {
    return <AlternativesGuidePage guide={magicAlternativesGuide} />
}
