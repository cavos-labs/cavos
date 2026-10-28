import type { Metadata } from 'next'
import { AlternativesGuidePage } from '@/components/AlternativesGuidePage'
import { marketingPageMetadata } from '@/lib/marketing-seo'
import {
    TURNKEY_ALTERNATIVES_DESCRIPTION,
    TURNKEY_ALTERNATIVES_MODIFIED,
    TURNKEY_ALTERNATIVES_PATH,
    TURNKEY_ALTERNATIVES_PUBLISHED,
    TURNKEY_ALTERNATIVES_TITLE,
    turnkeyAlternativesGuide,
} from '@/lib/turnkey-alternatives'

export const metadata: Metadata = marketingPageMetadata({
    title: TURNKEY_ALTERNATIVES_TITLE,
    description: TURNKEY_ALTERNATIVES_DESCRIPTION,
    path: TURNKEY_ALTERNATIVES_PATH,
    type: 'article',
    publishedTime: TURNKEY_ALTERNATIVES_PUBLISHED,
    modifiedTime: TURNKEY_ALTERNATIVES_MODIFIED,
})

export default function TurnkeyAlternativesPage() {
    return <AlternativesGuidePage guide={turnkeyAlternativesGuide} />
}
