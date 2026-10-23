'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const HeroOrbCanvas = dynamic(
    () => import('./HeroOrbCanvas').then((mod) => mod.HeroOrbCanvas),
    { ssr: false },
)

/**
 * Glossy morphing 3D orb in Cavos indigo. Three.js is lazy-loaded so the
 * hero text can paint first. Until the canvas is ready, only the original
 * indigo glow / fade show — no poster. The render loop pauses when the orb
 * is offscreen or the tab is hidden; the sphere itself is unchanged.
 */
export function HeroOrb({ fixed = false }: { fixed?: boolean }) {
    const rootRef = useRef<HTMLDivElement>(null)
    const [animate, setAnimate] = useState(true)
    const [mobile, setMobile] = useState(false)
    const [inView, setInView] = useState(true)
    const [tabVisible, setTabVisible] = useState(true)

    useEffect(() => {
        const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
        const mobileMq = window.matchMedia('(max-width: 767px)')
        const sync = () => {
            setAnimate(!motionMq.matches)
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

    const playing = animate && inView && tabVisible

    return (
        <div
            ref={rootRef}
            aria-hidden="true"
            className={`${fixed ? 'fixed' : 'absolute'} top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none -z-10 bg-white`}
        >
            {/* indigo glow — from the top on mobile, from the right edge on desktop */}
            <div
                className="absolute inset-0"
                style={{
                    background: mobile
                        ? 'radial-gradient(70% 38% at 74% 4%, rgba(64,42,255,0.30) 0%, rgba(64,42,255,0.14) 46%, rgba(255,255,255,0) 78%)'
                        : 'radial-gradient(70% 100% at 100% 50%, rgba(64,42,255,0.32) 0%, rgba(64,42,255,0.15) 38%, rgba(255,255,255,0) 66%)',
                }}
            />

            <HeroOrbCanvas playing={playing} mobile={mobile} />

            {/* legibility fade — bottom on mobile, left on desktop */}
            <div
                className="absolute inset-0"
                style={{
                    background: mobile
                        ? 'linear-gradient(to bottom, rgba(255,255,255,0) 24%, rgba(255,255,255,0.75) 46%, #FFFFFF 60%)'
                        : 'linear-gradient(100deg, #FFFFFF 0%, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.5) 52%, rgba(255,255,255,0) 70%)',
                }}
            />
        </div>
    )
}
