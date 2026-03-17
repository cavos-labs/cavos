import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
    title: 'End-User Privacy Policy — Cavos',
    description: 'Privacy policy for end users of applications powered by the Cavos SDK — what data is collected, where it is stored, and your rights.',
}

const LAST_UPDATED = 'March 16, 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="border-t border-[#EAE5DC] pt-8 mt-8 first:border-t-0 first:pt-0 first:mt-0">
            <h2 className="text-base font-bold text-[#0A0908] mb-4">{title}</h2>
            <div className="space-y-3 text-sm text-black/60 leading-relaxed">
                {children}
            </div>
        </section>
    )
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-black/80 mb-1">{title}</h3>
            <div className="text-sm text-black/60 leading-relaxed">{children}</div>
        </div>
    )
}

function Table({ rows }: { rows: [string, string, string, string][] }) {
    return (
        <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-[#F7F5F2]">
                        <th className="text-left px-3 py-2 font-semibold text-black/50 border border-[#EAE5DC]">Data</th>
                        <th className="text-left px-3 py-2 font-semibold text-black/50 border border-[#EAE5DC]">Where stored</th>
                        <th className="text-left px-3 py-2 font-semibold text-black/50 border border-[#EAE5DC]">Persisted server-side?</th>
                        <th className="text-left px-3 py-2 font-semibold text-black/50 border border-[#EAE5DC]">Purpose</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([data, where, persisted, purpose], i) => (
                        <tr key={data} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F7F5F2]/40'}>
                            <td className="px-3 py-2 font-medium text-black/70 border border-[#EAE5DC]">{data}</td>
                            <td className="px-3 py-2 text-black/55 border border-[#EAE5DC]">{where}</td>
                            <td className="px-3 py-2 text-black/55 border border-[#EAE5DC]">{persisted}</td>
                            <td className="px-3 py-2 text-black/55 border border-[#EAE5DC]">{purpose}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default function UserPrivacyPage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            <div className="max-w-3xl mx-auto px-6 md:px-8 pt-32 pb-24">

                {/* Hero */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F5F2] border border-[#EAE5DC] text-[10px] font-bold uppercase tracking-widest text-black/40 mb-6">
                        Legal
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-[#0A0908] mb-3">End-User Privacy Policy</h1>
                    <p className="text-sm text-black/40">Last updated: {LAST_UPDATED}</p>
                    <p className="text-sm text-black/50 mt-3">
                        This policy applies to you if you have created a wallet or signed into an application that uses the Cavos SDK. If you are a developer integrating Cavos, see our{' '}
                        <Link href="/privacy" className="underline underline-offset-2 hover:text-black transition-colors">Developer Privacy Policy</Link>.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#F7F5F2] border border-[#EAE5DC] rounded-2xl p-6 md:p-10 space-y-0">

                    <Section title="1. Who we are">
                        <p>
                            Cavos Labs (&ldquo;Cavos&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) provides the infrastructure that lets applications create self-custodial Starknet wallets for their users via OAuth sign-in (Google, Apple, or email magic link). Our contact for privacy matters is{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>.
                        </p>
                        <p>
                            The application you signed into is operated by a third party (the &ldquo;developer&rdquo;). Cavos acts as an infrastructure provider for that developer. This policy explains only what Cavos itself collects and processes — the developer may have their own data practices which are covered by their own privacy policy.
                        </p>
                    </Section>

                    <Section title="2. What data we collect and why">
                        <Sub title="OAuth identity claims (from your sign-in provider)">
                            <p>When you sign in via Google, Apple, or email, your identity provider issues a signed token containing claims about you. Cavos processes the following claims to create and authenticate your wallet:</p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li><strong className="text-black/80">Provider user ID (<code>sub</code>)</strong> — a unique, opaque identifier assigned to you by Google, Apple, or Firebase. Used to derive your wallet address deterministically. Stored in our database.</li>
                                <li><strong className="text-black/80">Email address</strong> — only collected if you sign in via email magic link. Stored temporarily during the verification flow (up to 24 hours), then deleted.</li>
                                <li><strong className="text-black/80">Name &amp; profile picture</strong> — if provided by your sign-in provider (Google / Apple). Displayed in the wallet UI. <strong className="text-black/80">Never stored on our servers</strong> — kept only in your browser session storage.</li>
                            </ul>
                        </Sub>
                        <Sub title="Wallet address">
                            <p>Your Starknet wallet address is derived from your provider user ID and stored in our database to associate it with the developer&rsquo;s application and the network (mainnet / testnet). This is a pseudonymous blockchain address — it is not directly linked to your name or email in our database.</p>
                        </Sub>
                        <Sub title="Session key (generated locally)">
                            <p>A cryptographic session key pair is generated in your browser for each login. The private key <strong className="text-black/80">never leaves your device</strong> and is never transmitted to our servers. It lives only in your browser&rsquo;s <code>sessionStorage</code> and is automatically cleared when you close the browser tab.</p>
                        </Sub>
                        <Sub title="Anonymous usage metrics">
                            <p>We record anonymized usage metrics (wallet address + app + network) to calculate billing for the developer. We do <strong className="text-black/80">not</strong> store transaction hashes, transaction contents, or any PII alongside these metrics.</p>
                        </Sub>
                    </Section>

                    <Section title="3. Data at a glance">
                        <Table rows={[
                            ['Provider user ID (sub)', 'Our database', 'Yes', 'Wallet address derivation & deduplication'],
                            ['Email address', 'Our database (temp)', 'Only during email verification (≤24 h)', 'Magic link authentication'],
                            ['Name & profile picture', 'Your browser only', 'No', 'Displayed in wallet UI'],
                            ['Wallet address', 'Our database + Starknet', 'Yes', 'Wallet identity & analytics'],
                            ['Session private key', 'Your browser only', 'No', 'Transaction signing'],
                            ['Session public key', 'Starknet (on-chain)', 'Yes (blockchain)', 'On-chain session verification'],
                            ['ZK proof (sub, nonce, exp, iss, aud)', 'Starknet (on-chain)', 'Yes (blockchain)', 'Trustless wallet ownership proof'],
                        ]} />
                        <p className="text-xs text-black/40 mt-2">
                            Data stored on the Starknet blockchain is public and permanent by nature. This includes your wallet address, session public keys, and zero-knowledge proofs.
                        </p>
                    </Section>

                    <Section title="4. What we do NOT collect">
                        <ul className="list-disc pl-4 space-y-2">
                            <li>We do <strong className="text-black/80">not</strong> store your OAuth password or any credentials.</li>
                            <li>We do <strong className="text-black/80">not</strong> store your session private key — it never leaves your browser.</li>
                            <li>We do <strong className="text-black/80">not</strong> link your email or name to your wallet address in our database (as of March 16, 2026).</li>
                            <li>We do <strong className="text-black/80">not</strong> store transaction hashes or the contents of transactions you submit.</li>
                            <li>We do <strong className="text-black/80">not</strong> use advertising trackers or sell your data to third parties.</li>
                        </ul>
                    </Section>

                    <Section title="5. Legal basis for processing (GDPR)">
                        <ul className="list-disc pl-4 space-y-2">
                            <li><strong className="text-black/80">Contract (Art. 6(1)(b))</strong> — processing your provider user ID and wallet address is necessary to provide the wallet service you requested.</li>
                            <li><strong className="text-black/80">Legitimate interest (Art. 6(1)(f))</strong> — anonymous usage metrics are necessary for billing the developer accurately.</li>
                            <li><strong className="text-black/80">Legal obligation (Art. 6(1)(c))</strong> — email verification tokens are retained briefly to comply with anti-abuse obligations.</li>
                        </ul>
                    </Section>

                    <Section title="6. Data retention">
                        <ul className="list-disc pl-4 space-y-2">
                            <li><strong className="text-black/80">Provider user ID &amp; wallet address</strong> — retained while your wallet exists in the application. You can request deletion at any time (see §8).</li>
                            <li><strong className="text-black/80">Email address</strong> — deleted automatically within 24 hours of the magic link verification flow completing or expiring.</li>
                            <li><strong className="text-black/80">Usage metrics</strong> — retained for 13 months then aggregated and anonymized.</li>
                            <li><strong className="text-black/80">On-chain data</strong> — your wallet address and session public keys on Starknet are permanent and cannot be deleted (this is the nature of public blockchains).</li>
                        </ul>
                    </Section>

                    <Section title="7. Sub-processors">
                        <p>Cavos shares data with the following infrastructure providers:</p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li><strong className="text-black/80">Supabase</strong> (EU, AWS eu-west-1) — database storage for wallet records.</li>
                            <li><strong className="text-black/80">Google Firebase</strong> (US, with SCCs) — email magic link delivery and authentication.</li>
                            <li><strong className="text-black/80">Vercel</strong> (US, with SCCs) — hosting of the Cavos API and dashboard.</li>
                            <li><strong className="text-black/80">Starknet network</strong> — public blockchain where your wallet address and session keys are registered on-chain.</li>
                        </ul>
                        <p className="text-xs text-black/40 mt-1">SCCs = Standard Contractual Clauses (EU mechanism for lawful data transfers).</p>
                    </Section>

                    <Section title="8. Your rights">
                        <p>Under GDPR you have the following rights regarding the data Cavos holds about you:</p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li><strong className="text-black/80">Access (Art. 15)</strong> — request a copy of the data we hold linked to your wallet address.</li>
                            <li><strong className="text-black/80">Erasure (Art. 17)</strong> — request deletion of your wallet record. We will remove your provider user ID and wallet address from our database. Note: on-chain data cannot be deleted.</li>
                            <li><strong className="text-black/80">Rectification (Art. 16)</strong> — correct inaccurate data by contacting us.</li>
                            <li><strong className="text-black/80">Portability (Art. 20)</strong> — receive your data in a machine-readable format.</li>
                            <li><strong className="text-black/80">Objection (Art. 21)</strong> — object to processing based on legitimate interest.</li>
                        </ul>
                        <p>
                            To exercise any right, email{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>{' '}
                            with your wallet address and the application you used. We will respond within 30 days.
                        </p>
                    </Section>

                    <Section title="9. Security">
                        <p>
                            We use TLS for all data in transit, row-level security in our database, and restrict access to production systems. Your session private key is never transmitted to our servers — it is generated and stored exclusively in your browser. In the event of a data breach, we will notify the relevant supervisory authority within 72 hours (GDPR Art. 33).
                        </p>
                    </Section>

                    <Section title="10. Children">
                        <p>
                            The Cavos SDK is not intended for use by anyone under 16. We do not knowingly collect data from minors. If you believe a minor has created a wallet, contact us at{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>.
                        </p>
                    </Section>

                    <Section title="11. Changes to this policy">
                        <p>
                            We may update this policy when our practices change. Material changes will be announced on this page with a new &ldquo;Last updated&rdquo; date. We recommend checking this page periodically.
                        </p>
                    </Section>

                    <Section title="12. Contact">
                        <p>
                            Questions? Email us at{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>.
                            You also have the right to lodge a complaint with your local data protection authority.
                        </p>
                    </Section>

                </div>
            </div>

            <Footer />
        </main>
    )
}
