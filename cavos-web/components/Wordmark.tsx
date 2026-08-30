import Link from 'next/link'

export function Wordmark({
    href = '/dashboard',
    inverted = false,
    className = 'h-7 w-7',
}: {
    href?: string
    inverted?: boolean
    className?: string
}) {
    return (
        <Link
            href={href}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            aria-label="Cavos"
        >
            <span
                aria-hidden
                className={`block shrink-0 ${className} ${inverted ? 'bg-[#FFFFFF]' : 'bg-brand'}`}
                style={{
                    WebkitMask: 'url(/cavos-black.png) center / contain no-repeat',
                    mask: 'url(/cavos-black.png) center / contain no-repeat',
                }}
            />
        </Link>
    )
}
