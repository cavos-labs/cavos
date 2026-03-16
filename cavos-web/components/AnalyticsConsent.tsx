'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'

const CONSENT_KEY = 'cavos_analytics_consent'

export function AnalyticsConsent() {
    const [consent, setConsent] = useState<'accepted' | 'declined' | null>(null)

    useEffect(() => {
        const stored = localStorage.getItem(CONSENT_KEY)
        if (stored === 'accepted' || stored === 'declined') {
            setConsent(stored)
        } else {
            setConsent(null) // show banner
        }
    }, [])

    const accept = () => {
        localStorage.setItem(CONSENT_KEY, 'accepted')
        setConsent('accepted')
    }

    const decline = () => {
        localStorage.setItem(CONSENT_KEY, 'declined')
        setConsent('declined')
    }

    return (
        <>
            {consent === 'accepted' && <Analytics />}

            {consent === null && (
                <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 bg-[#0A0908] text-white rounded-2xl p-4 shadow-xl border border-white/[0.08]">
                    <p className="text-xs text-white/60 mb-3 leading-relaxed">
                        We use anonymous analytics to understand how developers use Cavos.
                        No personal data is collected.{' '}
                        <a
                            href="/privacy"
                            className="underline underline-offset-2 hover:text-white transition-colors"
                        >
                            Privacy Policy
                        </a>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={accept}
                            className="flex-1 py-2 text-xs font-semibold bg-white text-black rounded-lg hover:bg-white/90 transition-all"
                        >
                            Accept
                        </button>
                        <button
                            onClick={decline}
                            className="flex-1 py-2 text-xs font-semibold text-white/50 border border-white/[0.12] rounded-lg hover:text-white hover:border-white/25 transition-all"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
