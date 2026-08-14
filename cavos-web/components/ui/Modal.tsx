'use client'

import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FADE, SPRING_DEFAULT } from '@/lib/motion'

const FOCUSABLE =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ModalProps {
    open: boolean
    /** Omit for a modal the user must resolve (no Escape, no scrim dismiss). */
    onClose?: () => void
    labelledBy: string
    className?: string
    children: React.ReactNode
}

/**
 * A modal task: the scrim dims and pushes the background back so there's one
 * obvious thing to do, and the surface *materialises* — blur and scale move
 * together, so it reads as a real panel arriving rather than a rectangle
 * fading up out of nothing.
 *
 * Also does the unglamorous part: traps focus, restores it to whatever opened
 * the modal, locks background scroll, and closes on Escape when the task is
 * dismissable.
 */
export function Modal({ open, onClose, labelledBy, className = '', children }: ModalProps) {
    const reduced = useReducedMotion()
    const panelRef = useRef<HTMLDivElement>(null)
    const restoreFocusTo = useRef<HTMLElement | null>(null)

    const trapFocus = useCallback((e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !panelRef.current) return
        const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (nodes.length === 0) {
            e.preventDefault()
            return
        }
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
        }
    }, [])

    useEffect(() => {
        if (!open) return

        restoreFocusTo.current = document.activeElement as HTMLElement | null
        const { overflow } = document.body.style
        document.body.style.overflow = 'hidden'

        // Move focus in on the next frame, once the panel has mounted.
        const raf = requestAnimationFrame(() => {
            const target = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
            target?.focus()
        })

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) onClose()
            trapFocus(e)
        }
        document.addEventListener('keydown', onKey)

        return () => {
            cancelAnimationFrame(raf)
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = overflow
            restoreFocusTo.current?.focus()
        }
    }, [open, onClose, trapFocus])

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        aria-hidden="true"
                        onClick={onClose}
                        className="material-scrim absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={FADE}
                    />
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={labelledBy}
                        className={`relative ${className}`}
                        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                        transition={reduced ? FADE : SPRING_DEFAULT}
                    >
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
