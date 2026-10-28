import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
    EMBEDDED_WALLET_MARKET_NOTE,
    PROVIDER_PRICING_AS_OF,
    embeddedWalletProviderRows,
} from '@/lib/compare-data'
import { guidePageJsonLd } from '@/lib/marketing-seo'
import type {
    AlternativesGuide,
    AlternativesInline,
} from '@/lib/alternatives-guide'

const linkClass =
    'font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink'

function InlineCopy({ parts }: { parts: readonly AlternativesInline[] }) {
    return (
        <>
            {parts.map((part, index) =>
                typeof part === 'string' ? (
                    <span key={index}>{part}</span>
                ) : (
                    <Link key={`${part.href}-${index}`} href={part.href} className={linkClass}>
                        {part.label}
                    </Link>
                ),
            )}
        </>
    )
}

export function AlternativesGuidePage({ guide }: { guide: AlternativesGuide }) {
    const chooseThem = guide.chooseThem()
    const providers = embeddedWalletProviderRows()
    const jsonLd = guidePageJsonLd({
        title: guide.title,
        description: guide.description,
        path: guide.path,
        datePublished: guide.published,
        dateModified: guide.modified,
        crumbs: [
            { name: 'Home', path: '/' },
            { name: 'Compare', path: '/compare' },
            { name: guide.crumb, path: guide.path },
        ],
        faq: [...guide.faq],
        itemList: {
            name: guide.itemListName,
            items: guide.sections.map((section) => ({
                name: section.name,
                path: section.href,
            })),
        },
    })

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <script
                id={guide.jsonLdId}
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <div className="mx-auto max-w-6xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        {guide.h1}
                    </h1>
                    {guide.introParagraphs.map((parts, index) => (
                        <p
                            key={index}
                            className={
                                index === 0
                                    ? 'mt-7 max-w-2xl text-lg leading-relaxed text-muted'
                                    : 'mt-5 max-w-2xl text-lg leading-relaxed text-muted'
                            }
                        >
                            <InlineCopy parts={parts} />
                        </p>
                    ))}
                </header>

                <section className="mt-24">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">
                        {guide.whyLookHeading}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
                        {guide.whyLookIntro}
                    </p>
                    <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
                        {guide.whyLook.map((item) => (
                            <article key={item.title} className="bg-white p-7">
                                <h3 className="text-lg font-semibold">{item.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted">
                                    {item.body}
                                </p>
                            </article>
                        ))}
                    </div>
                    <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
                        {EMBEDDED_WALLET_MARKET_NOTE}
                    </p>
                </section>

                <section className="mt-24">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">
                        {guide.comparedHeading}
                    </h2>
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
                        {guide.comparedIntro}
                    </p>
                    <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
                        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                            <thead className="bg-brand text-white">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Provider</th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">
                                        Pricing and free tier
                                    </th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">
                                        Chains
                                    </th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">
                                        Key model
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {providers.map((provider) => (
                                    <tr key={provider.slug} className="border-t border-line">
                                        <th
                                            scope="row"
                                            className={`px-5 py-4 align-top font-semibold ${provider.slug === 'cavos' ? 'bg-brand/[0.035]' : ''}`}
                                        >
                                            <Link href={provider.href} className={linkClass}>
                                                {provider.name}
                                            </Link>
                                        </th>
                                        <td
                                            className={`border-l border-line px-5 py-4 align-top text-muted ${provider.slug === 'cavos' ? 'bg-brand/[0.035]' : ''}`}
                                        >
                                            {provider.pricing}
                                        </td>
                                        <td
                                            className={`border-l border-line px-5 py-4 align-top text-muted ${provider.slug === 'cavos' ? 'bg-brand/[0.035]' : ''}`}
                                        >
                                            {provider.chains}
                                        </td>
                                        <td
                                            className={`border-l border-line px-5 py-4 align-top text-muted ${provider.slug === 'cavos' ? 'bg-brand/[0.035]' : ''}`}
                                        >
                                            {provider.keyModel}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">
                        Cavos fees are from this site. Other fees are from each
                        vendor&apos;s public pricing page as of {PROVIDER_PRICING_AS_OF} and
                        can change.
                    </p>
                </section>

                <section className="mt-24">
                    <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
                        {guide.sections.map((alt) => {
                            const relatedLinks = alt.relatedLinks ?? []
                            return (
                            <article key={alt.name} className="bg-white p-7">
                                <h2 className="text-xl font-semibold">{alt.name}</h2>
                                {alt.paragraphs.map((paragraph) => (
                                    <p
                                        key={paragraph}
                                        className="mt-3 text-sm leading-relaxed text-muted"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                                {alt.chooseWhen.length > 0 ? (
                                    <ul className="mt-5 space-y-3">
                                        {alt.chooseWhen.map((item) => (
                                            <li
                                                key={item}
                                                className="flex gap-3 text-sm leading-relaxed text-muted"
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-muted"
                                                />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                                {relatedLinks.length > 0 ? (
                                    <p className="mt-4 text-sm leading-relaxed text-muted">
                                        {relatedLinks.map((link, index) => (
                                            <span key={link.href}>
                                                {index > 0
                                                    ? index === relatedLinks.length - 1
                                                        ? ', and '
                                                        : ', '
                                                    : null}
                                                <Link href={link.href} className={linkClass}>
                                                    {link.label}
                                                </Link>
                                            </span>
                                        ))}
                                        .
                                    </p>
                                ) : null}
                                <p className="mt-4">
                                    <Link href={alt.href} className={linkClass}>
                                        {alt.linkLabel}
                                        <span aria-hidden="true"> →</span>
                                    </Link>
                                </p>
                            </article>
                            )
                        })}
                    </div>
                </section>

                <section className="mt-24 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">
                        {guide.howToChooseHeading}
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-muted">
                        {guide.howToChooseIntro}
                    </p>
                    <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
                        {guide.howToChoose.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ol>
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                        <InlineCopy parts={guide.howToChooseOutro} />
                    </p>
                </section>

                <section className="mt-24 overflow-hidden rounded-2xl border border-line">
                    <article className="bg-white p-8">
                        <h2 className="text-xl font-semibold">{guide.stayHeading}</h2>
                        <p className="mt-4 text-sm leading-relaxed text-muted">
                            {guide.stayIntro}
                        </p>
                        <ul className="mt-5 space-y-3">
                            {chooseThem.map((item) => (
                                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                                    <span
                                        aria-hidden="true"
                                        className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-muted"
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </article>
                </section>

                <section className="mt-24">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Frequently asked</h2>
                    <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
                        {guide.faq.map((item) => (
                            <article key={item.question}>
                                <h3 className="font-semibold">{item.question}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-24 flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand px-8 py-10 text-white md:flex-row md:items-center">
                    <div>
                        <h2 className="text-2xl font-medium">Evaluate it against your own requirements.</h2>
                        <p className="mt-2 text-sm text-white/60">
                            Start with the quickstart, or talk to us about a production integration.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="https://docs.cavos.xyz/docs/quickstart"
                            className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink"
                        >
                            Read the quickstart
                        </a>
                        <Link
                            href="/contact-sales"
                            className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                        >
                            Contact sales
                        </Link>
                    </div>
                </section>
            </div>

            <Footer />
        </main>
    )
}
