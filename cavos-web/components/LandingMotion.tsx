'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/**
 * Landing-page motion layer. Renders nothing; choreographs the hero entrance
 * and reveals section content on scroll. Content is visible by default — motion
 * only enhances when JS + motion are available, so headless/reduced-motion
 * renders never ship blank.
 */
export function LandingMotion() {
    useGSAP(() => {
        const mm = gsap.matchMedia()

        mm.add(
            {
                motion: '(prefers-reduced-motion: no-preference)',
                reduced: '(prefers-reduced-motion: reduce)',
            },
            (ctx) => {
                const { motion } = ctx.conditions as { motion: boolean; reduced: boolean }
                if (!motion) return // reduced motion: leave everything in its visible default

                const ease = 'power3.out'

                // ── Hero entrance — orchestrated, plays on load ──
                const heroItems = gsap.utils.toArray<HTMLElement>('[data-hero]')
                if (heroItems.length) {
                    gsap.set(heroItems, { opacity: 0, y: 24 })
                    gsap.to(heroItems, {
                        opacity: 1,
                        y: 0,
                        duration: 0.9,
                        ease,
                        stagger: 0.09,
                        delay: 0.05,
                    })
                }

                // ── Section reveals — scoped to what they reveal ──
                gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
                    const group = el.hasAttribute('data-reveal-group')
                    const targets = group ? Array.from(el.children) : el
                    gsap.set(targets, { opacity: 0, y: 28 })
                    gsap.to(targets, {
                        opacity: 1,
                        y: 0,
                        duration: 0.7,
                        ease,
                        stagger: group ? 0.08 : 0,
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 85%',
                            once: true,
                        },
                    })
                })

                ScrollTrigger.refresh()
            }
        )

        return () => mm.revert()
    }, [])

    return null
}
