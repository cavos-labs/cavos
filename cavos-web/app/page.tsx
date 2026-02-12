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
        "description": "Verifiable, MPC-free embedded wallets for humans and AI agents on Starknet. Turn OAuth identities into self-custodial wallets with on-chain RSA verification.",
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
        <main className="min-h-screen w-full overflow-x-hidden bg-white text-black font-sans antialiased">
            <Script
                id="json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="inline-block px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        The Sovereignty Layer for Starknet
                    </div>
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-black">
                        Invisible Wallets for the <br />
                        <span className="italic text-gray-400">Agentic Era</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
                        Embed verifiable, MPC-free signers into your application. 
                        Enable seamless onboarding for humans and autonomous signing for AI agents.
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
                            View Docs
                        </a>
                    </div>
                </div>

                {/* Hero Visual - ASCII Art with overlay */}
                <div className="relative mt-20 w-full max-w-5xl mx-auto">
                    <Image
                        src="/ascii-cavos.png"
                        alt="Cavos Core Architecture"
                        width={1200}
                        height={600}
                        className="w-full h-auto opacity-80"
                        priority
                    />
                </div>
            </section>

            {/* Value Segmentation: Humans & Agents */}
            <section className="py-32 bg-gray-50 border-y border-gray-100 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white text-xl font-bold">H</div>
                            <h2 className="text-3xl font-bold tracking-tight">For Humans</h2>
                            <p className="text-gray-500 leading-relaxed">
                                Eliminate seed phrases and browser extensions. Allow users to login with **Google or Apple** and get a fully functional, gasless wallet in under 30 seconds.
                            </p>
                            <ul className="space-y-3 text-sm font-medium text-black">
                                <li className="flex items-center gap-2">✓ Familiar Web2 Auth</li>
                                <li className="flex items-center gap-2">✓ Fully Gasless (AVNU Integration)</li>
                                <li className="flex items-center gap-2">✓ Self-Custodial Recovery</li>
                            </ul>
                        </div>
                        <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white text-xl font-bold">A</div>
                            <h2 className="text-3xl font-bold tracking-tight">For AI Agents</h2>
                            <p className="text-gray-500 leading-relaxed">
                                Power autonomous agents with **Headless Signing**. Use on-chain authorized session tokens to sign transactions without exposing long-lived private keys.
                            </p>
                            <ul className="space-y-3 text-sm font-medium text-black">
                                <li className="flex items-center gap-2">✓ Master-less / Headless Mode</li>
                                <li className="flex items-center gap-2">✓ On-chain Spending Policies</li>
                                <li className="flex items-center gap-2">✓ Verifiable Agent Identity</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Proof Section */}
            <section className="py-32 px-6">
                <div className="max-w-6xl mx-auto space-y-24">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-black">
                            The Only Verifiable, <br />
                            <span className="italic text-gray-400">MPC-free</span> Infrastructure
                        </h2>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            Stop trusting black-box shards. Cavos uses direct on-chain RSA-2048 verification for 100% mathematical sovereignty.
                        </p>
                        <div className="pt-8">
                            <Link href="/compare" className="text-black font-bold border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-all">
                                Compare Cavos to Privy & Dynamic →
                            </Link>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { label: "Production Apps", value: "10+" },
                            { label: "Wallets Deployed", value: "81+" },
                            { label: "Onboarding Time", value: "<30s" },
                            { label: "MPC Shards Stored", value: "0" }
                        ].map((stat, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-gray-50 text-center border border-gray-100">
                                <div className="text-4xl font-bold text-black mb-2">{stat.value}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Integration Carousel */}
            <section className="py-20 border-t border-gray-100 overflow-hidden bg-white">
                <div className="text-center mb-12">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">Trusted by Starknet Builders</span>
                </div>
                <AppsCarousel />
            </section>

            {/* Technical Demo */}
            <section className="py-32 bg-gray-50 border-t border-gray-100">
                <div className="max-w-6xl mx-auto px-6 space-y-16">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl font-bold tracking-tight mb-6 text-black">Integrate in minutes</h2>
                        <p className="text-gray-500 text-lg">
                            Add invisible wallets to your React or React Native application using our developer-first toolset.
                        </p>
                    </div>
                    <CodeDemoSection className="rounded-3xl shadow-2xl overflow-hidden border border-gray-200" />
                </div>
            </section>

            {/* Comparison Hint & Footer */}
            <Footer />
        </main>
    )
}
