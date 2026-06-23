'use client'

/* ──────────────────────────────────────────────────────────────
   CaseStudies — customer stories, Stripe-clean. Portrait brand
   tiles (logo on the art), a one-line caption, and a "Read story"
   link. Clicking opens a polished modal with the full story.
   Light, restrained, lots of whitespace. No eyebrow tags, no chips.
   ────────────────────────────────────────────────────────────── */

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

gsap.registerPlugin(useGSAP)

/* ── Data ─────────────────────────────────────────────────────── */
interface Study {
    id: string
    name: string
    role: string
    accent: string
    storyLabel: string
    caption: string
    challenge: string
    built: string
    facts: { k: string; v: string }[]
}

const STUDIES: Study[] = [
    {
        id: 'jokers',
        name: 'Jokers of Neon',
        role: 'On-chain mobile game · custom appchain',
        accent: '#E8590C',
        storyLabel: "Read Jokers of Neon's story",
        caption: 'Jokers of Neon embeds self-custodial wallets into its on-chain mobile game.',
        challenge:
            'Jokers of Neon runs on its own dedicated appchain (Katana). Every player needed a real on-chain account inside a mobile game, with no seed phrases, no extensions, nothing that breaks the flow of play.',
        built:
            'We delivered a custom Cavos implementation wired directly into their Katana instance and shipped embedded wallets into their mobile app. Players sign in and get a self-custodial smart account automatically, ready to transact in-game from the first tap. The wallet disappears into the experience.',
        facts: [
            { k: 'Chain', v: 'Custom appchain (Katana)' },
            { k: 'Platform', v: 'Native mobile app' },
            { k: 'Wallet', v: 'Embedded · self-custodial' },
            { k: 'Player UX', v: 'Zero seed phrases' },
        ],
    },
    {
        id: 'cofiblocks',
        name: 'CofiBlocks',
        role: 'Coffee commerce platform',
        accent: '#2D7161',
        storyLabel: "Read CofiBlocks' story",
        caption: 'CofiBlocks lets coffee buyers pay producers in crypto, with no wallet in sight.',
        challenge:
            'CofiBlocks connects coffee drinkers directly with producers, cutting out the middlemen. Their buyers are everyday coffee lovers, not crypto users, so paying on-chain could not feel like crypto at all.',
        built:
            'We enabled a platform where consumers buy directly from the producer and settle in crypto, with the wallet provisioned invisibly behind a normal login. Users check out and pay without ever knowing an on-chain account was created for them. Self-custody, none of the friction.',
        facts: [
            { k: 'Network', v: 'L2 mainnet' },
            { k: 'Platform', v: 'Web marketplace' },
            { k: 'Payments', v: 'Direct producer → buyer' },
            { k: 'Wallet', v: 'Invisible · gas abstracted' },
        ],
    },
]

const Arrow = ({ className = '' }: { className?: string }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
        <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
)

const ExpandIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
)

/* ── Tile artwork (brand-specific) ────────────────────────────── */
function JokersTile() {
    return (
        <div className="absolute inset-0 bg-black">
            <Image
                src="/assets/jokers/boss_s3_1.png"
                alt=""
                fill
                aria-hidden
                sizes="(max-width: 768px) 100vw, 540px"
                className="select-none object-contain object-bottom drop-shadow-[0_30px_70px_rgba(0,0,0,0.6)] transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
            />
            <Image
                src="/assets/jokers/logo-white.svg"
                alt="Jokers of Neon"
                width={132}
                height={22}
                className="absolute bottom-6 left-6 z-10 h-[48px] w-auto opacity-95"
            />
        </div>
    )
}

/* curated beans framing the edges (top/left/right/bottom), clear centre.
   {t,l} = position %, s = size px, r = base rotation deg */
const BEANS = [
    { t: 4, l: 22, s: 54, r: 18 }, { t: -2, l: 44, s: 46, r: -25 }, { t: 8, l: 82, s: 58, r: 30 },
    { t: 22, l: 4, s: 50, r: -12 }, { t: 30, l: 92, s: 44, r: 22 },
    { t: 48, l: 12, s: 40, r: 40 }, { t: 58, l: 88, s: 56, r: -18 },
    { t: 80, l: 30, s: 60, r: 14 }, { t: 90, l: 60, s: 48, r: -30 }, { t: 76, l: 80, s: 42, r: 25 },
]

function CoffeeBeans() {
    const ref = useRef<HTMLDivElement>(null)

    useGSAP(
        () => {
            const root = ref.current
            if (!root) return
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
            gsap.utils.toArray<HTMLElement>('[data-bean]', root).forEach((bean, i) => {
                gsap.to(bean, {
                    y: gsap.utils.random(-12, 12),
                    x: gsap.utils.random(-6, 6),
                    rotation: `+=${gsap.utils.random(-14, 14)}`,
                    duration: gsap.utils.random(3.5, 6),
                    ease: 'sine.inOut',
                    repeat: -1,
                    yoyo: true,
                    delay: i * 0.18,
                })
            })
        },
        { scope: ref },
    )

    return (
        <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {BEANS.map((b, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    key={i}
                    data-bean
                    src="/assets/cofiblocks/cafe.png"
                    alt=""
                    style={{ top: `${b.t}%`, left: `${b.l}%`, width: `${b.s}px`, transform: `rotate(${b.r}deg)` }}
                    className="absolute -translate-x-1/2 select-none drop-shadow-[0_8px_14px_rgba(0,0,0,0.16)]"
                />
            ))}
        </div>
    )
}

function CofiTile() {
    return (
        <div className="absolute inset-0 bg-[#2D7161]">
            {/* beans framing the edges */}
            <CoffeeBeans />

            {/* flat logo + wordmark, crisp vector on the green */}
            <Image
                src="/assets/cofiblocks/logo.svg"
                alt="CofiBlocks"
                width={267}
                height={267}
                className="absolute left-1/2 top-1/2 z-10 w-[84%] max-w-[360px] -translate-x-1/2 -translate-y-1/2 transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
            />
        </div>
    )
}

/* ── Card ─────────────────────────────────────────────────────── */
function Card({ study, onOpen }: { study: Study; onOpen: () => void }) {
    return (
        <div data-reveal-item className="group flex flex-col">
            <button
                type="button"
                onClick={onOpen}
                className="relative block aspect-[5/6] w-full overflow-hidden rounded-2xl ring-1 ring-line transition-shadow duration-300 hover:shadow-[0_30px_60px_-30px_rgba(10,10,15,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label={study.storyLabel}
            >
                {study.id === 'jokers' ? <JokersTile /> : <CofiTile />}

                {/* fullscreen affordance — opens the story */}
                <span className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-lg bg-black/25 text-white/90 ring-1 ring-white/20 backdrop-blur-sm transition-all duration-300 group-hover:bg-black/40 group-hover:text-white">
                    <ExpandIcon />
                </span>
            </button>

            <p className="mt-5 max-w-[34ch] text-[15px] font-medium leading-snug tracking-[-0.01em] text-ink">
                {study.caption}
            </p>
        </div>
    )
}

/* ── Modal ────────────────────────────────────────────────────── */
function StoryModal({ study, onClose }: { study: Study; onClose: () => void }) {
    const backdropRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const closingRef = useRef(false)
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // animated close → plays exit, then unmounts
    const requestClose = () => {
        if (closingRef.current) return
        closingRef.current = true
        if (reduced) {
            onClose()
            return
        }
        gsap.to(contentRef.current, { opacity: 0, y: 10, duration: 0.2, ease: 'power2.in' })
        gsap.to(panelRef.current, { opacity: 0, y: 14, scale: 0.97, duration: 0.32, ease: 'power2.in' })
        gsap.to(backdropRef.current, { opacity: 0, duration: 0.32, delay: 0.04, ease: 'power1.in', onComplete: onClose })
    }

    useGSAP(() => {
        if (reduced) return
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35 })
            .fromTo(
                panelRef.current,
                { opacity: 0, y: 28, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power4.out' },
                '-=0.2',
            )
            .fromTo(
                contentRef.current ? Array.from(contentRef.current.children) : [],
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 },
                '-=0.32',
            )
    }, [])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose()
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div
            ref={backdropRef}
            onClick={requestClose}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm md:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`${study.name} case study`}
        >
            <div
                ref={panelRef}
                onClick={(e) => e.stopPropagation()}
                className="relative grid max-h-[88vh] w-full max-w-[860px] grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-30px_rgba(10,10,15,0.5)] md:grid-cols-[300px_1fr]"
            >
                {/* brand rail */}
                <div className="relative hidden min-h-full md:block">
                    {study.id === 'jokers' ? <JokersTile /> : <CofiTile />}
                </div>

                {/* content */}
                <div ref={contentRef} className="flex max-h-[88vh] flex-col overflow-y-auto p-7 md:p-9">
                    {/* close */}
                    <button
                        type="button"
                        onClick={requestClose}
                        aria-label="Close"
                        className="absolute right-4 top-4 z-10 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink/40 transition-colors hover:bg-surface hover:text-ink"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>

                    {/* heading */}
                    <div className="pr-8">
                        <span className="inline-block h-1.5 w-9 rounded-full" style={{ backgroundColor: study.accent }} />
                        <h3 className="mt-4 text-[1.6rem] font-medium leading-tight tracking-[-0.03em] text-ink">{study.name}</h3>
                        <p className="mt-1.5 text-[13px] font-medium text-muted">{study.role}</p>
                    </div>

                    {/* story */}
                    <div className="mt-7 space-y-6">
                        <div>
                            <h4 className="text-[13px] font-semibold tracking-[-0.01em] text-ink">The challenge</h4>
                            <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{study.challenge}</p>
                        </div>
                        <div>
                            <h4 className="text-[13px] font-semibold tracking-[-0.01em] text-ink">What we built</h4>
                            <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{study.built}</p>
                        </div>
                    </div>

                    {/* facts */}
                    <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line">
                        {study.facts.map((f) => (
                            <div key={f.k} className="bg-white px-4 py-3.5">
                                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink/40">{f.k}</dt>
                                <dd className="mt-1 text-[13.5px] font-medium tracking-[-0.01em] text-ink">{f.v}</dd>
                            </div>
                        ))}
                    </dl>

                    <Link
                        href="/login"
                        className="group/cta mt-8 inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-hover"
                    >
                        Build something like this
                        <Arrow className="transition-transform duration-300 group-hover/cta:translate-x-1" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

/* ── Section ──────────────────────────────────────────────────── */
export function CaseStudies() {
    const [active, setActive] = useState<Study | null>(null)

    return (
        <section className="px-6 py-20 md:px-16 md:py-28 lg:px-24">
            {/* header — headline left, supporting copy right (Stripe-clean) */}
            <div data-reveal className="grid gap-6 md:grid-cols-2 md:gap-12">
                <h2 className="max-w-[18ch] text-[clamp(1.75rem,2.8vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.03em] text-ink">
                    The wallet your users never have to think about.
                </h2>
                <p className="max-w-[44ch] self-end text-[15px] leading-relaxed text-muted">
                    Real teams shipping Cavos in production — embedded self-custody woven so
                    deep into their products that people pay, play, and trade without ever
                    meeting a seed phrase.
                </p>
            </div>

            {/* tiles */}
            <div data-reveal data-reveal-group className="mx-auto mt-12 grid max-w-[760px] grid-cols-1 gap-6 sm:grid-cols-2 md:mt-14 md:gap-7">
                {STUDIES.map((study) => (
                    <Card key={study.id} study={study} onOpen={() => setActive(study)} />
                ))}
            </div>

            {active && <StoryModal study={active} onClose={() => setActive(null)} />}
        </section>
    )
}
