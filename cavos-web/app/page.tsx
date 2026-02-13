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
        "description": "Cavos embeds Starknet smart accounts directly into your product — with social login, gas abstraction, and programmable security.",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "author": {
            "@type": "Organization",
            "name": "Cavos Labs",
            "url": "https://cavos.xyz"
        }
    }

    return (
        <main className="min-h-screen w-full bg-white text-black font-sans antialiased overflow-x-hidden">
            <Script
                id="json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            {/* HERO SECTION */}
            <section className="relative pt-40 pb-32 px-6 flex flex-col items-center justify-center text-center">
                <div className="max-w-5xl mx-auto space-y-10">
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-black">
                        Wallets, built into <br />
                        <span className="italic text-gray-400">your app.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
                        Cavos embeds Starknet smart accounts directly into your product — with social login, gas abstraction, and programmable security. No extensions. No seed phrases. No wallet popups.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-10 py-5 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-900 transition-all shadow-xl shadow-black/5"
                        >
                            Start building
                        </Link>
                        <a
                            href="https://docs.cavos.xyz"
                            target="_blank"
                            className="w-full sm:w-auto px-10 py-5 bg-gray-50 text-black rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all border border-gray-100"
                        >
                            Read the docs
                        </a>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        Built on Starknet native account abstraction.
                    </p>
                </div>
            </section>

            {/* APPS CAROUSEL */}
            <AppsCarousel />

            {/* THE PROBLEM */}
            <section className="py-32 px-6 bg-white border-t border-gray-50">
                <div className="max-w-4xl mx-auto space-y-12">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-black">Wallet UX is still broken.</h2>
                    <div className="grid md:grid-cols-2 gap-12">
                        <p className="text-xl text-gray-600 leading-relaxed">
                            Most blockchain apps rely on external wallets. Users came for your product — not for wallet management.
                        </p>
                        <ul className="space-y-4 text-lg font-medium text-gray-400">
                            <li>• Context switching</li>
                            <li>• Browser extensions</li>
                            <li>• Seed phrases</li>
                            <li>• Visible gas fees</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* THE PRODUCT */}
            <section className="py-32 bg-gray-50 border-y border-gray-100 px-6">
                <div className="max-w-6xl mx-auto space-y-20">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-center">Cavos makes wallets invisible.</h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { title: "Embedded Accounts", desc: "Smart accounts are created automatically when users sign in. They never leave your interface." },
                            { title: "Gas Abstraction", desc: "Sponsor or manage fees programmatically. Users don't need tokens to start." },
                            { title: "Programmable Security", desc: "Session keys. Custom policies. Built on Starknet account abstraction." }
                        ].map((feature, i) => (
                            <div key={ feature.title } className="space-y-4">
                                <h4 className="text-2xl font-bold text-black">{ feature.title }</h4>
                                <p className="text-gray-500 leading-relaxed">{ feature.desc }</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Link href="https://docs.cavos.xyz" target="_blank" className="text-black font-bold border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-all">
                            Explore architecture →
                        </Link>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-32 bg-white px-6">
                <div className="max-w-6xl mx-auto space-y-24">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">How It Works</h2>
                        <p className="text-gray-500 text-lg">Minimal infrastructure for maximum control.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { step: "1", title: "Authenticate", desc: "Login via OAuth or email." },
                            { step: "2", title: "Provision Account", desc: "Cavos deploys a Starknet smart account." },
                            { step: "3", title: "Execute", desc: "Transactions run through your backend or client." },
                            { step: "4", title: "Scale", desc: "Manage accounts and policies via API." }
                        ].map((item, i) => (
                            <div key={i} className="space-y-4 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                <div className="text-2xl font-bold text-gray-300">{item.step}</div>
                                <h4 className="font-bold text-lg">{item.title}</h4>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-xs text-gray-400 italic">All accounts are self-custodial smart contracts.</p>
                </div>
            </section>

            {/* CODE BLOCK SECTION */}
            <section className="py-32 bg-white px-6">
                <div className="max-w-6xl mx-auto">
                    <CodeDemoSection />
                </div>
            </section>

            {/* WHY CAVOS / METRICS */}
            <section className="py-32 bg-gray-50 border-y border-gray-100 px-6">
                <div className="max-w-6xl mx-auto space-y-24">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-center">Designed for Starknet.</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: "Native AA", desc: "No workarounds. No patch layers. Built on pure Cairo 2.x." },
                            { title: "Smart Account Infra", desc: "Not just a wallet connector. A complete account lifecycle engine." },
                            { title: "Full Control", desc: "You define authentication, gas, and spending policies." },
                            { title: "Production Ready", desc: "Built for scale, not demos. Powering live applications today." }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <h4 className="font-bold text-lg">{item.title}</h4>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-4 gap-12 pt-20 border-t border-gray-200">
                        {[
                            { label: "Production Apps", value: "10+" },
                            { label: "Wallets Deployed", value: "81+" },
                            { label: "Transactions", value: "1.2M+" },
                            { label: "MPC Shards", value: "0" }
                        ].map((stat, i) => (
                            <div key={i} className="space-y-2">
                                <div className="text-5xl font-bold tracking-tighter">{stat.value}</div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* COMPARISON SUBTLE */}
            <section className="py-32 bg-white px-6">
                <div className="max-w-4xl mx-auto space-y-16">
                    <h2 className="text-4xl font-bold tracking-tighter text-center">Purpose-built infrastructure.</h2>
                    <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-sm">
                        <table className="w-full border-collapse bg-white">
                            <thead>
                                <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <th className="p-6 text-left">Feature</th>
                                    <th className="p-6 text-center text-black">Cavos</th>
                                    <th className="p-6 text-center">Browser Wallets</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                {[
                                    { f: "Embedded UX", c: "✓", b: "✕" },
                                    { f: "Programmatic gas", c: "✓", b: "Limited" },
                                    { f: "Session keys", c: "✓", b: "✕" },
                                    { f: "Smart accounts", c: "✓", b: "Varies" }
                                ].map((row, i) => (
                                    <tr key={i} className="border-t border-gray-50">
                                        <td className="p-6 text-gray-600">{row.f}</td>
                                        <td className="p-6 text-center font-bold text-black">{row.c}</td>
                                        <td className="p-6 text-center text-gray-400">{row.b}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-center">
                        <Link href="/compare" className="text-sm font-bold text-primary hover:underline">
                            View technical sovereignty matrix →
                        </Link>
                    </div>
                </div>
            </section>

            {/* SECURITY */}
            <section className="py-32 bg-black text-white px-6">
                <div className="max-w-4xl mx-auto space-y-12">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Security by architecture.</h2>
                    <div className="grid md:grid-cols-2 gap-x-20 gap-y-10">
                        {[
                            "Smart accounts, not EOAs",
                            "Programmable key permissions",
                            "Session key support",
                            "Backend relay compatibility",
                            "Starknet-native design",
                            "On-chain RSA verification"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 text-lg font-medium text-gray-300">
                                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* BUILT FOR */}
            <section className="py-32 bg-gray-50 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
                    {[
                        { title: "Developers", desc: "Integrate without rebuilding auth. Clean SDKs for Web and Mobile." },
                        { title: "Product Teams", desc: "Reduce wallet friction and increase activation immediately." },
                        { title: "Founders", desc: "Ship faster without owning wallet infrastructure overhead." }
                    ].map((card, i) => (
                        <div key={i} className="p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                            <h4 className="text-xl font-bold">{card.title}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-40 px-6 text-center bg-white border-t border-gray-50">
                <div className="max-w-3xl mx-auto space-y-10">
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-black leading-tight">
                        Stop sending users <br />to wallet popups.
                    </h2>
                    <p className="text-xl text-gray-500">Build with accounts directly inside your product.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-10 py-5 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-900 transition-all shadow-xl shadow-black/5"
                        >
                            Start building
                        </Link>
                        <Link
                            href="mailto:hello@cavos.xyz"
                            className="w-full sm:w-auto px-10 py-5 bg-gray-50 text-black rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all border border-gray-100"
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
