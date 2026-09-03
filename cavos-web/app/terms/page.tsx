import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Cavos Terms of Service — the contract governing your use of the Cavos developer platform, SDK, and APIs.',
    alternates: { canonical: 'https://cavos.xyz/terms' },
}

const LAST_UPDATED = 'September 3, 2026'

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

function PricingTable({ rows }: { rows: [string, string, string][] }) {
    return (
        <div className="overflow-x-auto -mx-1 mt-2">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-[#F7F5F2]">
                        <th className="text-left px-3 py-2 font-semibold text-black/50 border border-[#EAE5DC] rounded-tl-lg">Plan</th>
                        <th className="text-left px-3 py-2 font-semibold text-black/50 border border-[#EAE5DC]">Fee</th>
                        <th className="text-left px-3 py-2 font-semibold text-black/50 border border-[#EAE5DC] rounded-tr-lg">Wallet creates</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([plan, fee, creates], i) => (
                        <tr key={plan} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F7F5F2]/40'}>
                            <td className="px-3 py-2 font-medium text-black/70 border border-[#EAE5DC]">{plan}</td>
                            <td className="px-3 py-2 text-black/55 border border-[#EAE5DC]">{fee}</td>
                            <td className="px-3 py-2 text-black/55 border border-[#EAE5DC]">{creates}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />

            <div className="max-w-3xl mx-auto px-6 md:px-8 pt-32 pb-24">

                {/* Hero */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F5F2] border border-[#EAE5DC] text-[10px] font-bold uppercase tracking-widest text-black/40 mb-6">
                        Legal
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-[#0A0908] mb-3">Terms of Service</h1>
                    <p className="text-sm text-black/40">Last updated: {LAST_UPDATED}</p>
                </div>

                {/* Preamble */}
                <div className="mb-8 text-sm text-black/60 leading-relaxed space-y-4">
                    <p>
                        These Terms of Service (&ldquo;<strong className="text-black/80">Terms</strong>&rdquo;) are a contract between you and <strong className="text-black/80">Cavos, LLC</strong>, a Delaware limited liability company (&ldquo;<strong className="text-black/80">Cavos</strong>,&rdquo; &ldquo;<strong className="text-black/80">we</strong>,&rdquo; &ldquo;<strong className="text-black/80">us</strong>&rdquo;).
                    </p>
                    <p>
                        They govern your access to and use of the Cavos developer platform at cavos.xyz, the dashboard, APIs, documentation, and software development kits (including <code className="text-xs bg-[#F7F5F2] px-1.5 py-0.5 rounded">@cavos/kit</code> and related packages) that we make available (together, the &ldquo;<strong className="text-black/80">Services</strong>&rdquo;). The Services currently support embedded self-custodial wallets on <strong className="text-black/80">Starknet</strong>, <strong className="text-black/80">Solana</strong>, and <strong className="text-black/80">Stellar</strong>.
                    </p>
                    <p>
                        If you are accepting these Terms on behalf of a company or other legal entity, you represent that you have authority to bind that entity. &ldquo;<strong className="text-black/80">You</strong>&rdquo; means that entity.
                    </p>
                    <p>Related documents that also apply:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><Link href="/privacy" className="underline underline-offset-2 hover:text-black transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/dpa" className="underline underline-offset-2 hover:text-black transition-colors">Data Processing Agreement</Link> (incorporated when you create an account)</li>
                        <li><Link href="/user-terms" className="underline underline-offset-2 hover:text-black transition-colors">End-User Terms</Link> (for people who use a wallet inside an application that integrates Cavos)</li>
                    </ul>
                    <p>
                        By creating an account, clicking to accept, or using the Services, you agree to these Terms.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#F7F5F2] border border-[#EAE5DC] rounded-2xl p-6 md:p-10 space-y-0">

                    <Section num={1} title="The Services">
                        <p>
                            Cavos provides <strong className="text-black/80">embedded, self-custodial wallet infrastructure</strong> for developers. You integrate the SDK or API into your application so your end users can create and use a wallet without Cavos holding their signing keys.
                        </p>
                        <p>
                            We may add, change, or remove features, chain adapters, networks (including testnet vs mainnet), or plan entitlements. Material reductions to paid plan entitlements will be handled under Section 18 (Changes).
                        </p>
                        <p>
                            The Services are a <strong className="text-black/80">developer tool</strong>. We do not operate your application, do not custody end-user assets, and are not a bank, money transmitter, exchange, broker, or investment adviser.
                        </p>
                    </Section>

                    <Section num={2} title="Accounts and eligibility">
                        <p>
                            You must be at least 18 years old (or the age of majority in your jurisdiction, if higher) and able to form a binding contract.
                        </p>
                        <p>
                            You must provide accurate registration information (email is required; name and organization are optional) and keep it current. You are responsible for all activity under your account, including API keys, app IDs, and organization members you invite.
                        </p>
                        <p>
                            Keep credentials confidential. Notify us at{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>{' '}
                            if you believe your account has been compromised.
                        </p>
                        <p>
                            We may refuse, suspend, or limit an account as described in Section 16.
                        </p>
                    </Section>

                    <Section num={3} title="Plans, fees, and billing (Stripe)">
                        <p>
                            Current published plans (USD, as of 3 September 2026; see{' '}
                            <Link href="/pricing" className="underline underline-offset-2 hover:text-black transition-colors">cavos.xyz/pricing</Link>{' '}
                            for the live list):
                        </p>
                        <PricingTable rows={[
                            ['Free', 'USD 0', 'First 1,000 wallet creates'],
                            ['Essential', 'USD 59 / month', 'Unlimited creates'],
                            ['Complete', 'USD 139 / month', 'Unlimited creates'],
                        ]} />
                        <p className="mt-4">
                            Paid plans are <strong className="text-black/80">month-to-month</strong> subscriptions. The fork between paid plans is recovery: Essential uses on-device recovery methods; Complete adds hardware-isolated enclave recovery as described on the pricing page. Every plan includes the SDK and the then-current chain adapters. <strong className="text-black/80">Gas sponsorship is not included in these fees</strong> (Section 5).
                        </p>
                        <p>
                            <strong className="text-black/80">Billing processor.</strong> Subscription payments are processed by <strong className="text-black/80">Stripe</strong>. We store a Stripe customer ID and subscription ID. Full payment details (card numbers and similar) are handled by Stripe and do not touch Cavos servers. Stripe&rsquo;s terms and privacy notice also apply to the payment flow.
                        </p>
                        <p>
                            <strong className="text-black/80">When fees are charged.</strong> Paid plans are billed in advance for each monthly period through Stripe. Prices are in United States dollars unless we display otherwise at checkout.
                        </p>
                        <p>
                            <strong className="text-black/80">Taxes.</strong> Fees are as displayed at checkout. Stripe may collect and remit taxes that it is required by law to collect. Except for amounts Stripe actually collects and remits, you are responsible for taxes arising from your purchase or use of the Services.
                        </p>
                        <p>
                            <strong className="text-black/80">Failed payments.</strong> If a charge fails, we may retry per Stripe&rsquo;s retry settings, downgrade you to Free, or suspend paid entitlements until payment succeeds.
                        </p>
                        <p>
                            <strong className="text-black/80">No refunds for unused time</strong>, except where required by law or where we terminate for convenience. If you cancel, you keep the paid plan until the end of the then-current billing period, then revert to Free.
                        </p>
                        <p>
                            <strong className="text-black/80">Price changes.</strong> We may change plan prices or entitlements on notice under Section 18. The new price applies from the next billing period after the notice period.
                        </p>
                    </Section>

                    <Section num={4} title="Free tier">
                        <p>
                            The Free plan does not require a credit card. Each <strong className="text-black/80">new wallet your application provisions</strong> counts toward the 1,000-create cap. Existing wallets, reads, and signatures are not capped. When the cap is reached, <strong className="text-black/80">new creates pause</strong> until you upgrade or we otherwise agree in writing.
                        </p>
                        <p>
                            Free-plan features, rate limits, and support levels may differ from paid plans. We may modify or discontinue the Free plan with notice under Section 18.
                        </p>
                        <p>
                            Free use is still subject to these Terms, including acceptable use and the self-custody provisions.
                        </p>
                    </Section>

                    <Section num={5} title="Gas sponsorship (separate)">
                        <p>
                            Gas sponsorship (paymaster, relayer, fee-bump, or similar, depending on the chain) may be available on every plan. It is <strong className="text-black/80">funded separately and billed to you (the integrator)</strong>. It is not included in Free, Essential, or Complete monthly fees.
                        </p>
                        <p>
                            You are responsible for maintaining any sponsorship balance, policies, and spend limits you configure. If the balance is insufficient or a relayer rejects an operation, end-user transactions may fail. We do not guarantee that any particular transaction will be sponsored.
                        </p>
                        <p>
                            Sponsorship usage and related charges will appear through the dashboard and/or Stripe (or another billing path we enable for gas). We may suspend sponsorship if your balance is unpaid or if we reasonably believe it is being abused.
                        </p>
                    </Section>

                    <Section num={6} title="Your applications and end users">
                        <p>
                            You are solely responsible for your application: its features, content, compliance, privacy notices, and relationship with your end users.
                        </p>
                        <p>You must:</p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>present your own terms and privacy policy to end users;</li>
                            <li>obtain any consents required for your processing of their data;</li>
                            <li>not represent that Cavos operates your application or custodians their assets;</li>
                            <li>ensure that end users who use a Cavos-powered wallet are directed to the{' '}
                                <Link href="/user-terms" className="underline underline-offset-2 hover:text-black transition-colors">End-User Terms</Link>{' '}
                                where we reasonably require it.
                            </li>
                        </ul>
                        <p>
                            Under the{' '}
                            <Link href="/dpa" className="underline underline-offset-2 hover:text-black transition-colors">DPA</Link>,{' '}
                            <strong className="text-black/80">you are the Controller</strong> of end-user personal data processed through the Services; <strong className="text-black/80">Cavos, LLC is the Processor</strong>.
                        </p>
                        <p>
                            You are responsible for how you configure authentication (for example Google, Apple, or email/password), session policies, recovery options, and on-chain spending limits.
                        </p>
                    </Section>

                    <Section num={7} title="Self-custody; no key custody">
                        <p>
                            The Services are designed so that <strong className="text-black/80">signing keys are created and used on the end user&rsquo;s device</strong>. Cavos does not hold, store, or have access to private keys or reconstructable key shards that can move user funds. There is no MPC shard on our servers that we can use to sign.
                        </p>
                        <p>This means, among other things:</p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>we cannot recover a wallet if the user loses access to their device, passkey, recovery method, or sign-in provider;</li>
                            <li>we cannot reverse, cancel, or refund blockchain transactions once submitted;</li>
                            <li>we cannot freeze or confiscate end-user funds;</li>
                            <li>wallets are not supposed to depend on Cavos remaining online in order for already-deployed on-chain accounts to exist.</li>
                        </ul>
                        <p>
                            Enclave recovery (where enabled on Complete) rewraps a device encryption key in a hardware-isolated environment. It does not mean Cavos holds the user&rsquo;s Stellar control seed or signs transactions on the user&rsquo;s behalf.
                        </p>
                        <p>
                            You will not market the Services as custodial wallet services, and you will not ask Cavos to take custody of keys or assets.
                        </p>
                    </Section>

                    <Section num={8} title="Acceptable use">
                        <p>You will not, and will not allow others to:</p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>violate applicable law, including sanctions and anti-money-laundering rules;</li>
                            <li>use the Services for fraud, phishing, or financing of terrorism;</li>
                            <li>interfere with or overload the Services, or probe them except through documented APIs within published rate limits;</li>
                            <li>reverse engineer the Services except to the extent this restriction is prohibited by law;</li>
                            <li>resell, white-label, or provide the Services as a competing embedded-wallet platform without our prior written consent;</li>
                            <li>misrepresent affiliation with Cavos or use our marks except as allowed in Section 9;</li>
                            <li>attempt to access another customer&rsquo;s account, keys, or data;</li>
                            <li>use the Services to custody assets for end users (the architecture is self-custodial);</li>
                            <li>submit malware or attempt to bypass authentication, paymaster, or relayer policies.</li>
                        </ul>
                        <p>
                            We may investigate suspected violations and cooperate with law enforcement where legally required.
                        </p>
                    </Section>

                    <Section num={9} title="Intellectual property and licenses">
                        <p>
                            <strong className="text-black/80">Our IP.</strong> Cavos and its licensors own the Services, documentation, dashboards, and all related intellectual property. These Terms do not transfer ownership to you.
                        </p>
                        <p>
                            <strong className="text-black/80">License to you.</strong> During the term, we grant you a non-exclusive, non-transferable, non-sublicensable (except to your end users as needed to use your application) license to use the Services and to embed the SDK in your application, solely in accordance with these Terms and the documentation.
                        </p>
                        <p>
                            <strong className="text-black/80">Your IP.</strong> You retain ownership of your application, content, and trademarks. You grant Cavos a limited license to host and process materials you submit as needed to provide the Services.
                        </p>
                        <p>
                            <strong className="text-black/80">Feedback.</strong> You may give feedback. We may use it without restriction or obligation to you.
                        </p>
                        <p>
                            <strong className="text-black/80">Branding.</strong> &ldquo;Cavos,&rdquo; &ldquo;Cavos Labs,&rdquo; and related marks are brand names of Cavos, LLC. You may state that your application &ldquo;uses Cavos&rdquo; in a factual way. You may not imply partnership, certification, or endorsement without our written permission.
                        </p>
                        <p>
                            <strong className="text-black/80">Open source.</strong> SDK packages may include open-source components under their own licenses. Those licenses control as to those components.
                        </p>
                    </Section>

                    <Section num={10} title="Confidentiality">
                        <p>
                            Each party may receive non-public information from the other (&ldquo;<strong className="text-black/80">Confidential Information</strong>&rdquo;), including API keys, unpublished product information, and your usage data. The recipient will use it only to perform under these Terms and will protect it with at least reasonable care.
                        </p>
                        <p>
                            Confidential Information does not include information that is public through no fault of the recipient, independently developed, or rightfully received from a third party without duty of confidentiality. Disclosure required by law is permitted with prior notice where legally allowed.
                        </p>
                    </Section>

                    <Section num={11} title="Availability; no service-level commitment">
                        <p>
                            We aim to keep the platform available, but <strong className="text-black/80">we do not commit to any uptime percentage, support response time, or service credit</strong> in these Terms unless we later sign a separate written SLA.
                        </p>
                        <p>
                            The Services depend on third parties we do not control, including Stripe, cloud providers, authentication providers, and public blockchains (Starknet, Solana, Stellar) and their RPC, paymaster, and relayer networks. Blockchains may halt, fork, congest, or reorganize.
                        </p>
                        <p>
                            We may perform maintenance, throttle abusive traffic, or suspend features that present a security or legal risk.
                        </p>
                        <p>
                            <strong className="text-black/80">No over-promise:</strong> these Terms do not include SOC 2, insurance, or other compliance certifications. Do not rely on certifications that are not stated here.
                        </p>
                    </Section>

                    <Section num={12} title="Disclaimers">
                        <p className="uppercase text-xs">
                            THE SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE.&rdquo; TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAVOS DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                        </p>
                        <p>
                            We do not warrant that the Services will be uninterrupted, error-free, or free of harmful components, or that blockchain transactions will confirm, remain irreversible in the sense you expect after a fork, or have any particular economic result.
                        </p>
                        <p>
                            Nothing we provide is financial, investment, legal, or tax advice.
                        </p>
                    </Section>

                    <Section num={13} title="Indemnification">
                        <p>
                            You will defend and indemnify Cavos, LLC and its members, officers, employees, and contractors against claims, damages, and reasonable legal fees arising from:
                        </p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>your application or your end users&rsquo; use of it;</li>
                            <li>your breach of these Terms or of law;</li>
                            <li>your infringement or misappropriation of a third party&rsquo;s rights;</li>
                            <li>content or instructions you provide to us;</li>
                            <li>any allegation that you (not Cavos) custody end-user assets or keys.</li>
                        </ul>
                        <p>
                            We will give you prompt notice of a claim (delay only matters if it prejudices you) and reasonable cooperation at your expense. You may not settle a claim that imposes an obligation on Cavos or admits fault by Cavos without our prior written consent, not to be unreasonably withheld.
                        </p>
                    </Section>

                    <Section num={14} title="Limitation of liability">
                        <p className="uppercase text-xs">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAVOS AND ITS AFFILIATES, MEMBERS, OFFICERS, EMPLOYEES, AND AGENTS ARE NOT LIABLE FOR:
                        </p>
                        <ul className="list-disc pl-4 space-y-2 text-xs uppercase">
                            <li>lost profits, lost revenue, lost data, lost or stolen digital assets, business interruption, or indirect, incidental, special, consequential, or punitive damages, even if advised of the possibility;</li>
                            <li>loss of funds or assets resulting from end-user actions, compromised sign-in providers, lost devices or passkeys, wrong addresses, or unintended signatures;</li>
                            <li>failures, bugs, forks, congestion, or reorgs of Starknet, Solana, Stellar, or other networks, or of third-party smart contracts, RPCs, paymasters, or relayers;</li>
                            <li>Stripe or other processor outages or charge outcomes;</li>
                            <li>your decision to use Free-plan limits or to exhaust a gas-sponsorship balance.</li>
                        </ul>
                        <p className="uppercase text-xs mt-4">
                            OUR TOTAL LIABILITY FOR ALL CLAIMS ARISING OUT OF THESE TERMS OR THE SERVICES IS LIMITED TO THE GREATER OF (A) THE AMOUNTS YOU PAID TO CAVOS FOR THE SERVICES IN THE TWELVE (12) MONTHS BEFORE THE CLAIM OR (B) USD 100.
                        </p>
                        <p>
                            These limits apply to all theories of liability (contract, tort, statute) and are an essential basis of the bargain. Some jurisdictions do not allow certain limitations; in those jurisdictions our liability is limited to the maximum extent permitted.
                        </p>
                    </Section>

                    <Section num={15} title="Suspension">
                        <p>
                            We may suspend access to the Services (in whole or part, including API keys or gas sponsorship) immediately if:
                        </p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>you materially breach these Terms or the acceptable-use rules;</li>
                            <li>a charge is overdue;</li>
                            <li>we reasonably believe continued use poses a security, legal, or sanctions risk;</li>
                            <li>we are required to do so by law or by a payment network.</li>
                        </ul>
                        <p>
                            We will restore access when the issue is resolved, unless we terminate under Section 16. Suspension does not, by itself, delete wallets on-chain.
                        </p>
                    </Section>

                    <Section num={16} title="Term and termination">
                        <p>
                            These Terms start when you first accept them or use the Services and continue until terminated.
                        </p>
                        <p>
                            <strong className="text-black/80">You</strong> may stop using the Services and cancel a paid plan at any time through the dashboard or by emailing{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>.
                            Cancellation of a paid plan takes effect at the end of the current billing period; you then drop to Free unless you delete the account. Per the published pricing FAQ, cancelling a paid plan does not delete existing wallets.
                        </p>
                        <p>
                            <strong className="text-black/80">We</strong> may terminate these Terms:
                        </p>
                        <ul className="list-disc pl-4 space-y-2">
                            <li>for convenience on 30 days&rsquo; notice;</li>
                            <li>immediately for material breach that is not cured within 15 days after notice (or immediately if the breach is not reasonably curable, including sanctions or fraud);</li>
                            <li>immediately if we discontinue the Services.</li>
                        </ul>
                        <p>
                            Upon termination or account deletion, your license ends. We will delete or anonymize personal data as described in the Privacy Policy and DPA. Sections that by their nature should survive (including 7, 9–14, 17–20) survive.
                        </p>
                        <p>
                            On-chain accounts and assets are not &ldquo;deleted&rdquo; by us; they remain on the relevant blockchain under the end user&rsquo;s control.
                        </p>
                    </Section>

                    <Section num={17} title="Changes to these Terms">
                        <p>
                            We may update these Terms. For material changes, we will notify you by email to the address on your account at least 14 days before the changes take effect, unless a shorter period is required for security or legal reasons. We will post the updated Terms at{' '}
                            <Link href="/terms" className="underline underline-offset-2 hover:text-black transition-colors">cavos.xyz/terms</Link>{' '}
                            with a new &ldquo;Last updated&rdquo; date.
                        </p>
                        <p>
                            Continued use after the effective date constitutes acceptance. If you do not agree, you must stop using the Services and cancel before the effective date.
                        </p>
                    </Section>

                    <Section num={18} title="Export and sanctions">
                        <p>
                            You represent that you are not, and are not acting for, a person prohibited from receiving the Services under applicable export-control or sanctions laws (including those of the United States). You will not use the Services in a manner that would cause Cavos to violate those laws.
                        </p>
                    </Section>

                    <Section num={19} title="Governing law and disputes">
                        <p>
                            These Terms are governed by the laws of the State of Delaware, without regard to conflict-of-law rules.
                        </p>
                        <p>
                            The parties will first try to resolve disputes informally by contacting{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>.
                            If a dispute proceeds to court, the state or federal courts located in the State of Delaware will have exclusive jurisdiction, except that either party may seek injunctive relief in any court of competent jurisdiction to protect intellectual property or confidential information.
                        </p>
                    </Section>

                    <Section num={20} title="Miscellaneous">
                        <p>
                            <strong className="text-black/80">Entire agreement.</strong> These Terms, plus the Privacy Policy, DPA, and any order or plan you accept in the dashboard, are the entire agreement for the Services and supersede prior discussions on the same subject. End-User Terms apply to end users, not as your customer contract.
                        </p>
                        <p>
                            <strong className="text-black/80">Order of precedence.</strong> If these Terms conflict with the DPA on the processing of personal data, the DPA controls for that subject. If they conflict with a written amendment signed by Cavos, LLC, the amendment controls.
                        </p>
                        <p>
                            <strong className="text-black/80">Assignment.</strong> You may not assign these Terms without our consent, except to a successor in a merger or sale of substantially all assets if the successor is not a competitor and agrees in writing to be bound. Cavos may assign to an affiliate or in connection with a reorganization, merger, or sale of assets.
                        </p>
                        <p>
                            <strong className="text-black/80">Severability; waiver.</strong> If a provision is unenforceable, the rest remains in effect. A waiver must be in writing.
                        </p>
                        <p>
                            <strong className="text-black/80">Notices.</strong> We will send notices to the email on your account. You will send legal notices to{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>.
                        </p>
                        <p>
                            <strong className="text-black/80">No third-party beneficiaries</strong>, except indemnified persons under Section 13.
                        </p>
                        <p>
                            <strong className="text-black/80">Force majeure.</strong> Neither party is liable for delay caused by events beyond reasonable control, including blockchain or infrastructure failures, provided the affected party uses reasonable efforts to mitigate.
                        </p>
                        <p>
                            <strong className="text-black/80">Relationship.</strong> The parties are independent contractors. These Terms do not create a partnership, joint venture, or agency. (Cavos, LLC is taxed as a partnership for US federal income-tax purposes; that tax classification does not make you a partner of Cavos.)
                        </p>
                        <p>
                            <strong className="text-black/80">Language.</strong> These Terms are in English. That is the controlling version.
                        </p>
                    </Section>

                    <Section num={21} title="Contact">
                        <p>
                            Questions about these Terms:{' '}
                            <a href="mailto:hello@cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">hello@cavos.xyz</a>
                        </p>
                        <p>
                            Cavos, LLC<br />
                            Operating the Cavos / Cavos Labs developer platform at{' '}
                            <Link href="https://cavos.xyz" className="underline underline-offset-2 hover:text-black transition-colors">cavos.xyz</Link>
                        </p>
                    </Section>

                </div>
            </div>

            <Footer />
        </main>
    )
}
