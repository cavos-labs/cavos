'use client'

import { usePathname } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

gsap.registerPlugin(useGSAP)

/**
 * Dashboard motion layer. Renders nothing.
 *
 * This used to stagger the header, stats and panels up from y:12 over ~0.5s on
 * every route change. In a console you navigate dozens of times an hour that
 * choreography is pure latency — you're waiting on the interface to finish
 * introducing content you already asked for. It's now a single short opacity
 * settle with no positional motion: enough to signal "this is new", not enough
 * to make you wait for it.
 */
export function DashboardMotion() {
    const pathname = usePathname()

    useGSAP(() => {
        const mm = gsap.matchMedia()

        mm.add(
            {
                motion: '(prefers-reduced-motion: no-preference)',
                reduced: '(prefers-reduced-motion: reduce)',
            },
            (ctx) => {
                const { motion } = ctx.conditions as { motion: boolean; reduced: boolean }
                if (!motion) return

                const targets = gsap.utils.toArray<HTMLElement>(
                    '[data-dash-header], [data-dash-stat], [data-dash-panel]'
                )
                if (!targets.length) return

                // Opacity only — no y-offset, no stagger, no delay. Data should
                // arrive, not make an entrance.
                gsap.set(targets, { opacity: 0 })
                gsap.to(targets, { opacity: 1, duration: 0.15, ease: 'power2.out' })
            }
        )

        return () => mm.revert()
    }, [pathname])

    return null
}
