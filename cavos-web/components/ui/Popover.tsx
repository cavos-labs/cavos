'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FADE, SPRING_DEFAULT } from '@/lib/motion'

type Align = 'start' | 'end'
type Placement = 'top' | 'bottom'

function panelOrigin(placement: Placement, align: Align) {
    const edge = placement === 'top' ? 'bottom' : 'top'
    const side = align === 'end' ? 'right' : 'left'
    return `${edge} ${side}`
}

interface PopoverProps {
    trigger: (open: boolean) => React.ReactNode
    label: string
    align?: Align
    placement?: Placement
    triggerClassName?: string
    panelClassName?: string
    children: (close: () => void) => React.ReactNode
}

export function Popover({
    trigger,
    label,
    align = 'start',
    placement = 'bottom',
    triggerClassName = '',
    panelClassName = '',
    children,
}: PopoverProps) {
    const [open, setOpen] = useState(false)
    const reduced = useReducedMotion()
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const panelId = useId()

    useEffect(() => {
        if (!open) return
        const onPointerDown = (e: PointerEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false)
                triggerRef.current?.focus()
            }
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={triggerRef}
                type="button"
                data-pressable
                aria-expanded={open}
                aria-haspopup="true"
                aria-controls={open ? panelId : undefined}
                onClick={() => setOpen((v) => !v)}
                className={triggerClassName}
            >
                {trigger(open)}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        id={panelId}
                        role="menu"
                        aria-label={label}
                        className={`absolute z-50 ${align === 'end' ? 'right-0' : 'left-0'} ${placement === 'top' ? 'bottom-full mb-1' : ''} ${panelClassName}`}
                        style={{ transformOrigin: panelOrigin(placement, align) }}
                        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: placement === 'top' ? 4 : -4 }}
                        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: placement === 'top' ? 4 : -4 }}
                        transition={reduced ? FADE : SPRING_DEFAULT}
                    >
                        {children(() => setOpen(false))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
