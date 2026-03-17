import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
    title: 'End-User Terms of Service — Cavos',
    description: 'Terms of service for end users of applications powered by the Cavos SDK.',
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

export default function UserTermsPage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            <div className="max-w-3xl mx-auto px-6 md:px-8 pt-32 pb-24">

                {/* Hero */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F5F2] border border-[#EAE5DC] text-[10px] font-bold uppercase tracking-widest text-black/40 mb-6">
                        Legal
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-[#0A0908] mb-3">End-User Terms of Service</h1>
                    <p className="text-sm text-black/40">Last updated: {LAST_UPDATED}</p>
                    <p className="text-sm text-black/50 mt-3">
                        These terms apply to you if you have created a wallet or signed into an application that uses the Cavos SDK. If you are a developer integrating Cavos, additional terms apply — see{' '}
                        <Link href="/dpa" className="underline underline-offset-2 hover:text-black transition-colors">our DPA</Link>.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#F7F5F2] border border-[#EAE5DC] rounded-2xl p-6 md:p-10 space-y-0">

                    <Section title="1. What Cavos provides">
                        <p>
                            Cavos Labs (&ldquo;Cavos&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) provides the underlying wallet infrastructure — software that lets you create and use a self-custodial Starknet blockchain wallet by signing in with your existing Google, Apple, or email account.
                        </p>
                        <p>
                            The application you are using is built by a third-party developer (&ldquo;the App&rdquo;) who has integrated the Cavos SDK. Cavos is not the operator of the App — we only provide the wallet layer. Any features, content, or services within the App are the responsibility of the developer.
                        </p>
                    </Section>

                    <Section title="2. Your wallet is self-custodial">
                        <p>
                            <strong className="text-black/80">You are solely in control of your wallet.</strong> Cavos does not hold, store, or have access to your private keys. Your session key is generated in your browser and never transmitted to our servers.
                        </p>
                        <p>
                            This means:
                        </p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>We cannot recover your wallet if you lose access to your sign-in provider (Google, Apple, or email account).</li>
                            <li>We cannot reverse, cancel, or refund transactions you have signed and submitted to the blockchain.</li>
                            <li>We cannot freeze or confiscate your funds.</li>
                        </ul>
                        <p>
                            Keep your sign-in provider account secure — it is the only way to access your wallet.
                        </p>
                    </Section>

                    <Section title="3. Eligibility">
                        <p>
                            You must be at least 16 years old to use a Cavos-powered wallet. By using the wallet, you confirm that you meet this requirement and that you have the legal capacity to agree to these terms in your jurisdiction.
                        </p>
                    </Section>

                    <Section title="4. Acceptable use">
                        <p>You agree not to use your wallet to:</p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>Violate any applicable law or regulation, including sanctions laws and anti-money-laundering rules.</li>
                            <li>Engage in fraud, money laundering, or financing of terrorism.</li>
                            <li>Attempt to reverse-engineer, tamper with, or exploit the Cavos infrastructure.</li>
                            <li>Perform any action that could damage, overload, or impair our systems.</li>
                        </ul>
                    </Section>

                    <Section title="5. Blockchain transactions are irreversible">
                        <p>
                            All transactions signed with your session key and submitted to the Starknet blockchain are final and irreversible. Cavos has no ability to reverse, block, or modify transactions once they have been submitted. Review all transaction details carefully before confirming.
                        </p>
                    </Section>

                    <Section title="6. Session keys and security">
                        <p>
                            Each time you log in, the Cavos SDK generates a temporary session key in your browser. This key is used to sign transactions on your behalf during your session and is automatically deleted when you close the browser tab or log out.
                        </p>
                        <p>
                            Session keys are authorized on-chain with configurable policies set by the developer (for example, limiting which contracts can be called or capping spending). You can revoke a session key at any time from within the application.
                        </p>
                        <p>
                            You are responsible for the security of the device and browser you use to access your wallet. Do not use your wallet on shared or untrusted devices.
                        </p>
                    </Section>

                    <Section title="7. No financial advice">
                        <p>
                            Cavos provides wallet infrastructure only. Nothing we say or provide constitutes financial, investment, legal, or tax advice. Cryptocurrency and blockchain assets are volatile and speculative. You assume all risk associated with their use. Always consult a qualified professional before making financial decisions.
                        </p>
                    </Section>

                    <Section title="8. Availability and changes">
                        <p>
                            We strive to keep the Cavos infrastructure available, but we do not guarantee uninterrupted access. We may update, suspend, or discontinue parts of the infrastructure at any time. If we make changes that materially affect your ability to access your wallet, we will provide reasonable notice where possible.
                        </p>
                    </Section>

                    <Section title="9. Limitation of liability">
                        <p>
                            To the maximum extent permitted by applicable law, Cavos and its affiliates, officers, employees, and agents are not liable for:
                        </p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>Loss of funds resulting from your own actions, including sending to the wrong address or signing unintended transactions.</li>
                            <li>Loss resulting from compromise of your sign-in provider account.</li>
                            <li>Losses caused by bugs, forks, or failures of the Starknet blockchain or third-party smart contracts.</li>
                            <li>Indirect, incidental, or consequential damages of any kind.</li>
                        </ul>
                        <p>
                            In any case, our total liability to you shall not exceed €100.
                        </p>
                    </Section>

                    <Section title="10. Governing law">
                        <p>
                            These terms are governed by the laws of the jurisdiction in which Cavos Labs is registered. Any dispute that cannot be resolved amicably shall be submitted to the competent courts of that jurisdiction.
                        </p>
                    </Section>

                    <Section title="11. Changes to these terms">
                        <p>
                            We may update these terms from time to time. We will post the updated version on this page with a new &ldquo;Last updated&rdquo; date. Your continued use of a Cavos-powered wallet after the effective date constitutes acceptance of the updated terms.
                        </p>
                    </Section>

                    <Section title="12. Contact">
                        <p>
                            Questions about these terms? Email us at{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>.
                        </p>
                    </Section>

                </div>
            </div>

            <Footer />
        </main>
    )
}
