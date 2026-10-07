'use client'

/* Card chrome copied from CaseStudies (Jokers / CofiBlocks):
   aspect-[5/6] rounded-2xl ring-line tile, expand control, caption type,
   two-up grid, and the story lightbox shell. */

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import {
    FRAMEZZ_APP_URL,
    FRAMEZZ_GALLERIES_URL,
} from '@/lib/marketing-seo'

gsap.registerPlugin(useGSAP)

type Product = {
    id: string
    name: string
    href: string
    src: string
    alt: string
    caption: string
    objectPosition: string
    storyLabel: string
    body: string
}

const PRODUCTS: Product[] = [
    {
        id: 'framezz',
        name: 'Framezz',
        href: FRAMEZZ_APP_URL,
        src: '/images/products/framezz-app.webp',
        alt: 'Framezz app showing live race events a runner can search to find their photos',
        caption: 'A runner uploads one selfie and gets every photo they appear in.',
        objectPosition: 'top',
        storyLabel: 'Open Framezz',
        body: 'Events include Ironman 70.3 Cap Cana, the Disney Princess Half Marathon, BMW Lindora Run, and Clásica Palmarín MTB. They download the high-resolution originals.',
    },
    {
        id: 'galleries',
        name: 'Framezz Galleries',
        href: FRAMEZZ_GALLERIES_URL,
        src: '/images/products/framezz-galleries.webp',
        alt: 'Framezz Galleries homepage, where photographers sell event photos under their own brand',
        caption:
            'Photographers sell race, tournament, and graduation photos from a gallery under their own brand.',
        objectPosition: 'center',
        storyLabel: 'Open Framezz Galleries',
        body: 'Each photographer gets a gallery on their own subdomain, with their name, logo, colors, and watermark. A buyer finds their shots with a selfie or a bib number, then pays by card.',
    },
]

function ExpandIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
    )
}

function Card({ product, onOpen }: { product: Product; onOpen: () => void }) {
    return (
        <div className="group flex flex-col">
            <button
                type="button"
                onClick={onOpen}
                className="relative block aspect-[5/6] w-full overflow-hidden rounded-2xl ring-1 ring-line transition-shadow duration-300 hover:shadow-[0_30px_60px_-30px_rgba(10,10,15,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label={product.storyLabel}
            >
                <Image
                    src={product.src}
                    alt={product.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 540px"
                    loading="lazy"
                    className="select-none object-cover"
                    style={{ objectPosition: product.objectPosition }}
                />
                <span className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-lg bg-black/25 text-white/90 ring-1 ring-white/20 backdrop-blur-sm transition-all duration-300 group-hover:bg-black/40 group-hover:text-white">
                    <ExpandIcon />
                </span>
            </button>
            <p className="mt-5 max-w-[34ch] text-[15px] font-medium leading-snug tracking-[-0.01em] text-ink">
                {product.caption}
            </p>
        </div>
    )
}

function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
    const backdropRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const closingRef = useRef(false)
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const requestClose = () => {
        if (closingRef.current) return
        closingRef.current = true
        if (reduced) {
            onClose()
            return
        }
        gsap.to(contentRef.current, { opacity: 0, y: 10, duration: 0.2, ease: 'power2.in' })
        gsap.to(panelRef.current, { opacity: 0, y: 14, scale: 0.97, duration: 0.32, ease: 'power2.in' })
        gsap.to(backdropRef.current, { opacity: 0, duration: 0.32, delay: 0.04, ease: 'power1.in', onComplete: onClose })
    }

    useGSAP(() => {
        if (reduced) return
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35 })
            .fromTo(
                panelRef.current,
                { opacity: 0, y: 28, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power4.out' },
                '-=0.2',
            )
            .fromTo(
                contentRef.current ? Array.from(contentRef.current.children) : [],
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 },
                '-=0.32',
            )
    }, [])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose()
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div
            ref={backdropRef}
            onClick={requestClose}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-brand/40 p-4 backdrop-blur-sm md:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
        >
            <div
                ref={panelRef}
                onClick={(e) => e.stopPropagation()}
                className="relative grid max-h-[88vh] w-full max-w-[860px] grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-30px_rgba(64,42,255,0.45)] md:grid-cols-[300px_1fr]"
            >
                <div className="relative hidden min-h-full md:block">
                    <Image
                        src={product.src}
                        alt=""
                        fill
                        sizes="300px"
                        className="object-cover"
                        style={{ objectPosition: product.objectPosition }}
                    />
                </div>
                <div ref={contentRef} className="flex max-h-[88vh] flex-col overflow-y-auto p-7 md:p-9">
                    <button
                        type="button"
                        onClick={requestClose}
                        aria-label="Close"
                        className="absolute right-4 top-4 z-10 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink/40 transition-colors hover:bg-surface hover:text-ink"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                    <div className="pr-8">
                        <h3 className="text-[1.6rem] font-medium leading-tight tracking-[-0.03em] text-ink">{product.name}</h3>
                    </div>
                    <p className="mt-7 text-[14.5px] leading-relaxed text-muted">{product.body}</p>
                    <a
                        href={product.href}
                        target="_blank"
                        rel="noopener"
                        className="mt-8 inline-flex w-fit items-center rounded-lg bg-brand px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-hover"
                    >
                        Open {product.name}
                    </a>
                </div>
            </div>
        </div>
    )
}

export function ProductShowcase() {
    const [active, setActive] = useState<Product | null>(null)

    return (
        <>
            <div className="mx-auto mt-12 grid max-w-[760px] grid-cols-1 gap-6 sm:grid-cols-2 md:mt-14 md:gap-7">
                {PRODUCTS.map((product) => (
                    <Card key={product.id} product={product} onOpen={() => setActive(product)} />
                ))}
            </div>
            {active && <ProductModal product={active} onClose={() => setActive(null)} />}
        </>
    )
}
