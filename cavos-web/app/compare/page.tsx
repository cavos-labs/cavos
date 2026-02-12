import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import Script from 'next/script'

export const metadata = {
    title: "Cavos vs The Rest | The Sovereignty Matrix",
    description: "Technical comparison between Cavos, Privy, Dynamic, and Cartridge. Why verifiable, MPC-free signers are the future of Starknet.",
}

export default function ComparePage() {
    const comparison = [
        {
            feature: "Core Architecture",
            cavos: "On-chain RSA-2048 Verification",
            privy: "MPC Shards (Black Box)",
            cartridge: "Session Key Controllers",
            benefit: "Cavos uses Montgomery Reduction in Cairo to verify JWTs directly on the protocol layer."
        },
        {
            feature: "Signing Logic",
            cavos: "Truly Verifiable On-chain",
            privy: "Off-chain Provider Shards",
            cartridge: "Browser-based Auth Hooks",
            benefit: "Anyone can verify the authorization proof on Starknet explorer. MPC is a black box."
        },
        {
            feature: "AI Agent Ready",
            cavos: "Native Master-less/Headless support",
            privy: "Insecure Private Key Injection",
            cartridge: "Primarily UX-focused for Humans",
            benefit: "Cavos session tokens allow autonomous agents to sign safely without storing private keys."
        },
        {
            feature: "Mobile Experience",
            cavos: "Native React Native SDK (Passkeys)",
            privy: "Browser/WebView Dependent",
            cartridge: "Controller Web App Wrapper",
            benefit: "Cavos provides a seamless mobile onboarding without external browser popups."
        },
        {
            feature: "Gasless / Sponsorship",
            cavos: "Integrated AVNU Paymaster",
            privy: "Requires Custom Relayer Setup",
            cartridge: "Integrated Paymaster Infrastructure",
            benefit: "Transactions are sponsored by default. Users never need to hold ETH to start."
        },
        {
            feature: "Account Recovery",
            cavos: "OAuth Identity (Google/Apple)",
            privy: "Shard Recovery APIs",
            cartridge: "Passkey / Social Recovery",
            benefit: "Your identity IS your wallet. No seed phrases, no shards, no vendor lock-in."
        },
        {
            feature: "Implementation",
            cavos: "npx skills add + <20 lines of code",
            privy: "Complex API/App Config",
            cartridge: "Contract-specific Integration",
            benefit: "Get from zero to invisible wallet in 15 minutes with developer-first tooling."
        },
        {
            feature: "Sovereignty Mode",
            cavos: "100% Non-Custodial (No Shard storage)",
            privy: "Provider-held key fragments",
            cartridge: "Self-custodial Controller",
            benefit: "Cavos stores ZERO fragments of your keys. Only the Account Contract has authority."
        },
        {
            feature: "Protocol Native",
            cavos: "Starknet Native (Cairo 2.x)",
            privy: "Generic Cross-chain (EVM-first)",
            cartridge: "Starknet Native",
            benefit: "Built for Starknet's native Account Abstraction from day one."
        },
        {
            feature: "Performance",
            cavos: "Direct L2 Settlement",
            privy: "Bridge/Backend Latency",
            cartridge: "Optimized L2 settlement",
            benefit: "Minimized latency using session tokens authorized directly on-chain."
        }
    ]

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": comparison.map(row => ({
            "@type": "Question",
            "name": `How does Cavos compare to ${row.feature}?`,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": row.benefit
            }
        }))
    }

    return (
        <main className="bg-white min-h-screen text-black font-sans antialiased">
            <Script
                id="compare-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />
            <div className="max-w-6xl mx-auto px-6 py-32">
                <header className="mb-20 text-center">
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-6">
                        The Sovereignty Matrix
                    </h1>
                    <p className="text-xl text-gray-500 max-w-3xl mx-auto">
                        Choosing a wallet infrastructure is a decision about trust. 
                        While competitors focus on black-box MPC, Cavos delivers the only **verifiable, MPC-free** alternative for Starknet.
                    </p>
                </header>

                <div className="overflow-x-auto shadow-2xl rounded-3xl border border-gray-100">
                    <table className="w-full border-collapse bg-white">
                        <thead>
                            <tr className="bg-black text-white">
                                <th className="p-8 text-left uppercase text-[10px] tracking-[0.3em] font-bold">Vector</th>
                                <th className="p-8 text-left font-extrabold text-lg border-x border-white/10 italic">CAVOS</th>
                                <th className="p-8 text-left text-gray-400 font-medium text-sm">Privy / Dynamic</th>
                                <th className="p-8 text-left text-gray-400 font-medium text-sm">Cartridge</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparison.map((row, i) => (
                                <tr key={i} className="group border-b border-gray-50 hover:bg-gray-50/80 transition-all">
                                    <td className="p-8 font-bold text-gray-400 text-xs uppercase tracking-widest">{row.feature}</td>
                                    <td className="p-8 font-bold text-black bg-blue-50/5 border-x border-gray-100">
                                        <div className="flex flex-col gap-2">
                                            <span className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                                                {row.cavos}
                                            </span>
                                            <span className="text-[10px] font-medium text-gray-400 leading-tight hidden group-hover:block transition-all">
                                                {row.benefit}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-8 text-gray-500 text-sm">{row.privy}</td>
                                    <td className="p-8 text-gray-500 text-sm">{row.cartridge}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-32 grid md:grid-cols-3 gap-12 border-t border-gray-100 pt-20">
                    <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Zero Shard Policy</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Unlike MPC providers, we never store fragments of your key. RSA verification happens directly in Cairo. No off-chain cluster involved.
                        </p>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Master-less Agents</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Authorized sessions allow AI agents to operate autonomously with on-chain guardrails. Perfect for Eliza-based frameworks.
                        </p>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Gasless Onboarding</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Fully integrated with AVNU Paymaster to ensure your users never hit an "Insufficient Gas" error. Seamless from day zero.
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    )
}
