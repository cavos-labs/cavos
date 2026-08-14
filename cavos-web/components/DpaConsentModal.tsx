'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'

export function DpaConsentModal() {
    const [show, setShow] = useState(false)
    const [accepting, setAccepting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const check = async () => {
            // Only show for authenticated users
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const res = await fetch('/api/user/accept-dpa')
            if (!res.ok) return
            const data = await res.json()
            if (!data.accepted) setShow(true)
        }
        check()
    }, [])

    const handleAccept = async () => {
        setAccepting(true)
        setError(null)
        try {
            const res = await fetch('/api/user/accept-dpa', { method: 'POST' })
            if (!res.ok) throw new Error('request failed')
            setShow(false)
        } catch {
            // An error has to explain the corrective action, not just stop the
            // spinner and leave the user pressing a button that does nothing.
            setError("We couldn't record your acceptance. Check your connection and try again.")
            setAccepting(false)
        }
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        // No onClose: this is a blocking legal step. Escape and scrim dismissal
        // are intentionally off — "Log out instead" is the way out.
        <Modal open={show} labelledBy="dpa-modal-title">
            <div className="bg-white rounded-2xl border border-line shadow-2xl w-full max-w-md overflow-hidden">

                    {/* Header */}
                    <div className="bg-brand px-6 py-5">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-white/[0.07] border border-white/[0.1] flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 id="dpa-modal-title" className="text-sm font-bold text-white">Updated legal agreements</h2>
                        </div>
                        {/* white/40 on the brand indigo was well under 4.5:1 —
                            supporting copy still has to be readable. */}
                        <p className="text-xs text-white/75 leading-relaxed">
                            We&apos;ve published our Data Processing Agreement and Privacy Policy. Please review and accept to continue using Cavos.
                        </p>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-3">
                        <div className="bg-surface border border-line rounded-xl p-4 space-y-2.5">
                            <AgreementItem
                                href="/dpa"
                                title="Data Processing Agreement"
                                description="How Cavos processes your users' data as a GDPR-compliant processor."
                            />
                            <div className="h-px bg-line" />
                            <AgreementItem
                                href="/privacy"
                                title="Privacy Policy"
                                description="What data we collect about you as a developer and how we use it."
                            />
                        </div>

                        <p className="text-[11px] text-black/35 leading-relaxed">
                            By clicking &ldquo;Accept and continue&rdquo; you agree to these agreements. Your acceptance will be recorded with a timestamp for compliance purposes.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6 flex flex-col gap-2">
                        {error && (
                            <p role="alert" className="text-xs text-red-600 leading-relaxed">
                                {error}
                            </p>
                        )}
                        <button
                            onClick={handleAccept}
                            disabled={accepting}
                            data-pressable
                            className="w-full py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-hover disabled:opacity-60 transition-colors duration-150"
                        >
                            {accepting ? 'Saving…' : error ? 'Try again' : 'Accept and continue'}
                        </button>
                        <button
                            onClick={handleLogout}
                            data-pressable
                            className="w-full py-2.5 text-xs font-medium text-black/50 hover:text-black/80 transition-colors"
                        >
                            Log out instead
                        </button>
                    </div>
            </div>
        </Modal>
    )
}

function AgreementItem({ href, title, description }: { href: string; title: string; description: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-xs font-semibold text-black/80">{title}</p>
                <p className="text-[11px] text-black/40 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <Link
                href={href}
                target="_blank"
                className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-black/40 hover:text-black border border-line hover:border-line-strong px-2.5 py-1.5 rounded-lg transition-all"
            >
                Review
            </Link>
        </div>
    )
}
