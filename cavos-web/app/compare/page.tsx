import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import Script from 'next/script'
import Link from 'next/link'

export const metadata = {
    title: "Cavos vs The Rest | The Sovereignty Matrix",
    description: "Technical comparison between Cavos, Privy, Dynamic, and Passkey Wallets. Why verifiable, MPC-free signers are the future of Starknet.",
}

export default function ComparePage() {
    const comparison = [
        {
            feature: "Core Architecture",
            cavos: "On-chain RSA-2048 Verification",
            privy: "MPC Shards (Off-chain)",
            passkey: "Session Key Controllers",
            benefit: "Cavos uses Montgomery Reduction in Cairo to verify JWTs directly on the protocol layer."
        },
        {
            feature: "Signing Logic",
            cavos: "Truly Verifiable On-chain",
            privy: "Provider-managed Shards",
            passkey: "Browser-based Auth Hooks",
            benefit: "Anyone can verify the authorization proof on Starknet explorer. MPC relies on provider backend."
        },
        {
            feature: "AI Agent Signer",
            cavos: "Native Headless / Master-less support",
            privy: "Requires key injection",
            passkey: "Primarily human-centric",
            benefit: "Cavos session tokens allow autonomous agents to sign safely without storing private keys."
        },
        {
            feature: "Mobile Experience",
            cavos: "Native React Native SDK (Passkeys)",
            privy: "Browser / WebView dependent",
            passkey: "Web app wrapper",
            benefit: "Cavos provides a seamless mobile onboarding without external browser popups."
        },
        {
            feature: "Gasless / Sponsorship",
            cavos: "Native AVNU Paymaster integration",
            privy: "Custom relayer setup",
            passkey: "Integrated paymaster",
            benefit: "Transactions are sponsored by default. Users never need to hold ETH to start."
        },
        {
            feature: "Account Recovery",
            cavos: "OAuth Identity (Google/Apple)",
            privy: "Shard-based recovery",
            passkey: "Passkey / Social recovery",
            benefit: "Your identity IS your wallet. No seed phrases, no shards, no vendor lock-in."
        },
        {
            feature: "Implementation",
            cavos: "npx skills add → ~15 min setup",
            privy: "Dashboard + API config",
            passkey: "Contract-level integration",
            benefit: "Get from zero to invisible wallet in 15 minutes with developer-first tooling."
        },
        {
            feature: "Sovereignty Mode",
            cavos: "100% Non-Custodial (No shards stored)",
            privy: "Provider-held key fragments",
            passkey: "Self-custodial controller",
            benefit: "Cavos stores ZERO fragments of your keys. Only the Account Contract has authority."
        },
        {
            feature: "Production Usage",
            cavos: "10+ dApps • 81+ wallets (growing)",
            privy: "Strong cross-chain adoption",
            passkey: "Dominant in Starknet gaming",
            benefit: "Cavos is the chosen infrastructure for high-growth Starknet consumer applications."
        },
        {
            feature: "Performance",
            cavos: "Direct L2 settlement",
            privy: "Bridge / backend latency",
            passkey: "Optimized L2 settlement",
            benefit: "Minimized latency using session tokens authorized directly on-chain."
        }
    ]

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": comparison.map(row => ({
            "@type": "Question",
            "name": `How does Cavos compare on ${row.feature}?`,
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
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 text-black">
                        The Sovereignty Matrix
                    </h1>
                    <p className="text-xl text-gray-500 max-w-3xl mx-auto">
                        Choosing a wallet infrastructure is a decision about trust. 
                        Cavos is the only **verifiable, MPC-free** infrastructure built natively for Starknet.
                    </p>
                </header>

                <div className="relative group">
                    {/* Mobile scroll hint */}
                    <div className="md:hidden flex items-center justify-center gap-2 mb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Scroll to compare
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>

                    <div className="overflow-x-auto shadow-2xl rounded-3xl border border-gray-100">
                        <table className="w-full border-collapse bg-white min-w-[800px]">
                            <thead>
                                <tr className="bg-black text-white">
                                    <th className="p-8 text-left uppercase text-[10px] tracking-[0.3em] font-bold">Vector</th>
                                    <th className="p-8 text-left font-extrabold text-lg border-x border-white/10 italic text-white">Cavos</th>
                                    <th className="p-8 text-left text-gray-400 font-medium text-sm">Privy / Dynamic</th>
                                    <th className="p-8 text-left text-gray-400 font-medium text-sm">Passkey Wallets</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparison.map((row, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/80 transition-all">
                                        <td className="p-8 font-bold text-gray-400 text-xs uppercase tracking-widest">{row.feature}</td>
                                        <td className="p-8 font-bold text-black bg-blue-50/5 border-x border-gray-100">
                                            <div className="flex flex-col gap-2">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                                                    {row.cavos}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-8 text-gray-500 text-sm">{row.privy}</td>
                                        <td className="p-8 text-gray-500 text-sm">{row.passkey}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                    Cavos SDK can be integrated via <a href="https://github.com/cavos-labs/cavos-skills" target="_blank" className="text-black underline decoration-gray-200 hover:decoration-black transition-all">npx skills add cavos-labs/cavos-skills</a>
                </p>

                <div className="mt-32 space-y-16">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-center mb-12 text-black">Featured Integration</h2>
                    <div className="max-w-4xl mx-auto p-12 rounded-[3rem] bg-gray-50 border border-gray-100 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-4xl font-bold italic mb-2 text-black">Cofiblocks</h3>
                                <a href="https://app.cofiblocks.com" target="_blank" className="text-primary font-medium hover:underline tracking-tight text-lg">app.cofiblocks.com</a>
                            </div>
                            <div className="px-6 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full w-fit">
                                Live on Mainnet
                            </div>
                        </div>
                        <p className="text-2xl text-gray-600 leading-tight font-serif italic">
                            "Cavos enables us to onboard coffee farmers directly to Starknet without the friction of traditional wallets. They get the benefits of decentralization and middleman-free sales, while the blockchain remains invisible."
                        </p>
                        <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                            <span className="flex items-center gap-2 text-black"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Middleman-Free</span>
                            <span className="flex items-center gap-2 text-black"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Seamless Onboarding</span>
                            <span className="flex items-center gap-2 text-black"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Real World Impact</span>
                        </div>
                    </div>
                </div>

                <div className="mt-32 space-y-16">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-center mb-12 text-black">Why Cavos Wins</h2>
                    <div className="grid md:grid-cols-2 gap-12 text-black">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold">Verifiable Sovereignty</h3>
                            <p className="text-gray-600">
                                Traditional embedded wallets rely on MPC "black boxes"—centralized clusters holding fragments of your keys. 
                                Cavos is the only infrastructure that performs **RSA-2048 verification directly on-chain** in Cairo. 
                                Your identity is validated by the protocol, not a provider.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold">Zero-Trust AI Signers</h3>
                            <p className="text-gray-600">
                                AI agents need signers that can operate autonomously without exposing long-lived private keys. 
                                Cavos session tokens are authorized for specific contracts and spending limits on-chain, 
                                making it the standard for the next generation of autonomous Starknet apps.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold">Protocol-Native DX</h3>
                            <p className="text-gray-600">
                                While others build cross-chain abstractions that add latency, Cavos is 100% Starknet-native. 
                                From integrated AVNU paymasters to sub-account naming via named wallets, 
                                every feature is optimized for the Starknet native AA ecosystem.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold">Invisible UX, Total Control</h3>
                            <p className="text-gray-600">
                                Get your users into your app in under 30 seconds. No browser popups, no seed phrases, no extensions. 
                                Just a seamless Web2 login that results in a fully self-custodial Starknet account 
                                that works across every device.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-40 text-center space-y-8">
                    <div className="bg-black text-white p-12 rounded-[3rem] shadow-2xl inline-block max-w-2xl border border-white/5">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Integrate Cavos in 15 minutes</h2>
                        <p className="text-gray-400 mb-10 text-lg">
                            Ready to ship the ultimate onboarding experience? 
                            Use our developer toolset to get started.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="https://docs.cavos.xyz" target="_blank" className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all">
                                View Documentation
                            </Link>
                            <Link href="https://github.com/cavos-labs/cavos-skills" target="_blank" className="w-full sm:w-auto px-10 py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all border border-white/10">
                                Explore Skills
                            </Link>
                        </div>
                    </div>
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
