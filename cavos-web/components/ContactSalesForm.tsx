'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

/* ── Strong ease-out curve (emilkowalski) — entrances feel responsive ── */
const EASE = [0.23, 1, 0.32, 1] as const

const STEPS = ['Your email', 'Your info', "Let's talk"] as const

const REGIONS = [
    'United States', 'Canada', 'Mexico', 'Costa Rica', 'Brazil', 'Argentina',
    'United Kingdom', 'Germany', 'France', 'Spain', 'Portugal', 'Netherlands',
    'Italy', 'Switzerland', 'Sweden', 'Poland', 'United Arab Emirates', 'India',
    'Singapore', 'Japan', 'South Korea', 'Australia', 'Nigeria', 'South Africa',
    'Other',
]

const DIAL_CODES = [
    '+1', '+44', '+49', '+33', '+34', '+351', '+31', '+39', '+41', '+46',
    '+48', '+52', '+55', '+54', '+506', '+971', '+91', '+65', '+81', '+82',
    '+61', '+234', '+27',
]

const JOB_LEVELS = [
    'C-Level / Founder', 'VP', 'Director', 'Manager',
    'Individual Contributor', 'Student', 'Other',
]

const JOB_FUNCTIONS = [
    'Engineering', 'Product', 'Design', 'Operations', 'Finance',
    'Marketing', 'Sales / BD', 'Founder / Executive', 'Other',
]

type Form = {
    workEmail: string
    region: string
    firstName: string
    lastName: string
    dialCode: string
    phone: string
    companyWebsite: string
    jobLevel: string
    jobFunction: string
    telegram: string
    xHandle: string
}

const EMPTY: Form = {
    workEmail: '', region: '', firstName: '', lastName: '',
    dialCode: '+1', phone: '', companyWebsite: '',
    jobLevel: '', jobFunction: '', telegram: '', xHandle: '',
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export function ContactSalesForm() {
    const reduce = useReducedMotion()
    const [step, setStep] = useState(0)
    const [form, setForm] = useState<Form>(EMPTY)
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

    const step1Valid = isEmail(form.workEmail) && !!form.region
    const step2Valid =
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.phone.trim().length >= 4 &&
        form.companyWebsite.trim().length >= 2 &&
        form.jobLevel &&
        form.jobFunction

    const canContinue = step === 0 ? step1Valid : step === 1 ? !!step2Valid : true

    async function submit() {
        setSubmitting(true)
        setError(null)
        try {
            const res = await fetch('/api/contact-sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Something went wrong.')
            }
            setDone(true)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong.')
        } finally {
            setSubmitting(false)
        }
    }

    /* Container + child variants drive the 30–80ms field stagger */
    const container: Variants = {
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : 0.05 } },
    }
    const item: Variants = reduce
        ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
        : {
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
        }

    const panelMotion = reduce
        ? {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: 0.15 },
        }
        : {
            initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
            animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
            exit: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
            transition: { duration: 0.28, ease: EASE },
        }

    return (
        <div className="w-full max-w-[560px]">
            {/* Stepper */}
            <div className="grid grid-cols-3 gap-3 mb-7">
                {STEPS.map((label, i) => {
                    const active = i === step
                    const complete = i < step || done
                    return (
                        <div key={label} className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] transition-colors duration-200 ${complete
                                        ? 'border-brand bg-brand text-white'
                                        : active
                                            ? 'border-brand text-brand'
                                            : 'border-line-strong text-transparent'
                                        }`}
                                >
                                    {complete ? '✓' : ''}
                                </span>
                                <span
                                    className={`truncate text-sm font-medium transition-colors duration-200 ${active || complete ? 'text-ink' : 'text-muted'
                                        }`}
                                >
                                    {label}
                                </span>
                            </div>
                            <div className="relative mt-2 h-[3px] w-full overflow-hidden rounded-full bg-line">
                                <motion.div
                                    className="absolute inset-y-0 left-0 rounded-full bg-brand"
                                    initial={false}
                                    animate={{ width: complete ? '100%' : active ? '100%' : '0%' }}
                                    transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-line bg-white p-7 shadow-[0_1px_2px_rgba(10,10,15,0.04),0_12px_40px_-12px_rgba(10,10,15,0.10)] sm:p-9">
                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div key="done" {...panelMotion} className="py-6 text-center">
                            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#402AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Thanks — we got it.</h1>
                            <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
                                Our team will reach out to <span className="text-ink">{form.workEmail}</span> shortly. Talk soon.
                            </p>
                            <Link href="/" className="mt-7 inline-block">
                                <Button variant="outline">Back to home</Button>
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div key={step} {...panelMotion}>
                            {step === 0 && (
                                <StepShell
                                    title="The basics"
                                    subtitle="Start here — about a minute."
                                    container={container}
                                >
                                    <motion.div variants={item}>
                                        <Field
                                            label="Work email"
                                            type="email"
                                            placeholder="you@company.com"
                                            value={form.workEmail}
                                            onChange={set('workEmail')}
                                            autoFocus
                                        />
                                    </motion.div>
                                    <motion.div variants={item}>
                                        <SelectField
                                            label="Country / Region"
                                            placeholder="Select a region"
                                            value={form.region}
                                            onChange={set('region')}
                                            options={REGIONS}
                                        />
                                    </motion.div>
                                </StepShell>
                            )}

                            {step === 1 && (
                                <StepShell
                                    title="How can we reach you?"
                                    subtitle="A bit more so the right person follows up."
                                    container={container}
                                >
                                    <motion.div variants={item} className="grid grid-cols-2 gap-3">
                                        <Field label="First name" value={form.firstName} onChange={set('firstName')} autoFocus />
                                        <Field label="Last name" value={form.lastName} onChange={set('lastName')} />
                                    </motion.div>

                                    <motion.div variants={item}>
                                        <label className="mb-1.5 block text-sm font-medium text-ink/80">Phone number</label>
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <select
                                                    value={form.dialCode}
                                                    onChange={(e) => set('dialCode')(e.target.value)}
                                                    className="h-10 appearance-none rounded-lg border border-line-strong bg-white pl-3 pr-8 text-sm text-ink transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                                                >
                                                    {DIAL_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <Chevron />
                                            </div>
                                            <input
                                                type="tel"
                                                inputMode="tel"
                                                placeholder="555 000 1234"
                                                value={form.phone}
                                                onChange={(e) => set('phone')(e.target.value)}
                                                className="h-10 w-full rounded-lg border border-line-strong bg-white px-3.5 text-sm text-ink transition-colors placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                                            />
                                        </div>
                                    </motion.div>

                                    <motion.div variants={item}>
                                        <Field
                                            label="Company website"
                                            placeholder="company.com"
                                            value={form.companyWebsite}
                                            onChange={set('companyWebsite')}
                                        />
                                    </motion.div>

                                    <motion.div variants={item} className="grid grid-cols-2 gap-3">
                                        <SelectField label="Job level" placeholder="Select" value={form.jobLevel} onChange={set('jobLevel')} options={JOB_LEVELS} />
                                        <SelectField label="Job function" placeholder="Select" value={form.jobFunction} onChange={set('jobFunction')} options={JOB_FUNCTIONS} />
                                    </motion.div>

                                    <motion.div variants={item} className="grid grid-cols-2 gap-3">
                                        <Field label="Telegram" optional placeholder="@handle" value={form.telegram} onChange={set('telegram')} />
                                        <Field label="X / Twitter" optional placeholder="@handle" value={form.xHandle} onChange={set('xHandle')} />
                                    </motion.div>
                                </StepShell>
                            )}

                            {step === 2 && (
                                <StepShell
                                    title="Review and submit"
                                    subtitle="Make sure everything looks right before we reach out."
                                    container={container}
                                >
                                    <motion.dl variants={item} className="divide-y divide-line rounded-xl border border-line">
                                        <Review label="Work email" value={form.workEmail} />
                                        <Review label="Region" value={form.region} />
                                        <Review label="Name" value={`${form.firstName} ${form.lastName}`.trim()} />
                                        <Review label="Phone" value={`${form.dialCode} ${form.phone}`.trim()} />
                                        <Review label="Company website" value={form.companyWebsite} />
                                        <Review label="Job level" value={form.jobLevel} />
                                        <Review label="Job function" value={form.jobFunction} />
                                        <Review label="Telegram" value={form.telegram} />
                                        <Review label="X / Twitter" value={form.xHandle} />
                                    </motion.dl>
                                    {error && (
                                        <motion.p variants={item} className="mt-3 text-sm text-red-600">{error}</motion.p>
                                    )}
                                </StepShell>
                            )}

                            {/* Nav */}
                            <div className="mt-8 flex items-center justify-between">
                                {step > 0 ? (
                                    <Button variant="ghost" onClick={() => { setError(null); setStep((s) => s - 1) }} disabled={submitting}>
                                        Back
                                    </Button>
                                ) : <span />}

                                {step < 2 ? (
                                    <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
                                        Continue
                                        <Arrow />
                                    </Button>
                                ) : (
                                    <Button onClick={submit} loading={submitting}>
                                        Submit
                                        {!submitting && <Arrow />}
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

/* ── Sub-components ─────────────────────────────────────────── */

function StepShell({
    title, subtitle, container, children,
}: {
    title: string; subtitle: string; container: Variants; children: React.ReactNode
}) {
    return (
        <div>
            <h2 className="text-[18px] font-semibold leading-tight tracking-[-0.02em] text-ink">{title}</h2>
            <p className="mt-1 text-[14px] text-muted">{subtitle}</p>
            <motion.div variants={container} initial="hidden" animate="show" className="mt-7 space-y-4">
                {children}
            </motion.div>
        </div>
    )
}

function Field({
    label, value, onChange, type = 'text', placeholder, optional, autoFocus,
}: {
    label: string; value: string; onChange: (v: string) => void
    type?: string; placeholder?: string; optional?: boolean; autoFocus?: boolean
}) {
    return (
        <div className="w-full">
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink/80">
                {label}
                {optional && <span className="text-xs font-normal text-muted">Optional</span>}
            </label>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                autoFocus={autoFocus}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-line-strong bg-white px-3.5 text-sm text-ink transition-colors placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
        </div>
    )
}

function SelectField({
    label, value, onChange, options, placeholder,
}: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string
}) {
    return (
        <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-ink/80">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`h-10 w-full appearance-none rounded-lg border border-line-strong bg-white pl-3.5 pr-9 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 ${value ? 'text-ink' : 'text-muted/70'}`}
                >
                    <option value="" disabled>{placeholder}</option>
                    {options.map((o) => <option key={o} value={o} className="text-ink">{o}</option>)}
                </select>
                <Chevron />
            </div>
        </div>
    )
}

function Review({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 px-4 py-2.5">
            <dt className="text-[13px] text-muted">{label}</dt>
            <dd className="text-right text-[13px] font-medium text-ink">{value?.trim() || <span className="text-muted/60">—</span>}</dd>
        </div>
    )
}

function Chevron() {
    return (
        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function Arrow() {
    return (
        <svg className="ml-1.5" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
