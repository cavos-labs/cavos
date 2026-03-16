import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Cavos Labs privacy policy — how we collect, use, and protect your data.',
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

function Table({ rows }: { rows: [string, string, string][] }) {
    return (
        <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-[#F7F5F2]">
                        <th className="text-left px-3 py-2 font-semibold text-black/50 border border-[#EAE5DC] rounded-tl-lg">Sub-processor</th>
                        <th className="text-left px-3 py-2 font-semibold text-black/50 border border-[#EAE5DC]">Purpose</th>
                        <th className="text-left px-3 py-2 font-semibold text-black/50 border border-[#EAE5DC] rounded-tr-lg">Location</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([name, purpose, location], i) => (
                        <tr key={name} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F7F5F2]/40'}>
                            <td className="px-3 py-2 font-medium text-black/70 border border-[#EAE5DC]">{name}</td>
                            <td className="px-3 py-2 text-black/55 border border-[#EAE5DC]">{purpose}</td>
                            <td className="px-3 py-2 text-black/55 border border-[#EAE5DC]">{location}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            <div className="max-w-3xl mx-auto px-6 md:px-8 pt-32 pb-24">

                {/* Hero */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F5F2] border border-[#EAE5DC] text-[10px] font-bold uppercase tracking-widest text-black/40 mb-6">
                        Legal
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-[#0A0908] mb-3">Privacy Policy</h1>
                    <p className="text-sm text-black/40">Last updated: {LAST_UPDATED}</p>
                </div>

                {/* Card */}
                <div className="bg-[#F7F5F2] border border-[#EAE5DC] rounded-2xl p-6 md:p-10 space-y-0">

                    <Section title="1. Who we are">
                        <p>
                            Cavos Labs (&ldquo;Cavos&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the developer platform available at{' '}
                            <Link href="https://cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">cavos.xyz</Link>{' '}
                            and the Cavos SDK. Our registered contact for privacy matters is{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>.
                        </p>
                    </Section>

                    <Section title="2. Scope — developers vs. end users">
                        <p>
                            This policy applies to <strong className="text-black/80">developers and companies</strong> (&ldquo;you&rdquo;) who register an account on cavos.xyz and integrate the Cavos SDK into their applications.
                        </p>
                        <p>
                            Cavos acts as a <strong className="text-black/80">Data Processor</strong> under GDPR. Your application&rsquo;s end users are your responsibility — you are the Data Controller for their personal data. You must obtain appropriate consent from your end users and publish your own privacy policy covering your use of Cavos.
                        </p>
                    </Section>

                    <Section title="3. Data we collect about you (the developer)">
                        <Sub title="Account data">
                            <p>When you register: email address, full name (optional), organization name. Stored in our database (Supabase) and used to manage your access to the Cavos dashboard.</p>
                        </Sub>
                        <Sub title="Billing data">
                            <p>If you subscribe to a paid plan, we store a Stripe customer ID and subscription ID. Full payment details (card numbers, etc.) are handled exclusively by Stripe and never touch our servers.</p>
                        </Sub>
                        <Sub title="Usage analytics">
                            <p>
                                We track pseudonymous wallet counts and transaction counts per application to calculate your Monthly Active Users (MAU) for billing purposes. We store:
                            </p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li>Wallet addresses (pseudonymous Starknet addresses) — no emails or names linked</li>
                                <li>Transaction counts per wallet — no transaction hashes stored</li>
                                <li>Network type (mainnet / testnet)</li>
                            </ul>
                            <p className="mt-2">This data belongs to your end users&rsquo; activity but is processed by us only to compute your billing metrics.</p>
                        </Sub>
                        <Sub title="Dashboard analytics">
                            <p>With your consent, we use Vercel Analytics to collect anonymous pageview data when you use the cavos.xyz dashboard. No cookies are set, no cross-site tracking occurs, and no personal data is collected. You can decline at any time via the consent banner.</p>
                        </Sub>
                    </Section>

                    <Section title="4. Legal basis for processing">
                        <ul className="list-disc pl-4 space-y-2">
                            <li><strong className="text-black/80">Contract (Art. 6(1)(b))</strong> — account data and billing data are necessary to provide the service you signed up for.</li>
                            <li><strong className="text-black/80">Legitimate interest (Art. 6(1)(f))</strong> — pseudonymous usage metrics (wallet counts) are necessary for billing accuracy.</li>
                            <li><strong className="text-black/80">Consent (Art. 6(1)(a))</strong> — Vercel Analytics, only if you accept the consent banner.</li>
                        </ul>
                    </Section>

                    <Section title="5. Data retention">
                        <ul className="list-disc pl-4 space-y-2">
                            <li><strong className="text-black/80">Account data</strong> — retained while your account is active, deleted within 30 days of account deletion.</li>
                            <li><strong className="text-black/80">Billing data</strong> — retained for 7 years to comply with accounting regulations, then deleted or anonymized.</li>
                            <li><strong className="text-black/80">Usage metrics (wallet/tx counts)</strong> — retained for 13 months for billing history, then aggregated and anonymized.</li>
                            <li><strong className="text-black/80">Email verification tokens</strong> — automatically deleted upon expiry (typically 24 hours).</li>
                        </ul>
                    </Section>

                    <Section title="6. Sub-processors">
                        <p>We share data with the following sub-processors, all of whom maintain GDPR-compliant Data Processing Agreements:</p>
                        <Table rows={[
                            ['Supabase', 'Database & authentication', 'EU (AWS eu-west-1)'],
                            ['Google Firebase', 'Email/password authentication', 'US (with SCCs)'],
                            ['Stripe', 'Subscription billing', 'US (with SCCs)'],
                            ['Vercel', 'Hosting & analytics (if consented)', 'US (with SCCs)'],
                            ['Resend', 'Transactional email delivery', 'US (with SCCs)'],
                        ]} />
                        <p className="text-xs text-black/40 mt-2">SCCs = Standard Contractual Clauses (EU mechanism for lawful data transfers to non-EU countries).</p>
                    </Section>

                    <Section title="7. Your rights (GDPR Art. 15–22)">
                        <p>As a developer with an account on cavos.xyz, you have the following rights:</p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li><strong className="text-black/80">Access (Art. 15)</strong> — request a copy of the data we hold about you.</li>
                            <li><strong className="text-black/80">Rectification (Art. 16)</strong> — correct inaccurate data via your dashboard profile settings.</li>
                            <li><strong className="text-black/80">Erasure (Art. 17)</strong> — delete your account and all associated data from your dashboard settings.</li>
                            <li><strong className="text-black/80">Portability (Art. 20)</strong> — receive your data in a machine-readable format upon request.</li>
                            <li><strong className="text-black/80">Restriction & Objection (Art. 18, 21)</strong> — contact us to restrict processing or object to legitimate-interest processing.</li>
                        </ul>
                        <p>
                            To exercise any right, email{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>.
                            We will respond within 30 days.
                        </p>
                    </Section>

                    <Section title="8. Cookies">
                        <ul className="list-disc pl-4 space-y-2">
                            <li><strong className="text-black/80">Session cookies</strong> — set by Supabase to maintain your login session on the dashboard. Strictly necessary, no consent required.</li>
                            <li><strong className="text-black/80">Analytics</strong> — Vercel Analytics does not set cookies. It uses edge-computed, IP-anonymized signals. Loaded only with your explicit consent.</li>
                        </ul>
                        <p>You can withdraw analytics consent at any time by clearing your browser&rsquo;s localStorage for cavos.xyz.</p>
                    </Section>

                    <Section title="9. Security">
                        <p>
                            We implement technical and organizational measures to protect your data: TLS in transit, row-level security in our database, restricted access to production systems, and no storage of sensitive credentials on our servers. In the event of a data breach affecting your data, we will notify you and the relevant supervisory authority within 72 hours as required by Art. 33 GDPR.
                        </p>
                    </Section>

                    <Section title="10. Children">
                        <p>
                            Cavos is a developer platform intended for adults. We do not knowingly collect data from anyone under 16. If you believe a minor has registered, contact us at{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>{' '}
                            and we will delete the account promptly.
                        </p>
                    </Section>

                    <Section title="11. Changes to this policy">
                        <p>
                            We may update this policy periodically. When we make material changes, we will notify you by email (to the address on your account) at least 14 days before the changes take effect. Continued use of the platform after that date constitutes acceptance of the updated policy.
                        </p>
                    </Section>

                    <Section title="12. Contact & supervisory authority">
                        <p>
                            Questions or complaints? Email us at{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>.
                        </p>
                        <p>
                            You also have the right to lodge a complaint with your local data protection authority. A list of EU supervisory authorities is available at{' '}
                            <a
                                href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-2 hover:text-black transition-colors"
                            >
                                edpb.europa.eu
                            </a>.
                        </p>
                    </Section>

                </div>
            </div>

            <Footer />
        </main>
    )
}
