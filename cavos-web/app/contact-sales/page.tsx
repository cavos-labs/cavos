import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { HeroOrb } from '@/components/HeroOrb'
import { ContactSalesForm } from '@/components/ContactSalesForm'

export const metadata = {
    title: 'Contact Sales — Cavos',
    description:
        'Talk to the Cavos team about embedded wallets, gasless transactions, and account abstraction for your product.',
    alternates: {
        canonical: 'https://cavos.xyz/contact-sales',
    },
    openGraph: {
        title: 'Contact Sales — Cavos',
        description:
            'Talk to the Cavos team about embedded wallets, gasless transactions, and account abstraction for your product.',
        url: 'https://cavos.xyz/contact-sales',
    },
}

export default function ContactSalesPage() {
    return (
        <main className="relative isolate min-h-screen w-full overflow-x-hidden bg-white text-ink font-sans antialiased">
            <Header />

            {/* Signature indigo orb — pinned to the viewport so it stays behind the
                form even when a step is taller than the screen */}
            <HeroOrb fixed />

            {/* Framed grid container — hairline rules on both edges, matching the landing */}
            <div className="relative mx-auto max-w-[1280px] border-x border-line">
                <div className="flex flex-col pt-[4.5rem] md:min-h-screen">
                    <section className="relative flex flex-1 items-start px-6 pt-12 pb-16 md:items-center md:px-16 md:pt-16 md:pb-20 lg:px-24">
                        <div className="w-full max-w-[560px]">
                            {/* Intro — understated, in the landing's voice */}
                            <h1 className="text-[clamp(1.75rem,2.3vw,2.375rem)] font-normal leading-[1.3] tracking-[-0.02em] text-ink text-balance">
                                <span className="font-medium">Talk to the team.</span>
                                <br />
                                Tell us about your product and we&rsquo;ll help you ship.
                            </h1>
                            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
                                A few quick details and the right person reaches out — usually
                                within a business day. Prefer email?{' '}
                                <a
                                    href="mailto:adrianvrj@cavos.xyz"
                                    className="font-medium text-brand transition-colors hover:text-brand-hover"
                                >
                                    adrianvrj@cavos.xyz
                                </a>
                                .
                            </p>

                            <div className="mt-10">
                                <ContactSalesForm />
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <Footer />
        </main>
    )
}
