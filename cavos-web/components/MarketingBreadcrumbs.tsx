import Link from 'next/link'

export type MarketingCrumb = {
    name: string
    href: string
}

const linkClass =
    'font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink'

export function MarketingBreadcrumbs({
    crumbs,
    tone = 'light',
}: {
    crumbs: MarketingCrumb[]
    tone?: 'light' | 'dark'
}) {
    const muted = tone === 'dark' ? 'text-white/45' : 'text-muted'
    const current = tone === 'dark' ? 'text-white/80' : 'text-ink'
    const sep = tone === 'dark' ? 'text-white/25' : 'text-muted'

    return (
        <nav aria-label="Breadcrumb" className={`text-sm ${muted}`}>
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {crumbs.map((crumb, index) => {
                    const last = index === crumbs.length - 1
                    return (
                        <li key={`${crumb.href}-${crumb.name}`} className="flex items-center gap-x-2">
                            {index > 0 ? (
                                <span aria-hidden="true" className={sep}>
                                    /
                                </span>
                            ) : null}
                            {last ? (
                                <span className={current}>{crumb.name}</span>
                            ) : (
                                <Link href={crumb.href} className={tone === 'dark' ? 'font-semibold text-white/70 underline decoration-white/25 underline-offset-4 hover:text-white hover:decoration-white' : linkClass}>
                                    {crumb.name}
                                </Link>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
