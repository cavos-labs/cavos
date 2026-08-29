/* ──────────────────────────────────────────────────────────────
   SignInPreview — static replica of the Cavos hosted wallet
   widget. Sits on the brand indigo stage the same way the
   playground demo does: a white card on a saturated field,
   accent used for the interactive cue (email), not the chrome.
   Decorative — the real widget lives at demo.cavos.xyz.
   ────────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react'

function GoogleG() {
    return (
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3C39.9 36 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z" />
        </svg>
    )
}

function AppleGlyph() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M16.36 12.78c.02 2.3 2.02 3.06 2.04 3.07-.02.05-.32 1.1-1.05 2.18-.63.93-1.29 1.86-2.32 1.88-1.01.02-1.34-.6-2.5-.6-1.15 0-1.51.58-2.47.62-1 .04-1.76-1-2.4-1.93-1.3-1.9-2.3-5.35-.96-7.69.66-1.16 1.85-1.9 3.14-1.92.98-.02 1.9.66 2.5.66.6 0 1.72-.82 2.9-.7.49.02 1.88.2 2.77 1.5-.07.05-1.65.97-1.63 2.9M14.5 6.2c.53-.64.89-1.54.79-2.43-.76.03-1.69.51-2.24 1.15-.49.56-.92 1.47-.8 2.34.85.07 1.71-.43 2.25-1.06" />
        </svg>
    )
}

function CavosMark({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden>
            <path
                fill="currentColor"
                d="M16 1.2c.32 0 .58.22.66.53l2.04 7.62a1.2 1.2 0 0 0 .86.86l7.62 2.04c.31.08.53.34.53.66s-.22.58-.53.66l-7.62 2.04a1.2 1.2 0 0 0-.86.86l-2.04 7.62c-.08.31-.34.53-.66.53s-.58-.22-.66-.53l-2.04-7.62a1.2 1.2 0 0 0-.86-.86L3.33 15.57C3.02 15.49 2.8 15.23 2.8 14.91s.22-.58.53-.66l7.62-2.04a1.2 1.2 0 0 0 .86-.86l2.04-7.62c.08-.31.34-.53.66-.53Z"
            />
        </svg>
    )
}

function Method({
    icon,
    label,
}: {
    icon: ReactNode
    label: string
}) {
    return (
        <div className="flex h-12 items-center justify-center gap-2.5 rounded-2xl border border-line bg-white px-4 text-[13.5px] font-medium text-ink">
            {icon}
            {label}
        </div>
    )
}

export function SignInPreview() {
    return (
        <div className="mx-auto w-full max-w-[340px]">
            <div className="rounded-[16px] bg-white p-6 shadow-[0_28px_80px_-28px_rgba(10,10,15,0.45)] ring-1 ring-black/[0.06] sm:p-7">
                <div className="flex flex-col items-center">
                    <span className="grid h-10 w-10 place-items-center text-ink">
                        <CavosMark className="h-7 w-7" />
                    </span>
                    <p className="mt-4 text-[17px] font-medium tracking-[-0.03em] text-ink">
                        Sign in or sign up
                    </p>
                </div>

                <div className="mt-6 space-y-2.5">
                    <Method icon={<GoogleG />} label="Continue with Google" />
                    <Method icon={<AppleGlyph />} label="Continue with Apple" />
                    <Method
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand" aria-hidden>
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                                <path d="m3 7 9 6 9-6" />
                            </svg>
                        }
                        label="Continue with email"
                    />
                </div>

                <p className="mt-6 text-center text-[11px] leading-relaxed text-ink/40">
                    By continuing you agree to the Privacy Policy &amp; Terms
                </p>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] font-medium text-ink/35">
                    <CavosMark className="h-3 w-3" />
                    Secured by Cavos
                </p>
            </div>
        </figure>
    )
}
