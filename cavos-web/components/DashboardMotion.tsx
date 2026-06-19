'use client'

import { usePathname } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

gsap.registerPlugin(useGSAP)

/**
 * Dashboard motion layer. Renders nothing; plays a subtle entrance on each
 * route change. Mirrors LandingMotion's reduced-motion guard — content is
 * visible by default, motion only enhances when allowed.
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

                const ease = 'power3.out'

                const header = gsap.utils.toArray<HTMLElement>('[data-dash-header]')
                const stats = gsap.utils.toArray<HTMLElement>('[data-dash-stat]')
                const panels = gsap.utils.toArray<HTMLElement>('[data-dash-panel]')

                if (header.length) {
                    gsap.set(header, { opacity: 0, y: 10 })
                    gsap.to(header, { opacity: 1, y: 0, duration: 0.4, ease })
                }
                if (stats.length) {
                    gsap.set(stats, { opacity: 0, y: 12 })
                    gsap.to(stats, { opacity: 1, y: 0, duration: 0.45, ease, stagger: 0.06, delay: 0.05 })
                }
                if (panels.length) {
                    gsap.set(panels, { opacity: 0, y: 12 })
                    gsap.to(panels, { opacity: 1, y: 0, duration: 0.45, ease, stagger: 0.06, delay: 0.12 })
                }
            }
        )

        return () => mm.revert()
    }, [pathname])

    return null
}
