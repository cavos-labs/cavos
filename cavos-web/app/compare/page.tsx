import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
    title: "Cavos vs The Rest | The Sovereignty Matrix",
    description: "Technical comparison between Cavos, Privy, Dynamic, and Cartridge. Why verifiable, MPC-free signers are the future of Starknet.",
}

export default function ComparePage() {
    const comparison = [
        {
            feature: "Security Model",
            cavos: "On-chain RSA Verification (Pure Math)",
            privy: "MPC Shards (Distributed Black Box)",
            cartridge: "Controller-based Session Keys",
        },
        {
            feature: "Trust Factor",
            cavos: "Verifiable Code in Cairo",
            privy: "Provider Backend Integrity",
            cartridge: "Ecosystem Integrity",
        },
        {
            feature: "AI Agent Ready",
            cavos: "Native Headless / Master-less support",
            privy: "Insecure Private Key Injection / API",
            cartridge: "Primarily UX for Humans",
        },
        {
            feature: "Onboarding",
            cavos: "Google/Apple → Wallet (No Shards)",
            privy: "Email/Social → Shard Generation",
            cartridge: "Passkey / Gaming Auth",
        }
    ]

    return (
        <main className="bg-white min-h-screen text-black font-sans antialiased">
            <Header />
            <div className="max-w-5xl mx-auto px-6 py-32">
                <header className="mb-20 text-center">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                        The Sovereignty Matrix
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        In the agentic era, trusting a black box is no longer an option. 
                        Cavos provides the only verifiable, MPC-free infrastructure for Starknet.
                    </p>
                </header>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-100">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-6 text-left border border-gray-100 uppercase text-xs tracking-widest text-gray-400">Feature</th>
                                <th className="p-6 text-left border border-gray-100 font-bold text-black">Cavos (Starknet-Native)</th>
                                <th className="p-6 text-left border border-gray-100 text-gray-500">Privy / Dynamic</th>
                                <th className="p-6 text-left border border-gray-100 text-gray-500">Cartridge</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparison.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-6 border border-gray-100 font-medium text-gray-900">{row.feature}</td>
                                    <td className="p-6 border border-gray-100 font-bold text-black bg-blue-50/10">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-black rounded-full"></span>
                                            {row.cavos}
                                        </span>
                                    </td>
                                    <td className="p-6 border border-gray-100 text-gray-500">{row.privy}</td>
                                    <td className="p-6 border border-gray-100 text-gray-500">{row.cartridge}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <section className="mt-32 space-y-20">
                    <div className="grid md:grid-cols-2 gap-16">
                        <div>
                            <h2 className="text-3xl font-bold mb-4">Why MPC-free?</h2>
                            <p className="text-gray-600 leading-relaxed">
                                MPC (Multi-Party Computation) solutions fragment your private key and store shards on central servers. 
                                This creates vendor lock-in and a hidden chain of trust. 
                                Cavos uses Montgomery Reduction to verify RSA-2048 JWT signatures directly on-chain. 
                                Your identity is the proof. No shards required.
                            </p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-4">Built for AI Agents</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Autonomous agents require a signer that can live in a headless environment without risking 
                                a long-lived private key. Cavos session tokens allow agents to act on behalf of users 
                                within strict, on-chain enforced boundaries.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </main>
    )
}
