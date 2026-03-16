import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
    title: 'Data Processing Agreement',
    description: 'Cavos Labs Data Processing Agreement (DPA) — GDPR Art. 28 compliant agreement for developers integrating the Cavos SDK.',
}

const DPA_VERSION = '1.0'
const LAST_UPDATED = 'March 16, 2026'

function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
    return (
        <section className="border-t border-[#EAE5DC] pt-8 mt-8 first:border-t-0 first:pt-0 first:mt-0">
            <h2 className="text-base font-bold text-[#0A0908] mb-4">
                {num}. {title}
            </h2>
            <div className="space-y-3 text-sm text-black/60 leading-relaxed">
                {children}
            </div>
        </section>
    )
}

function Clause({ id, children }: { id: string; children: React.ReactNode }) {
    return (
        <p>
            <span className="font-mono text-[10px] text-black/30 mr-2">{id}</span>
            {children}
        </p>
    )
}

function Table({ rows }: { rows: [string, string, string, string][] }) {
    return (
        <div className="overflow-x-auto -mx-1 mt-2">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-[#F7F5F2]">
                        {['Sub-processor', 'Purpose', 'Data transferred', 'Location'].map((h) => (
                            <th key={h} className="text-left px-3 py-2 font-semibold text-black/50 border border-[#EAE5DC]">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([name, purpose, data, loc], i) => (
                        <tr key={name} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F7F5F2]/40'}>
                            <td className="px-3 py-2 font-medium text-black/70 border border-[#EAE5DC]">{name}</td>
                            <td className="px-3 py-2 text-black/55 border border-[#EAE5DC]">{purpose}</td>
                            <td className="px-3 py-2 text-black/55 border border-[#EAE5DC]">{data}</td>
                            <td className="px-3 py-2 text-black/55 border border-[#EAE5DC]">{loc}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default function DpaPage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            <div className="max-w-3xl mx-auto px-6 md:px-8 pt-32 pb-24">

                {/* Hero */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F5F2] border border-[#EAE5DC] text-[10px] font-bold uppercase tracking-widest text-black/40 mb-6">
                        Legal
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-[#0A0908] mb-3">Data Processing Agreement</h1>
                    <div className="flex flex-wrap gap-4 text-xs text-black/40">
                        <span>Version {DPA_VERSION}</span>
                        <span>·</span>
                        <span>Last updated: {LAST_UPDATED}</span>
                    </div>
                    <p className="mt-4 text-sm text-black/60 leading-relaxed">
                        This Data Processing Agreement (&ldquo;DPA&rdquo;) forms part of the Cavos Terms of Service between Cavos Labs (&ldquo;Processor&rdquo;) and the developer or company registering an account (&ldquo;Controller&rdquo;). It governs the processing of personal data by Cavos on behalf of the Controller in accordance with GDPR Art. 28.
                    </p>
                    <p className="mt-3 text-sm text-black/60">
                        By creating a Cavos account, the Controller agrees to the terms of this DPA.
                    </p>
                </div>

                {/* Body */}
                <div className="bg-[#F7F5F2] border border-[#EAE5DC] rounded-2xl p-6 md:p-10 space-y-0">

                    <Section num={1} title="Definitions">
                        <Clause id="1.1">&ldquo;Personal Data&rdquo; means any information relating to an identified or identifiable natural person as defined in GDPR Art. 4(1).</Clause>
                        <Clause id="1.2">&ldquo;Controller&rdquo; means the developer or company that determines the purposes and means of processing Personal Data of their End Users.</Clause>
                        <Clause id="1.3">&ldquo;Processor&rdquo; means Cavos Labs, which processes Personal Data on behalf of the Controller.</Clause>
                        <Clause id="1.4">&ldquo;End Users&rdquo; means the natural persons who use the Controller&rsquo;s application and whose data is processed through Cavos infrastructure.</Clause>
                        <Clause id="1.5">&ldquo;Services&rdquo; means the embedded wallet infrastructure, SDK, and dashboard provided by Cavos Labs at cavos.xyz.</Clause>
                    </Section>

                    <Section num={2} title="Subject matter and duration">
                        <Clause id="2.1">Cavos processes Personal Data submitted through the Services for the purpose of providing the embedded wallet infrastructure to the Controller&rsquo;s application.</Clause>
                        <Clause id="2.2">This DPA is effective for the duration of the Controller&rsquo;s active account and terminates automatically upon account deletion. Retention obligations in Section 8 survive termination.</Clause>
                    </Section>

                    <Section num={3} title="Nature and purpose of processing">
                        <Clause id="3.1">The Processor provides the following processing activities on behalf of the Controller:</Clause>
                        <ul className="list-disc pl-5 space-y-1.5 ml-6">
                            <li>Storing pseudonymous wallet addresses (Starknet account addresses) to compute Monthly Active Users for billing</li>
                            <li>Recording transaction counts (without transaction hashes) per wallet per application</li>
                            <li>Sending transactional emails (verification, password reset) to End Users on behalf of the Controller, using email addresses provided by the Controller</li>
                            <li>Verifying identity via OAuth providers (Google, Apple) and email/password (Firebase) as configured by the Controller</li>
                        </ul>
                        <Clause id="3.2">The Processor shall not process Personal Data for any purpose other than those specified in this DPA, unless required by applicable law.</Clause>
                    </Section>

                    <Section num={4} title="Types of personal data and categories of data subjects">
                        <Clause id="4.1"><strong className="text-black/80">Data subjects:</strong> End Users of the Controller&rsquo;s application.</Clause>
                        <Clause id="4.2"><strong className="text-black/80">Types of data processed:</strong></Clause>
                        <ul className="list-disc pl-5 space-y-1.5 ml-6">
                            <li>Pseudonymous blockchain wallet addresses</li>
                            <li>Transaction counts (no hashes, no amounts)</li>
                            <li>Email addresses (only when Controller enables email/password authentication)</li>
                            <li>OAuth identifiers (opaque sub claim from Google/Apple)</li>
                        </ul>
                        <Clause id="4.3">No special categories of personal data (Art. 9 GDPR) are processed.</Clause>
                    </Section>

                    <Section num={5} title="Obligations of the Controller">
                        <Clause id="5.1">The Controller shall ensure that it has a lawful basis for processing End Users&rsquo; personal data and that it has provided appropriate privacy notices to its End Users.</Clause>
                        <Clause id="5.2">The Controller shall only instruct the Processor to process Personal Data in accordance with applicable data protection law.</Clause>
                        <Clause id="5.3">The Controller shall inform the Processor without undue delay if it becomes aware that any processing instruction infringes applicable law.</Clause>
                    </Section>

                    <Section num={6} title="Obligations of the Processor (Cavos)">
                        <p>In accordance with GDPR Art. 28(3), Cavos shall:</p>
                        <ul className="list-disc pl-5 space-y-2 ml-6">
                            <li>Process Personal Data only on documented instructions from the Controller (i.e., use of the Services).</li>
                            <li>Ensure that persons authorised to process Personal Data are bound by confidentiality obligations.</li>
                            <li>Implement appropriate technical and organisational security measures per GDPR Art. 32.</li>
                            <li>Respect the conditions for engaging sub-processors set out in Section 7.</li>
                            <li>Assist the Controller in responding to Data Subject requests (Art. 15–22) to the extent technically feasible.</li>
                            <li>Notify the Controller without undue delay (and no later than 48 hours) upon becoming aware of a personal data breach affecting Controller&rsquo;s data.</li>
                            <li>Delete or return all Personal Data upon termination of the Services, at the Controller&rsquo;s choice, and delete existing copies unless storage is required by law.</li>
                            <li>Make available all information necessary to demonstrate compliance with Art. 28, and allow for and contribute to audits conducted by the Controller or a mandated auditor.</li>
                        </ul>
                    </Section>

                    <Section num={7} title="Sub-processors">
                        <Clause id="7.1">The Controller grants Cavos general authorisation to engage the following sub-processors:</Clause>
                        <Table rows={[
                            ['Supabase', 'Database & auth', 'Account data, wallet addresses, tx counts', 'EU (AWS eu-west-1)'],
                            ['Google Firebase', 'Email/password auth', 'Email address, password hash', 'US (SCCs)'],
                            ['Stripe', 'Billing', 'Controller billing data only', 'US (SCCs)'],
                            ['Vercel', 'Hosting', 'Request logs (IP anonymised)', 'US (SCCs)'],
                            ['Resend', 'Transactional email', 'End user email address', 'US (SCCs)'],
                        ]} />
                        <Clause id="7.2">Cavos shall inform the Controller of any intended changes to this list at least 14 days in advance via email or in-dashboard notice, giving the Controller the opportunity to object. If the Controller objects and no reasonable solution can be found, either party may terminate the Services with 30 days&rsquo; notice.</Clause>
                        <Clause id="7.3">Cavos shall impose data protection obligations on sub-processors equivalent to those in this DPA and shall remain liable to the Controller for the performance of sub-processors&rsquo; obligations.</Clause>
                    </Section>

                    <Section num={8} title="Data deletion and return">
                        <Clause id="8.1">Upon termination of the Services or upon written request, Cavos shall delete all Personal Data processed on behalf of the Controller within 30 days, unless retention is required by applicable law.</Clause>
                        <Clause id="8.2">Aggregated, anonymised usage statistics that cannot be linked to any individual or Controller may be retained by Cavos for product improvement purposes.</Clause>
                    </Section>

                    <Section num={9} title="International transfers">
                        <Clause id="9.1">Where sub-processors are located outside the EEA (see Section 7), Cavos relies on the European Commission&rsquo;s Standard Contractual Clauses (SCCs) as the transfer mechanism, ensuring an adequate level of protection for Personal Data.</Clause>
                    </Section>

                    <Section num={10} title="Security measures">
                        <Clause id="10.1">Cavos implements and maintains appropriate technical and organisational measures including:</Clause>
                        <ul className="list-disc pl-5 space-y-1.5 ml-6">
                            <li>Encryption of data in transit (TLS 1.2+) and at rest</li>
                            <li>Row-level security policies in the database</li>
                            <li>Access controls limiting production access to authorised personnel only</li>
                            <li>Regular dependency updates and security patching</li>
                            <li>Pseudonymisation of analytics data (wallet addresses without linked identifiers)</li>
                        </ul>
                    </Section>

                    <Section num={11} title="Governing law and supervisory authority">
                        <Clause id="11.1">This DPA is governed by the laws of the European Union where applicable, and otherwise by the laws of the jurisdiction of the Controller&rsquo;s place of establishment.</Clause>
                        <Clause id="11.2">Each party retains the right to lodge a complaint with its competent data protection supervisory authority.</Clause>
                    </Section>

                    <Section num={12} title="Contact">
                        <p>
                            For any questions regarding this DPA or to exercise audit rights, contact:{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">
                                hello@cavos.xyz
                            </a>
                        </p>
                    </Section>

                </div>

                {/* Acceptance note */}
                <div className="mt-6 bg-[#0A0908] rounded-2xl p-5 flex items-start gap-3">
                    <svg className="w-4 h-4 text-[#EAE5DC] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                    </svg>
                    <p className="text-xs text-white/50 leading-relaxed">
                        This DPA is accepted electronically when you create a Cavos account. The acceptance timestamp and DPA version are recorded and stored with your account for compliance purposes.{' '}
                        <Link href="/privacy" className="underline underline-offset-2 hover:text-white/80 transition-colors">Privacy Policy</Link>
                    </p>
                </div>
            </div>

            <Footer />
        </main>
    )
}
