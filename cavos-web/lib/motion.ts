/**
 * Shared motion vocabulary.
 *
 * Anything a user can touch animates with a spring, not a fixed-duration
 * curve: a spring is interruptible by construction, animates from wherever
 * the element currently is, and can absorb a new target mid-flight without a
 * visible jump. Fixed curves are kept only for non-gestural affordances
 * (colour, opacity), which live in CSS.
 *
 * Framer Motion's `bounce` + `duration` spring API maps onto Apple's
 * designer-facing pair: bounce ≈ 1 − damping ratio, duration ≈ response.
 */

import type { Transition } from 'framer-motion'

/** Critically damped. The default for anything that didn't carry momentum. */
export const SPRING_DEFAULT: Transition = { type: 'spring', bounce: 0, duration: 0.4 }

/** Slight overshoot. Only earned after a flick, throw, or drag release. */
export const SPRING_MOMENTUM: Transition = { type: 'spring', bounce: 0.2, duration: 0.4 }

/** Sheets and drawers — snappier response, a touch of settle. */
export const SPRING_SHEET: Transition = { type: 'spring', bounce: 0.15, duration: 0.3 }

/** Non-gestural cross-fade, used as the reduced-motion substitute. */
export const FADE: Transition = { duration: 0.18, ease: [0.23, 1, 0.32, 1] }

/**
 * Where a flick would come to rest, using the exponential decay Apple ships
 * in the Designing Fluid Interfaces sample code — not the textbook
 * v²/(2·decel), which decelerates far too abruptly to feel like scrolling.
 *
 * @param velocity px/s at release
 * @param deceleration 0.998 for normal scroll feel, 0.99 for snappier
 * @returns the distance the gesture would still travel, in px
 */
export function project(velocity: number, deceleration = 0.998): number {
    return (velocity / 1000) * deceleration / (1 - deceleration)
}

/**
 * Progressive resistance past a boundary. A hard stop reads as frozen; real
 * things slow before they stop. The further past the bound, the less the
 * element follows the finger.
 *
 * @param overshoot how far past the boundary the pointer has travelled
 * @param dimension the size of the surface being dragged
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
    if (dimension <= 0) return overshoot
    return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

/**
 * Tracks a short history of pointer samples so a release can hand off the
 * finger's actual velocity to the spring. A single last-two-events delta is
 * too noisy; sampling a ~100ms window smooths it without adding lag.
 */
export class VelocityTracker {
    private samples: { value: number; time: number }[] = []
    constructor(private readonly window = 100) {}

    add(value: number, time = performance.now()) {
        this.samples.push({ value, time })
        while (this.samples.length > 2 && time - this.samples[0].time > this.window) {
            this.samples.shift()
        }
    }

    /** px/s over the tracked window. 0 when the pointer was held still. */
    get velocity(): number {
        if (this.samples.length < 2) return 0
        const first = this.samples[0]
        const last = this.samples[this.samples.length - 1]
        const dt = last.time - first.time
        if (dt <= 0) return 0
        return ((last.value - first.value) / dt) * 1000
    }

    reset() {
        this.samples = []
    }
}

/**
 * Decide commit vs. revert from the gesture, the way a person would read it:
 * a decisive flick wins regardless of how far it travelled, and only when
 * there was no real velocity does the projected resting point decide.
 */
export function shouldCommit({
    offset,
    velocity,
    dimension,
    velocityThreshold = 400,
}: {
    offset: number
    velocity: number
    dimension: number
    velocityThreshold?: number
}): boolean {
    if (Math.abs(velocity) > velocityThreshold) return velocity > 0
    return offset + project(velocity) > dimension / 2
}
