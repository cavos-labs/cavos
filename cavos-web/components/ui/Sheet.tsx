'use client'

import { useEffect, useRef } from 'react'
import {
    AnimatePresence,
    motion,
    useMotionValue,
    useReducedMotion,
    useTransform,
    type PanInfo,
} from 'framer-motion'
import { FADE, SPRING_SHEET, project } from '@/lib/motion'

interface SheetProps {
    open: boolean
    onClose: () => void
    /** Which edge the sheet lives on. It always exits the way it came in. */
    side?: 'left' | 'right' | 'bottom'
    /** px. Used for the drag bounds and the dismissal threshold. */
    size?: number
    label: string
    className?: string
    /** Breakpoint/visibility classes for the scrim, matched to the panel's. */
    scrimClassName?: string
    children: React.ReactNode
}

/**
 * A drawer you can actually grab.
 *
 * The panel tracks the finger 1:1, resists past its open position instead of
 * stopping dead, and on release decides by the *sign of the velocity* — a
 * decisive flick dismisses however short it was, and only a slow release
 * falls back to the projected resting point. Because the whole thing is a
 * spring, grabbing it again mid-dismiss just re-targets: it follows the
 * finger rather than finishing the close first.
 *
 * The scrim's opacity is bound to the panel's live position, so the room
 * behind dims continuously as you drag rather than snapping at the end.
 */
export function Sheet({
    open,
    onClose,
    side = 'left',
    size = 256,
    label,
    className = '',
    scrimClassName = '',
    children,
}: SheetProps) {
    const reduced = useReducedMotion()
    const axis = side === 'bottom' ? 'y' : 'x'
    // Which way "away" is: left sheets leave to the left, everything else to
    // the positive side of its axis.
    const dismissDirection = side === 'left' ? -1 : 1
    const closedOffset = size * dismissDirection

    const offset = useMotionValue(closedOffset)
    // Dim in step with the drag — 1 when fully open, 0 when fully dismissed.
    const scrimOpacity = useTransform(offset, [closedOffset, 0], [0, 1])
    const panelRef = useRef<HTMLDivElement>(null)

    // Escape always gets you out. Never trap the user.
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose])

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        const velocity = axis === 'x' ? info.velocity.x : info.velocity.y
        const current = offset.get()
        // Where the flick would come to rest if we let it run out.
        const projected = current + project(velocity)
        const past = projected * dismissDirection > size / 2
        // A decisive flick wins on velocity alone, however short the travel —
        // that's how a person reads their own gesture.
        const flicked = velocity * dismissDirection > 400

        if (past || flicked) onClose()
        // Not dismissed: the spring below re-targets to 0 from wherever the
        // panel currently sits, carrying the release velocity with it.
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        aria-hidden="true"
                        onClick={onClose}
                        className={`material-scrim fixed inset-0 z-40 ${scrimClassName}`}
                        style={reduced ? undefined : { opacity: scrimOpacity }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={FADE}
                    />

                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={label}
                        className={className}
                        style={{ [axis]: reduced ? 0 : offset } as never}
                        initial={reduced ? { opacity: 0 } : { [axis]: closedOffset }}
                        animate={reduced ? { opacity: 1 } : { [axis]: 0 }}
                        exit={reduced ? { opacity: 0 } : { [axis]: closedOffset }}
                        transition={reduced ? FADE : SPRING_SHEET}
                        drag={reduced ? false : axis}
                        // Free travel toward dismissal; past the open position
                        // it rubber-bands instead of hitting a wall — a real
                        // thing slows before it stops.
                        dragConstraints={
                            side === 'left'
                                ? { left: -size, right: 0 }
                                : side === 'right'
                                    ? { left: 0, right: size }
                                    : { top: 0, bottom: size }
                        }
                        dragElastic={
                            side === 'left'
                                ? { left: 0, right: 0.25 }
                                : side === 'right'
                                    ? { left: 0.25, right: 0 }
                                    : { top: 0.25, bottom: 0 }
                        }
                        dragMomentum={false}
                        onDragEnd={handleDragEnd}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
