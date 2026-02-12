import Image from 'next/image'
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
        "description": "Embed invisible wallets into your app. Social/Email login, gasless transactions, and 100% self-custodial infrastructure for humans and AI agents on Starknet.",
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

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-6 flex flex-col items-center justify-center text-center">
                <div className="max-w-5xl mx-auto space-y-10">
                    <div className="inline-block px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        OAuth for Blockchain
                    </div>
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-black">
                        Embed Invisible Wallets <br />
                        <span className="italic text-gray-400">Into Your App</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
                        No seed phrases. No extensions. No blockchain confusion. <br />
                        Provide a seamless Web2 login that results in a verifiable, <br />
                        self-custodial Starknet wallet.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-10 py-5 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-900 transition-all shadow-xl shadow-black/5"
                        >
                            Get Started
                        </Link>
                        <a
                            href="https://docs.cavos.xyz"
                            target="_blank"
                            className="w-full sm:w-auto px-10 py-5 bg-gray-50 text-black rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all border border-gray-100"
                        >
                            Read Documentation
                        </a>
                    </div>
                </div>
            </section>

            {/* Audience / Benefit Section */}
            <section className="py-24 bg-white px-6 border-t border-gray-50">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">For Builders</h3>
                        <h4 className="text-2xl font-bold">Add frictionless wallets in minutes</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Integrate with our React or React Native SDKs. Get from zero to a live wallet using only social or email authentication.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">For Teams</h3>
                        <h4 className="text-2xl font-bold">Turn Web2 users into Web3 users</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Onboard users without explaining gas fees or seed phrases. They use the app, you handle the infrastructure.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">For Agents</h3>
                        <h4 className="text-2xl font-bold">The standard for AI Signers</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            The only MPC-free signer that allows autonomous agents to sign verifiable transactions on-chain with granular policies.
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-32 bg-gray-50 border-y border-gray-100 px-6 text-center">
                <div className="max-w-6xl mx-auto space-y-20">
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">Simple User Flow</h2>
                        <p className="text-gray-500 text-lg">Four steps to absolute sovereignty.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { step: "01", title: "Authentication", desc: "User signs in with Google, Apple, or Email." },
                            { step: "02", title: "Smart Account", desc: "A self-custodial account is created deterministically." },
                            { step: "03", title: "Verification", desc: "JWT signatures are verified directly on-chain." },
                            { step: "04", title: "Execution", desc: "Transactions are executed gasless via Paymaster." }
                        ].map((item, i) => (
                            <div key={i} className="text-left space-y-4 p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                                <div className="text-3xl font-bold text-gray-200">{item.step}</div>
                                <h4 className="font-bold text-lg">{item.title}</h4>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Adoption Metrics */}
            <section className="py-32 px-6 bg-white">
                <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12">
                    {[
                        { label: "Active DApps", value: "10+" },
                        { label: "Wallets Deployed", value: "81+" },
                        { label: "Onboarding Time", value: "<30s" },
                        { label: "MPC Shards", value: "0" }
                    ].map((stat, i) => (
                        <div key={i} className="space-y-2">
                            <div className="text-5xl font-bold tracking-tighter">{stat.value}</div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Comparison Link */}
            <section className="pb-32 px-6 text-center">
                <div className="max-w-3xl mx-auto p-12 rounded-[3rem] bg-gray-50 border border-gray-100 space-y-6">
                    <h3 className="text-3xl font-bold">Compare to Privy & Dynamic</h3>
                    <p className="text-gray-500">Discover why verifiable, MPC-free signers are the only secure choice for the agentic era.</p>
                    <Link href="/compare" className="inline-block px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-900 transition-all">
                        View Technical Matrix
                    </Link>
                </div>
            </section>

            {/* Integration Carousel */}
            <section className="py-20 border-t border-gray-50 overflow-hidden bg-white">
                <div className="text-center mb-12">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">Live Integrations</span>
                </div>
                <AppsCarousel />
            </section>

            {/* Technical Section: Integrate in minutes */}
            <section className="py-32 bg-white px-6">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="max-w-2xl">
                        <h2 className="text-5xl font-bold tracking-tight mb-6 text-black">Integrate in minutes</h2>
                        <p className="text-gray-500 text-xl leading-relaxed">
                            Add invisible wallets to your React or React Native application using our developer-first toolset.
                        </p>
                    </div>
                    <CodeDemoSection />
                </div>
            </section>

            <Footer />
        </main>
    )
}
