'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AppWindow, Building2, Check, ExternalLink, KeyRound, PlugZap, Sparkles, X } from 'lucide-react'
import { CavosProviderCodeBlock } from '@/components/CavosProviderCodeBlock'

const DISMISS_KEY = 'cavos:onboarding:how-to-start:dismissed'
const DONE_KEY_PREFIX = 'cavos:onboarding:how-to-start:done:'

function CtaButton({
  href,
  external,
  children,
}: {
  href: string
  external?: boolean
  children: React.ReactNode
}) {
  const className =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0A0908] text-white text-sm font-semibold rounded-xl hover:bg-black/85 transition-all active:scale-[0.98] whitespace-nowrap'

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
        <ExternalLink className="w-4 h-4 text-white/70" />
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

export default function HowToStartPage() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      const next: Record<string, boolean> = {}
      for (const stepId of ['org', 'app', 'oauth', 'paymaster', 'grant', 'sdk']) {
        next[stepId] = localStorage.getItem(`${DONE_KEY_PREFIX}${stepId}`) === '1'
      }
      return next
    } catch {
      return {}
    }
  })

  const steps = useMemo(() => ([
    {
      id: 'org',
      title: 'Create organization and get API key',
      description: 'Create your organization, then copy an org API key for the SDK and paymaster.',
      icon: <Building2 className="w-4 h-4 text-black/45" />,
      cta: { label: 'Create organization', href: '/dashboard/organizations/new', external: false },
      secondaryCta: { label: 'Org API keys', href: '/dashboard/organizations' },
      optional: false,
    },
    {
      id: 'app',
      title: 'Create app and get app id',
      description: 'Create an application under your org, then copy the app id for CavosProvider and the SDK.',
      icon: <AppWindow className="w-4 h-4 text-black/45" />,
      cta: { label: 'Create app', href: '/dashboard/apps/new', external: false },
      secondaryCta: { label: 'Applications', href: '/dashboard/apps' },
      optional: false,
    },
    {
      id: 'oauth',
      title: 'Configure OAuth providers (Google, Apple, Email)',
      description: 'Set up Google, Apple, and Email authentication for your users.',
      icon: <PlugZap className="w-4 h-4 text-black/45" />,
      secondaryCta: { label: 'Web installation', href: 'https://docs.cavos.xyz/web/installation', external: true },
      cta: { label: 'Mobile installation', href: 'https://docs.cavos.xyz/react-native/installation', external: true },
      optional: false,
    },
    {
      id: 'paymaster',
      title: 'Set up paymaster → get paymasterApiKey',
      description: 'Generate an org API key and use it as paymasterApiKey in your SDK config.',
      icon: <KeyRound className="w-4 h-4 text-black/45" />,
      cta: { label: 'Open org API keys', href: '/dashboard/organizations', external: false },
      secondaryCta: { label: 'Billing', href: '/dashboard/billing' },
      optional: false,
    },
    {
      id: 'grant',
      title: '(Optional) Apply for Starknet Propulsion Grant to fund gas',
      description: 'Explore Starknet grants if you want funding support for transaction costs.',
      icon: <Sparkles className="w-4 h-4 text-black/45" />,
      cta: { label: 'Open grants', href: 'https://www.starknet.io/grants/', external: true },
      optional: true,
    },
    {
      id: 'sdk',
      title: 'Install SDK and go live',
      description: 'Install the SDK, configure CavosProvider, and start onboarding users.',
      icon: <Sparkles className="w-4 h-4 text-black/45" />,
      cta: { label: 'Open quickstart', href: 'https://docs.cavos.xyz/quickstart.md', external: true },
      optional: false,
    },
  ]), [])

  const progress = useMemo(() => {
    const required = steps.filter(s => !s.optional)
    const completed = required.filter(s => done[s.id]).length
    const pct = Math.round((completed / required.length) * 100)
    const allDone = completed === required.length
    return { completed, total: required.length, pct, allDone }
  }, [done, steps])

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
    setDismissed(true)
  }

  const toggleDone = (stepId: string) => {
    setDone((prev) => {
      const next = { ...prev, [stepId]: !prev[stepId] }
      try { localStorage.setItem(`${DONE_KEY_PREFIX}${stepId}`, next[stepId] ? '1' : '0') } catch {}
      return next
    })
  }

  return (
    <div className="space-y-6 animate-fadeIn w-full">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/30 mb-1.5">Getting started</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-black/35" />
          How to start
        </h1>
        <p className="text-xs text-black/45 mt-1 font-medium max-w-2xl">
          Step-by-step checklist for your newest app. Complete the required steps to unlock “Dismiss”.
        </p>
      </div>

      {/* Checklist */}
      {!dismissed && (
        <div className="bg-white border border-[#EAE5DC] rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Setup checklist</p>
              <p className="text-xs text-black/40 mt-0.5">
                {progress.completed} of {progress.total} completed · {progress.pct}%
              </p>
            </div>

            {progress.allDone && (
              <button
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-black/35 hover:text-black transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Dismiss
              </button>
            )}
          </div>

          <div className="mt-4">
            <div className="h-1.5 bg-[#F7F5F2] border border-[#EAE5DC] rounded-full overflow-hidden">
              <div className="h-full bg-[#0A0908] rounded-full transition-all" style={{ width: `${progress.pct}%` }} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {steps
              .map((s) => (
                <div key={s.id} className="bg-[#F7F5F2]/40 border border-[#EAE5DC] rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#EAE5DC] flex items-center justify-center shrink-0">
                        {s.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-black/70">{s.title}</p>
                          {done[s.id] && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-black/35">
                              <Check className="w-3 h-3" />
                              Done
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-black/45 mt-1 leading-relaxed">{s.description}</p>

                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {s.secondaryCta?.href && (
                        s.secondaryCta.external ? (
                          <CtaButton href={s.secondaryCta.href} external>
                            {s.secondaryCta.label}
                          </CtaButton>
                        ) : (
                          <Link
                            href={s.secondaryCta.href}
                            className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-[#EAE5DC] text-sm font-semibold rounded-xl hover:border-[#C4BFB6] transition-all"
                          >
                            {s.secondaryCta.label}
                          </Link>
                        )
                      )}
                      <CtaButton href={s.cta.href} external={s.cta.external}>
                        {s.cta.label}
                      </CtaButton>
                    </div>
                  </div>

                  {s.id === 'org' && (
                    <div className="mt-4 flex justify-center">
                      <div className="w-full max-w-xs rounded-xl overflow-hidden border border-[#EAE5DC] bg-black">
                        <video
                          controls
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          className="w-full h-auto"
                        >
                          <source src="/videos/createOrg.mp4" type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  )}

                  {s.id === 'app' && (
                    <div className="mt-4 flex justify-center">
                      <div className="w-full max-w-xs rounded-xl overflow-hidden border border-[#EAE5DC] bg-black">
                        <video
                          controls
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          className="w-full h-auto"
                        >
                          <source src="/videos/createApp.mp4" type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  )}

                  {s.id === 'oauth' && (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold text-black/40 uppercase tracking-wide mb-2">
                        CavosProvider (web)
                      </p>
                      <CavosProviderCodeBlock />
                    </div>
                  )}

                  <div className="mt-3">
                    <button
                      onClick={() => toggleDone(s.id)}
                      aria-pressed={Boolean(done[s.id])}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        done[s.id]
                          ? 'bg-[#0A0908] text-white border-[#0A0908]'
                          : 'bg-white text-black/50 border-[#EAE5DC] hover:border-[#C4BFB6] hover:text-black/70'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all ${
                          done[s.id]
                            ? 'border-white/40 bg-white/15'
                            : 'border-black/20 bg-transparent'
                        }`}
                      >
                        {done[s.id] && <Check className="w-3 h-3" />}
                      </span>
                      {done[s.id] ? 'Completed' : 'Mark as done'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

