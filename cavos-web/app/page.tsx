import Link from 'next/link'
import { Header } from '@/components/Header'
import { AppsCarousel } from '@/components/AppsCarousel'
import { CodeDemoSection } from '@/components/CodeDemoSection'
import { Footer } from '@/components/Footer'
import Script from 'next/script'

export default function LandingPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Cavos",
        "operatingSystem": "Web, iOS, Android",
        "applicationCategory": "FinanceApplication",
        "description": "Cavos embeds smart accounts directly into your product — with social login, gas abstraction, and programmable security.",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "author": { "@type": "Organization", "name": "Cavos Labs", "url": "https://cavos.xyz" }
    }

    return (
        <main className="min-h-screen w-full bg-white text-black font-sans antialiased overflow-x-hidden">
            <Script
                id="json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            {/* ── HERO ──────────────────────────────────────── */}
            <section className="relative min-h-[92vh] flex flex-col justify-center bg-[#0A0908] text-white overflow-hidden dark-grain">

                {/* Warm radial glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, #EAE5DC12 0%, transparent 65%)' }}
                />

                {/* Subtle dot grid (white) */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.07]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #EAE5DC 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />

                {/* Top horizontal rule */}
                <div className="absolute top-[4.5rem] inset-x-0 h-px bg-white/[0.06]" />

                <div className="relative max-w-5xl mx-auto px-6 py-32 text-center space-y-10 z-10">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 border border-white/[0.12] rounded-full text-xs font-semibold text-white/50 animate-fadeUp">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EAE5DC]/60 animate-pulse" />
                        MPC-free verifiable embedded wallets
                        <span className="text-white/20">→</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-[clamp(3rem,9vw,7rem)] font-bold tracking-[-0.04em] leading-[0.88] animate-fadeUp delay-100">
                        Wallets, built into<br />
                        <em className="not-italic font-normal text-white/20">your app.</em>
                    </h1>

                    {/* Description */}
                    <p className="text-base md:text-lg text-white/40 max-w-xl mx-auto leading-relaxed font-normal animate-fadeUp delay-200">
                        Smart accounts embedded directly into your product. Social login, gas abstraction, programmable security. No extensions. No seed phrases.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fadeUp delay-300">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-8 py-3.5 bg-white text-black rounded-xl font-semibold text-sm hover:bg-[#EAE5DC] transition-all active:scale-[0.97]"
                        >
                            Start building →
                        </Link>
                        <a
                            href="https://docs.cavos.xyz"
                            target="_blank"
                            className="w-full sm:w-auto px-8 py-3.5 bg-white/[0.07] text-white rounded-xl font-semibold text-sm hover:bg-white/[0.12] transition-all border border-white/[0.1]"
                        >
                            Read the docs
                        </a>
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center justify-center gap-10 pt-6 border-t border-white/[0.07] animate-fadeUp delay-400">
                        {[
                            { value: '10+',   label: 'Production Apps' },
                            { value: '1.2M+', label: 'Transactions' },
                            { value: '0',     label: 'MPC Shards' },
                        ].map((s, i) => (
                            <div key={s.label} className="text-center space-y-1">
                                <div className="text-lg font-bold tabular-nums text-white">{s.value}</div>
                                <div className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-bold">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom fade to white */}
                <div
                    className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, transparent, #ffffff)' }}
                />
            </section>

            {/* ── APPS CAROUSEL ─────────────────────────────── */}
            <div className="border-t border-black/[0.05]">
                <AppsCarousel />
            </div>

            {/* ── THE PROBLEM ───────────────────────────────── */}
            <section className="py-28 px-6 bg-white border-t border-black/[0.05]">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-[1fr_1px_1fr] gap-16 md:gap-0">
                        <div className="space-y-5 md:pr-16">
                            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">The Problem</div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-[1.05]">
                                Wallet UX is<br />still broken.
                            </h2>
                            <p className="text-sm text-black/45 leading-relaxed max-w-xs">
                                Most blockchain apps rely on external wallets. Users came for your product — not wallet management.
                            </p>
                        </div>

                        <div className="hidden md:block w-px bg-[#EAE5DC]" />

                        <div className="md:pl-16">
                            {[
                                { n: '01', title: 'Context switching',  desc: 'Users leave your app to manage wallets.' },
                                { n: '02', title: 'Browser extensions', desc: 'Dependency on external software installs.' },
                                { n: '03', title: 'Seed phrases',       desc: 'Onboarding friction that kills conversion.' },
                                { n: '04', title: 'Visible gas fees',   desc: 'Confusing UX that breaks payment flows.' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5 py-5 border-b border-black/[0.06] last:border-0">
                                    <span className="text-[10px] font-bold text-black/20 w-5 shrink-0 pt-0.5 tabular-nums">{item.n}</span>
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-semibold text-black">{item.title}</div>
                                        <div className="text-sm text-black/45">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── THE PRODUCT ───────────────────────────────── */}
            <section className="py-28 px-6 bg-[#F7F5F2] border-y border-[#EAE5DC]/80">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="text-center space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">The Solution</div>
                        <h2 className="text-4xl md:text-[3.5rem] font-bold tracking-tighter leading-[1.05]">
                            Cavos makes wallets invisible.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        {[
                            { n: '01', title: 'Embedded Accounts',     desc: 'Smart accounts are created automatically when users sign in. They never leave your interface.' },
                            { n: '02', title: 'Gas Abstraction',       desc: 'Sponsor or manage fees programmatically. Users don\'t need tokens to start transacting.' },
                            { n: '03', title: 'Programmable Security', desc: 'Session keys. Custom policies. Native account abstraction.' },
                        ].map((feature) => (
                            <div
                                key={feature.n}
                                className="group relative p-7 bg-white rounded-2xl border border-[#EAE5DC] hover:border-[#C4BFB6] hover:shadow-lg hover:shadow-black/[0.06] transition-all"
                            >
                                <div className="absolute top-0 left-7 w-8 h-[2px] bg-[#EAE5DC] group-hover:bg-black/20 transition-colors rounded-b-full" />
                                <div className="pt-4 space-y-3">
                                    <div className="text-[10px] font-bold text-black/20 tracking-widest">{feature.n}</div>
                                    <h4 className="text-lg font-bold text-black">{feature.title}</h4>
                                    <p className="text-sm text-black/50 leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <Link href="https://docs.cavos.xyz" target="_blank" className="inline-flex items-center gap-2 text-sm font-bold text-black border-b-2 border-[#EAE5DC] pb-1 hover:border-black transition-colors">
                            Explore architecture →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ──────────────────────────────── */}
            <section className="py-28 px-6 bg-white">
                <div className="max-w-5xl mx-auto space-y-16">
                    <div className="text-center space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">How It Works</div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Four steps to invisible wallets.</h2>
                    </div>

                    <div className="relative">
                        <div className="hidden lg:block absolute top-8 left-[calc(12.5%-1rem)] right-[calc(12.5%-1rem)] h-px bg-[#EAE5DC]" />
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { step: '01', title: 'Authenticate',      desc: 'Login via OAuth or email.' },
                                { step: '02', title: 'Provision Account', desc: 'Cavos deploys a smart account on-chain.' },
                                { step: '03', title: 'Execute',           desc: 'Transactions run through your backend or client.' },
                                { step: '04', title: 'Scale',             desc: 'Manage accounts and policies via API.' },
                            ].map((item) => (
                                <div key={item.step} className="space-y-4">
                                    <div className="relative w-16 h-16 flex items-center justify-center bg-white border-2 border-[#EAE5DC] rounded-2xl z-10">
                                        <span className="text-xl font-bold text-[#C4BFB6] tabular-nums">{item.step}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm">{item.title}</h4>
                                        <p className="text-sm text-black/45 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-center text-xs text-black/25 italic">All accounts are self-custodial smart contracts.</p>
                </div>
            </section>

            {/* ── CODE DEMO ─────────────────────────────────── */}
            <section className="py-28 px-6 bg-white border-t border-black/[0.05]">
                <div className="max-w-6xl mx-auto">
                    <CodeDemoSection />
                </div>
            </section>

            {/* ── METRICS — dark ────────────────────────────── */}
            <section className="py-32 px-6 bg-[#0A0908] text-white relative overflow-hidden dark-grain">
                <div
                    className="absolute top-0 inset-x-0 h-[50%] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, #EAE5DC07 0%, transparent 70%)' }}
                />

                <div className="max-w-6xl mx-auto space-y-20">
                    <div className="space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">By the numbers</div>
                        <h2 className="text-4xl md:text-[3.5rem] font-bold tracking-tighter">Built for the future.</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10 border-t border-white/[0.08] pt-12">
                        {[
                            { value: '10+',   label: 'Production Apps' },
                            { value: '81+',   label: 'Wallets Deployed' },
                            { value: '1.2M+', label: 'Transactions' },
                            { value: '0',     label: 'MPC Shards' },
                        ].map((stat) => (
                            <div key={stat.label} className="space-y-3">
                                <div className="text-5xl md:text-6xl font-bold tracking-tighter tabular-nums">{stat.value}</div>
                                <div className="w-7 h-[2px] bg-[#EAE5DC]/35 rounded-full" />
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-white/[0.06]">
                        {[
                            { title: 'Native AA',           desc: 'No workarounds. Built on pure Cairo 2.x.' },
                            { title: 'Smart Account Infra', desc: 'A complete account lifecycle engine.' },
                            { title: 'Full Control',        desc: 'You define authentication, gas, and spending policies.' },
                            { title: 'Production Ready',    desc: 'Built for scale. Powering live applications today.' },
                        ].map((item) => (
                            <div key={item.title} className="space-y-2">
                                <h4 className="text-sm font-semibold text-white/65">{item.title}</h4>
                                <p className="text-xs text-white/30 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── COMPARISON ────────────────────────────────── */}
            <section className="py-28 px-6 bg-white">
                <div className="max-w-3xl mx-auto space-y-12">
                    <div className="text-center space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">Comparison</div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Purpose-built infrastructure.</h2>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#EAE5DC]">
                        <table className="w-full border-collapse bg-white">
                            <thead>
                                <tr className="bg-[#F7F5F2] border-b border-[#EAE5DC]">
                                    <th className="p-5 text-left text-[10px] font-bold uppercase tracking-widest text-black/35">Feature</th>
                                    <th className="p-5 text-center text-[10px] font-bold uppercase tracking-widest text-black">Cavos</th>
                                    <th className="p-5 text-center text-[10px] font-bold uppercase tracking-widest text-black/35">Browser Wallets</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { f: 'Embedded UX',      c: '✓', b: '✕' },
                                    { f: 'Programmatic gas', c: '✓', b: 'Limited' },
                                    { f: 'Session keys',     c: '✓', b: '✕' },
                                    { f: 'Smart accounts',   c: '✓', b: 'Varies' },
                                ].map((row, i) => (
                                    <tr key={i} className="border-t border-[#EAE5DC]/60 hover:bg-[#F7F5F2]/60 transition-colors text-sm font-medium">
                                        <td className="p-5 text-black/55">{row.f}</td>
                                        <td className="p-5 text-center font-bold text-black">{row.c}</td>
                                        <td className="p-5 text-center text-black/25">{row.b}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="text-center">
                        <Link href="/compare" className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 hover:text-black transition-colors">
                            View full comparison matrix →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── SECURITY — dark ───────────────────────────── */}
            <section className="py-28 px-6 bg-[#0A0908] text-white dark-grain">
                <div className="max-w-5xl mx-auto space-y-14">
                    <div className="space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">Security</div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Security by architecture.</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { title: 'Smart accounts, not EOAs',       desc: 'Full programmable account logic via Cairo.' },
                            { title: 'Programmable key permissions',    desc: 'Define granular policies for keys and signers.' },
                            { title: 'Session key support',             desc: 'Temporary scoped permissions for apps.' },
                            { title: 'Backend relay compatibility',     desc: 'Transaction relay without frontend exposure.' },
                            { title: 'Native AA design',                desc: 'No shims. Pure native account abstraction.' },
                            { title: 'On-chain RSA-2048 verification',  desc: 'Signatures verified on-chain via Garaga.' },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="group p-5 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all"
                            >
                                <div className="w-6 h-[2px] bg-[#EAE5DC]/35 mb-4 group-hover:bg-[#EAE5DC]/65 transition-colors rounded-full" />
                                <h4 className="text-sm font-semibold text-white/75 mb-1.5">{item.title}</h4>
                                <p className="text-xs text-white/35 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BUILT FOR ─────────────────────────────────── */}
            <section className="py-28 px-6 bg-[#F7F5F2] border-b border-[#EAE5DC]/60">
                <div className="max-w-6xl mx-auto space-y-14">
                    <div className="text-center space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">Who It's For</div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Built for builders.</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        {[
                            { title: 'Developers',    desc: 'Integrate without rebuilding auth. Clean SDKs for Web and Mobile.' },
                            { title: 'Product Teams', desc: 'Reduce wallet friction and increase activation immediately.' },
                            { title: 'Founders',      desc: 'Ship faster without owning wallet infrastructure overhead.' },
                        ].map((card) => (
                            <div
                                key={card.title}
                                className="p-8 bg-white rounded-2xl border border-[#EAE5DC] hover:shadow-md hover:shadow-black/[0.05] hover:border-[#C4BFB6] transition-all space-y-3"
                            >
                                <h4 className="text-lg font-bold">{card.title}</h4>
                                <p className="text-sm text-black/45 leading-relaxed">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ─────────────────────────────────── */}
            <section className="relative py-40 px-6 text-center bg-[#0A0908] text-white overflow-hidden dark-grain">
                <div
                    className="absolute top-0 inset-x-0 h-full pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, #EAE5DC0A 0%, transparent 65%)' }}
                />

                <div className="relative max-w-3xl mx-auto space-y-10">
                    <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">Get Started</div>
                    <h2 className="text-[clamp(2.5rem,8vw,5rem)] font-bold tracking-tighter leading-[0.9]">
                        Stop sending users<br />
                        <em className="not-italic font-normal text-white/25">to wallet popups.</em>
                    </h2>
                    <p className="text-sm text-white/40">Build with accounts directly inside your product.</p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-8 py-3.5 bg-white text-black rounded-xl font-semibold text-sm hover:bg-[#EAE5DC] transition-all active:scale-[0.97]"
                        >
                            Start building →
                        </Link>
                        <Link
                            href="mailto:hello@cavos.xyz"
                            className="w-full sm:w-auto px-8 py-3.5 bg-white/[0.07] text-white rounded-xl font-semibold text-sm hover:bg-white/[0.12] transition-all border border-white/[0.1]"
                        >
                            Contact us
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
