'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppWindow, Building2, Check, ExternalLink, KeyRound, PlugZap, Sparkles, X } from 'lucide-react'
import { CavosProviderCodeBlock } from '@/components/CavosProviderCodeBlock'

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
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-black hover:shadow-md transition-all duration-200 active:scale-[0.98] whitespace-nowrap w-full sm:w-auto'

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
  const [done, setDone] = useState<Record<string, boolean>>({})

  const steps = useMemo(() => ([
    {
      id: 'org',
      title: 'Create organization and get API key',
      description: 'Create your organization, then copy an org API key for the SDK and paymaster.',
      icon: <Building2 className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />,
      cta: { label: 'Create organization', href: '/dashboard/organizations/new', external: false },
      secondaryCta: { label: 'Org API keys', href: '/dashboard/organizations' },
      optional: false,
    },
    {
      id: 'app',
      title: 'Create app and get app id',
      description: 'Create an application under your org, then copy the app id for CavosProvider and the SDK.',
      icon: <AppWindow className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />,
      cta: { label: 'Create app', href: '/dashboard/apps/new', external: false },
      secondaryCta: { label: 'Applications', href: '/dashboard/apps' },
      optional: false,
    },
    {
      id: 'oauth',
      title: 'Configure OAuth providers (Google, Apple, Email)',
      description: 'Set up Google, Apple, and Email authentication for your users.',
      icon: <PlugZap className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />,
      secondaryCta: { label: 'Web installation', href: 'https://docs.cavos.xyz/web/installation', external: true },
      cta: { label: 'Mobile installation', href: 'https://docs.cavos.xyz/react-native/installation', external: true },
      optional: false,
    },
    {
      id: 'paymaster',
      title: 'Add STRK for your paymaster and get your paymaster key',
      description: 'Fund your paymaster with STRK and copy the paymasterApiKey to enable your application to send transactions.',
      icon: <KeyRound className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />,
      cta: { label: 'Open org API keys', href: '/dashboard/organizations/ec6c8494-850c-4bfa-8a64-2fba818059ae', external: false },
      secondaryCta: { label: 'Billing', href: '/dashboard/billing' },
      optional: false,
    },
    {
      id: 'grant',
      title: '(Optional) Apply for Starknet Propulsion Grant to fund gas',
      description: 'Explore Starknet grants if you want funding support for transaction costs.',
      icon: <Sparkles className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />,
      cta: { label: 'Open grants', href: 'https://airtable.com/appfoRv2ottjRfTpL/pag0G55zA8aU4V9bD/form', external: true },
      optional: true,
    },
    {
      id: 'sdk',
      title: 'Install SDK and go live',
      description: 'Install the SDK, configure CavosProvider, and start onboarding users.',
      icon: <Sparkles className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />,
      cta: { label: 'Open quickstart', href: 'https://docs.cavos.xyz/quickstart', external: true },
      optional: false,
    },
  ]), [])

  useEffect(() => {
    try {
      const next: Record<string, boolean> = {}
      for (const stepId of ['org', 'app', 'oauth', 'paymaster', 'grant', 'sdk']) {
        next[stepId] = localStorage.getItem(`${DONE_KEY_PREFIX}${stepId}`) === '1'
      }
      setDone(next)
    } catch {
      // ignore localStorage access failures
    }
  }, [])

  const progress = useMemo(() => {
    const required = steps.filter(s => !s.optional)
    const completed = required.filter(s => done[s.id]).length
    const pct = Math.round((completed / required.length) * 100)
    const allDone = completed === required.length
    return { completed, total: required.length, pct, allDone }
  }, [done, steps])

  const toggleDone = (stepId: string) => {
    setDone((prev) => {
      const next = { ...prev, [stepId]: !prev[stepId] }
      try { localStorage.setItem(`${DONE_KEY_PREFIX}${stepId}`, next[stepId] ? '1' : '0') } catch {}
      return next
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-400 mb-2">Getting started</p>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-neutral-800" />
          How to start
        </h1>
        <p className="text-sm text-neutral-500 mt-2 font-medium max-w-2xl leading-relaxed">
          Step-by-step checklist for your newest app. Follow the guide to get everything running.
        </p>
      </div>

      {/* Checklist */}
      <div className="bg-white/80 backdrop-blur-xl border border-neutral-200/80 shadow-sm rounded-3xl p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-bold text-neutral-900">Setup checklist</p>
              <p className="text-sm text-neutral-500 mt-1 font-medium">
                {progress.completed} of {progress.total} completed · {progress.pct}%
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-2 bg-neutral-100 border border-neutral-200 shadow-inner rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-neutral-800 to-black rounded-full transition-all duration-700 ease-in-out" style={{ width: `${progress.pct}%` }} />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {steps
              .map((s, idx) => (
                <div key={s.id} className="group relative bg-white border border-neutral-200 rounded-2xl p-5 hover:border-neutral-300 hover:shadow-md transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-neutral-50 border border-neutral-200/60 shadow-sm flex items-center justify-center shrink-0 group-hover:bg-neutral-900 group-hover:text-white group-hover:border-neutral-800 transition-colors duration-300">
                        {s.icon}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <div className="flex items-center gap-2.5">
                          <p className="text-sm font-bold text-neutral-900">{s.title}</p>
                          {done[s.id] && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200/50">
                              <Check className="w-3 h-3" />
                              Done
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-1 leading-relaxed max-w-xl">{s.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3 shrink-0 mt-4 sm:mt-0">
                      {s.secondaryCta?.href && (
                        s.secondaryCta.external ? (
                          <CtaButton href={s.secondaryCta.href} external>
                            {s.secondaryCta.label}
                          </CtaButton>
                        ) : (
                          <Link
                            href={s.secondaryCta.href}
                            className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-neutral-200 text-sm font-semibold rounded-xl hover:bg-neutral-50 hover:border-neutral-300 focus:ring-2 focus:ring-neutral-200 transition-all active:scale-95 w-full sm:w-auto"
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
                    <div className="mt-5 sm:ml-14 max-w-2xl">
                      <div className="rounded-2xl overflow-hidden border border-neutral-200/60 bg-black shadow-lg ring-1 ring-black/5">
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
                    <div className="mt-5 sm:ml-14 max-w-2xl">
                      <div className="rounded-2xl overflow-hidden border border-neutral-200/60 bg-black shadow-lg ring-1 ring-black/5">
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
                    <div className="mt-5 sm:ml-14 max-w-2xl">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-3">
                        CavosProvider (web)
                      </p>
                      <CavosProviderCodeBlock />
                    </div>
                  )}

                  {s.id === 'paymaster' && (
                    <div className="mt-5 sm:ml-14 max-w-2xl">
                      <div className="rounded-2xl overflow-hidden border border-neutral-200/60 bg-black shadow-lg ring-1 ring-black/5">
                        <video
                          controls
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          className="w-full h-auto"
                        >
                          <source src="/videos/paymaster.mp4" type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  )}

                  {s.id === 'sdk' && (
                    <div className="mt-5 sm:ml-14 max-w-2xl space-y-5">
                      <div>
                        <div className="rounded-2xl overflow-hidden border border-neutral-200/60 bg-black shadow-lg ring-1 ring-black/5">
                          <video
                            controls
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            className="w-full h-auto"
                          >
                            <source src="/videos/demo.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-2">
                          Web
                        </p>
                        <pre className="overflow-x-auto rounded-xl border border-neutral-200/60 bg-neutral-900 px-4 py-3 font-mono text-[13px] text-neutral-100 shadow-inner">
                          <code>npm install @cavos/react starknet</code>
                        </pre>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-2">
                          Mobile
                        </p>
                        <pre className="overflow-x-auto rounded-xl border border-neutral-200/60 bg-neutral-900 px-4 py-3 font-mono text-[13px] text-neutral-100 shadow-inner">
                          <code>npm install @cavos/react-native starknet</code>
                        </pre>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide mb-2">
                          Scaffold app
                        </p>
                        <pre className="overflow-x-auto rounded-xl border border-neutral-200/60 bg-neutral-900 px-4 py-3 font-mono text-[13px] text-neutral-100 shadow-inner">
                          <code>npx create-cavos-appx</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 sm:ml-14">
                    <button
                      onClick={() => toggleDone(s.id)}
                      aria-pressed={Boolean(done[s.id])}
                      className={`group inline-flex items-center justify-center w-full sm:w-auto gap-2.5 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all duration-300 active:scale-95 ${
                        done[s.id]
                          ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-500/20'
                          : 'bg-white text-neutral-700 border-neutral-200 shadow-sm hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                          done[s.id]
                            ? 'border-transparent bg-white text-green-500'
                            : 'border-neutral-300 bg-neutral-50 group-hover:border-neutral-400 group-hover:bg-white shadow-inner'
                        }`}
                      >
                        {done[s.id] && <Check strokeWidth={3} className="w-3.5 h-3.5" />}
                      </span>
                      {done[s.id] ? 'Completed' : 'Mark as done'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
    </div>
  )
}

