'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion'
import { Icon } from '@/components/ui/Icon'
import { SPRING_MOMENTUM, project } from '@/lib/motion'

export interface CarouselApp {
    id: string
    name: string
    logo_url: string | null
}

/**
 * The logo strip, as something you can actually push.
 *
 * A linear 80s marquee keyframe can't be grabbed, can't be redirected, and
 * ignores you entirely if you try. This tracks the pointer 1:1, and on release
 * projects where the flick would come to rest and springs there carrying the
 * release velocity — so a small push produces a large, proportionate throw.
 * The ambient drift resumes once you let go, and stops the moment you touch it.
 *
 * Under reduced motion there is no drift and no inertia: it's a plain
 * horizontally scrollable row.
 */
export function AppsCarouselTrack({ apps }: { apps: CarouselApp[] }) {
    const reduced = useReducedMotion()
    const viewportRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)
    const [dragging, setDragging] = useState(false)
    const [span, setSpan] = useState(0)

    // Duplicated once so the drift can wrap without a visible seam.
    const loop = [...apps, ...apps]

    useEffect(() => {
        const measure = () => {
            if (trackRef.current) setSpan(trackRef.current.scrollWidth / 2)
        }
        measure()
        window.addEventListener('resize', measure)
        return () => window.removeEventListener('resize', measure)
    }, [apps.length])

    // Ambient drift, paused while the user is in contact with it.
    useEffect(() => {
        if (reduced || dragging || span === 0) return
        let frame = 0
        let last = performance.now()
        const speed = 24 // px/s — slow enough to read, not a treadmill

        const tick = (now: number) => {
            const dt = (now - last) / 1000
            last = now
            x.set(wrap(x.get() - speed * dt, span))
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [reduced, dragging, span, x])

    return (
        <div
            ref={viewportRef}
            className={`relative w-full overflow-hidden ${reduced ? 'overflow-x-auto' : ''}`}
        >
            <motion.div
                ref={trackRef}
                className="flex w-max items-center"
                style={reduced ? undefined : { x }}
                drag={reduced ? false : 'x'}
                dragMomentum={false}
                onDragStart={() => setDragging(true)}
                onDragEnd={(_, info) => {
                    setDragging(false)
                    if (span === 0) return
                    // Throw it to where the gesture was actually going.
                    const target = x.get() + project(info.velocity.x)
                    animateWrapped(x, target, span)
                }}
            >
                {loop.map((app, index) => (
                    <div key={`${app.id}-${index}`} className="mx-7 shrink-0 md:mx-12">
                        <div className="group relative flex h-12 w-12 items-center justify-center overflow-visible rounded-lg">
                            {app.logo_url ? (
                                <Image
                                    src={app.logo_url}
                                    alt={app.name}
                                    fill
                                    draggable={false}
                                    className="pointer-events-none rounded-lg object-contain"
                                />
                            ) : (
                                <Icon.Apps className="h-6 w-6 text-ink/30" />
                            )}

                            {/* Materialises out of the logo it labels, rather than
                                fading in somewhere below it. */}
                            <span className="pointer-events-none absolute -bottom-8 left-1/2 origin-top -translate-x-1/2 scale-90 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white opacity-0 blur-[2px] transition-[opacity,transform,filter] duration-200 group-hover:scale-100 group-hover:opacity-100 group-hover:blur-0">
                                {app.name}
                            </span>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    )
}

/** Keep the offset inside one copy of the strip so the loop never runs out. */
function wrap(value: number, span: number): number {
    if (span <= 0) return value
    return ((value % span) + span) % span - span
}

function animateWrapped(x: MotionValue<number>, target: number, span: number) {
    // Spring to the projected endpoint, then fold back into range. Wrapping
    // mid-flight would make the strip jump under the finger's momentum.
    animate(x, target, {
        ...SPRING_MOMENTUM,
        onComplete: () => x.set(wrap(x.get(), span)),
    })
}
