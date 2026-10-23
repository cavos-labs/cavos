'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const HeroOrbCanvas = dynamic(
    () => import('./HeroOrbCanvas').then((mod) => mod.HeroOrbCanvas),
    { ssr: false },
)

const GLOW_MOBILE =
    'radial-gradient(70% 38% at 74% 4%, rgba(64,42,255,0.30) 0%, rgba(64,42,255,0.14) 46%, rgba(255,255,255,0) 78%)'
const GLOW_DESKTOP =
    'radial-gradient(70% 100% at 100% 50%, rgba(64,42,255,0.32) 0%, rgba(64,42,255,0.15) 38%, rgba(255,255,255,0) 66%)'
const FADE_MOBILE =
    'linear-gradient(to bottom, rgba(255,255,255,0) 24%, rgba(255,255,255,0.75) 46%, #FFFFFF 60%)'
const FADE_DESKTOP =
    'linear-gradient(100deg, #FFFFFF 0%, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.5) 52%, rgba(255,255,255,0) 70%)'

function SilkOrb({ className }: { className: string }) {
    return (
        <div className={className}>
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background:
                        'radial-gradient(circle at 32% 28%, #8B7CFF 0%, #5C48FF 26%, #402AFF 52%, #2A1AB8 78%, #1A0F80 100%)',
                    boxShadow: 'inset 0 0 80px rgba(255,255,255,0.10)',
                }}
            />
            <div
                className="absolute inset-0 rounded-full opacity-50 mix-blend-soft-light"
                style={{
                    background:
                        'repeating-linear-gradient(-24deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 14px)',
                }}
            />
        </div>
    )
}

/**
 * Static indigo orb that matches the 3D composition (right-weighted on
 * desktop, top-right on mobile) so LCP can be the hero text. Positions are
 * CSS breakpoints — a JS mobile flag would flip the blob after hydrate.
 */
function HeroOrbPoster() {
    return (
        <>
            <SilkOrb className="absolute -top-[8vh] -right-[18vw] h-[min(92vw,34rem)] w-[min(92vw,34rem)] md:hidden" />
            <SilkOrb className="absolute top-1/2 -right-[16vw] hidden h-[min(72vw,52rem)] w-[min(72vw,52rem)] -translate-y-1/2 md:block" />
        </>
    )
}

/**
 * Glossy morphing 3D orb in Cavos indigo. The canvas is idle-loaded after
 * first paint; a CSS poster holds the same composition so the hero does not
 * flash empty. The render loop yields when the orb is offscreen, the tab is
 * hidden, or the visitor prefers reduced motion.
 */
export function HeroOrb({ fixed = false }: { fixed?: boolean }) {
    const rootRef = useRef<HTMLDivElement>(null)
    const [mobile, setMobile] = useState(false)
    const [reducedMotion, setReducedMotion] = useState(false)
    const [loadCanvas, setLoadCanvas] = useState(false)
    const [canvasReady, setCanvasReady] = useState(false)
    const [inView, setInView] = useState(true)
    const [tabVisible, setTabVisible] = useState(true)

    useEffect(() => {
        const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
        const mobileMq = window.matchMedia('(max-width: 767px)')
        const sync = () => {
            setReducedMotion(motionMq.matches)
            setMobile(mobileMq.matches)
        }
        sync()
        motionMq.addEventListener('change', sync)
        mobileMq.addEventListener('change', sync)
        return () => {
            motionMq.removeEventListener('change', sync)
            mobileMq.removeEventListener('change', sync)
        }
    }, [])

    useEffect(() => {
        if (reducedMotion) return
        let cancelled = false
        let idleId: number | undefined
        let timeoutId: ReturnType<typeof setTimeout> | undefined
        let raf1 = 0
        let raf2 = 0

        const load = () => {
            if (!cancelled) setLoadCanvas(true)
        }

        const scheduleIdle = () => {
            if (typeof window.requestIdleCallback === 'function') {
                idleId = window.requestIdleCallback(load, { timeout: 1800 })
            } else {
                timeoutId = setTimeout(load, 200)
            }
        }

        const afterPaint = () => {
            raf1 = requestAnimationFrame(() => {
                raf2 = requestAnimationFrame(scheduleIdle)
            })
        }

        if (document.readyState === 'complete') afterPaint()
        else window.addEventListener('load', afterPaint, { once: true })

        return () => {
            cancelled = true
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2)
            if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idleId)
            }
            if (timeoutId !== undefined) clearTimeout(timeoutId)
            window.removeEventListener('load', afterPaint)
        }
    }, [reducedMotion])

    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === 'undefined') return
        const io = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { rootMargin: '80px 0px', threshold: 0 },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    useEffect(() => {
        const onVisibility = () => setTabVisible(document.visibilityState === 'visible')
        onVisibility()
        document.addEventListener('visibilitychange', onVisibility)
        return () => document.removeEventListener('visibilitychange', onVisibility)
    }, [])

    const playing = loadCanvas && !reducedMotion && inView && tabVisible
    const showPoster = !canvasReady

    return (
        <div
            ref={rootRef}
            aria-hidden="true"
            className={`${fixed ? 'fixed' : 'absolute'} top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none -z-10 bg-white`}
        >
            <div className="absolute inset-0 md:hidden" style={{ background: GLOW_MOBILE }} />
            <div className="absolute inset-0 hidden md:block" style={{ background: GLOW_DESKTOP }} />
            <div className={showPoster ? 'absolute inset-0' : 'invisible absolute inset-0'}>
                <HeroOrbPoster />
            </div>
            {loadCanvas && !reducedMotion ? (
                <HeroOrbCanvas playing={playing} mobile={mobile} onReady={() => setCanvasReady(true)} />
            ) : null}
            <div className="absolute inset-0 md:hidden" style={{ background: FADE_MOBILE }} />
            <div className="absolute inset-0 hidden md:block" style={{ background: FADE_DESKTOP }} />
        </div>
    )
}
