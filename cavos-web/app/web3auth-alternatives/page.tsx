import type { Metadata } from 'next'
import { AlternativesGuidePage } from '@/components/AlternativesGuidePage'
import { marketingPageMetadata } from '@/lib/marketing-seo'
import {
    WEB3AUTH_ALTERNATIVES_DESCRIPTION,
    WEB3AUTH_ALTERNATIVES_MODIFIED,
    WEB3AUTH_ALTERNATIVES_PATH,
    WEB3AUTH_ALTERNATIVES_PUBLISHED,
    WEB3AUTH_ALTERNATIVES_TITLE,
    web3authAlternativesGuide,
} from '@/lib/web3auth-alternatives'

export const metadata: Metadata = marketingPageMetadata({
    title: WEB3AUTH_ALTERNATIVES_TITLE,
    description: WEB3AUTH_ALTERNATIVES_DESCRIPTION,
    path: WEB3AUTH_ALTERNATIVES_PATH,
    type: 'article',
    publishedTime: WEB3AUTH_ALTERNATIVES_PUBLISHED,
    modifiedTime: WEB3AUTH_ALTERNATIVES_MODIFIED,
})

export default function Web3AuthAlternativesPage() {
    return <AlternativesGuidePage guide={web3authAlternativesGuide} />
}
