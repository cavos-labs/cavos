import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
    title: 'When an Embedded Wallet Makes Your App a Custodian',
    description:
        'Cited rules for crypto custody: MiCA, FinCEN, the FCA, California, and the regimes in Brazil, Argentina, Costa Rica, Mexico, Chile, and Colombia. Not legal advice.',
    alternates: {
        canonical: 'https://cavos.xyz/custody',
    },
    openGraph: {
        title: 'When an Embedded Wallet Makes Your App a Custodian',
        description:
            'What MiCA, FinCEN, the FCA, California, and the main Latin American regimes require when a product holds or controls user crypto.',
        url: 'https://cavos.xyz/custody',
        type: 'article',
        images: ['/og-image.png'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'When an Embedded Wallet Makes Your App a Custodian',
        description:
            'Custody rules cited to MiCA, FinCEN, the FCA, California, Brazil, Argentina, Costa Rica, Mexico, Chile, and Colombia. Not legal advice.',
        images: ['/og-image.png'],
    },
}

const FAQ = [
    {
        question: 'Does calling a wallet non-custodial keep a product outside these rules?',
        answer: 'The name on the wallet is irrelevant. MiCA asks whether you safekeep the assets or the keys. FinCEN asks whether you can move the value on your own. Argentina writes the exception into the rule: a firm that only provides self-custody wallets is not a virtual-asset service provider. Mexico and Costa Rica never wrote that sentence.',
    },
    {
        question: 'What capital does MiCA require for crypto custody?',
        answer: 'EUR 125,000. That is the Annex IV Class 2 floor for custody. Article 67 then takes the higher of that amount and a quarter of last year’s fixed overheads, in own funds, insurance, or both. If you lose client assets or keys and the loss is yours, Article 75(8) caps what you owe at the market value when the loss happened.',
    },
    {
        question: 'Are hosted crypto wallets money transmitters under FinCEN?',
        answer: 'Yes, when you hold the coins for customers. FIN-2019-G001 (9 May 2019) calls that an account-based money transmitter, even if the contract says you only move funds when the customer asks. Someone buying for themselves with a wallet only they can sign is not a money transmitter.',
    },
    {
        question: 'Does California license crypto storage?',
        answer: 'From 1 July 2026, storing a digital financial asset for a California resident needs a license, unless an exemption fits. Store means you keep control for them. Control includes being able to send a transaction on your own. DFPI expects $100,000 of tangible net worth to open an application. The bond amount is whatever DFPI sets under Financial Code section 3207. The statute never prints a dollar figure for it.',
    },
    {
        question: 'Is Latin America one custody rule?',
        answer: 'No. Argentina wants USD 150,000 of net worth to custody, and takes exclusive self-custody wallets out. Brazil, from 2 February 2026, wants prior authorization to hold or control the keys, and prices that with a capital formula. Costa Rica wants a SUGEF registration and sets no capital. Mexico’s notices sit at MXN 24,635 per client operation and MXN 469 on the fee. Chile wants CMF registration for custody of financial instruments. Colombia’s 2025 bill to license these providers was archived.',
    },
    {
        question: 'Does integrating Cavos mean an application needs no license?',
        answer: 'No. The Cavos backend is built so it cannot spend user funds or add itself as a signer. Recovery is a separate path: on Solana and Stellar an enclave can unwrap a spend key, and on Starknet it can schedule one add_signer. The docs call that non-custodial, and not trustless. Exchange, on-ramps, and sending crypto for a customer are licensed on their own. Ask counsel in each country where you have users.',
    },
]

const SOURCES = [
    {
        label: 'Regulation (EU) 2023/1114 (MiCA), including Article 3(1)(17), Article 67, Article 75, Recital 83, and Annex IV',
        href: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1114',
        note: 'Official Journal L 150, 9 June 2023',
    },
    {
        label: 'FinCEN FIN-2019-G001, Application of FinCEN’s Regulations to Certain Business Models Involving Convertible Virtual Currencies',
        href: 'https://www.fincen.gov/sites/default/files/2019-05/FinCEN%20Guidance%20CVC%20FINAL%20508.pdf',
        note: '9 May 2019, section 4.2',
    },
    {
        label: 'FCA, Overview of our cryptoassets regime policy statements',
        href: 'https://www.fca.org.uk/publications/policy-statements/cryptoasset-regime',
        note: 'Full regime from 25 October 2027',
    },
    {
        label: 'FCA Policy Statement PS26/12, A Prudential Regime for Cryptoasset Firms',
        href: 'https://www.fca.org.uk/publication/policy/ps26-12.pdf',
        note: 'June 2026. CRYPTOPRU 4.2.1R and 4.5.1R',
    },
    {
        label: 'California Financial Code section 3102',
        href: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=FIN&sectionNum=3102.',
        note: 'Definitions of control, store, exchange, and transfer. Amended by Stats. 2026, Ch. 52, effective 30 June 2026',
    },
    {
        label: 'California Financial Code section 3103',
        href: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=FIN&sectionNum=3103.',
        note: 'Exemptions, including the $50,000 activity threshold',
    },
    {
        label: 'DFPI, Digital Financial Assets Law FAQ',
        href: 'https://dfpi.ca.gov/regulated-industries/digital-financial-assets/digital-financial-assets-law-frequently-asked-questions/',
        note: 'License date of 1 July 2026',
    },
    {
        label: 'DFPI, Digital Financial Assets Law — Preparing for your Application',
        href: 'https://dfpi.ca.gov/regulated-industries/digital-financial-assets/digital-financial-assets-law-frequently-asked-questions/digital-financial-assets-law-preparing-for-your-application/',
        note: 'Initial tangible net worth of $100,000; bond amount set by DFPI',
    },
    {
        label: 'Lei nº 14.478, de 21 de dezembro de 2022 (Brazil)',
        href: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14478.htm',
        note: 'Article 2, prior authorization. Article 5(IV), custody or administration of virtual assets or of instruments that enable control',
    },
    {
        label: 'Resolução BCB nº 520, de 10 de novembro de 2025',
        href: 'https://www.in.gov.br/en/web/dou/-/resolucao-bcb-n-520-de-10-de-novembro-de-2025-668059151',
        note: 'Diário Oficial. In force 2 February 2026. Articles 8, 9, and 88',
    },
    {
        label: 'Resolução Conjunta nº 14, de 3 de novembro de 2025',
        href: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20Conjunta&numero=14',
        note: 'Capital formula, articles 8 to 10',
    },
    {
        label: 'Resolução BCB nº 517, de 3 de novembro de 2025',
        href: 'https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20BCB&numero=517',
        note: 'Article 3(III) assigns a custodiante SPSAV to custody of third-party resources. Article 4 lists the computing services that add capital',
    },
    {
        label: 'Resolución General CNV 1058/2025 (Argentina)',
        href: 'https://www.argentina.gob.ar/normativa/nacional/resolucion-1058-2025-410635/texto',
        note: '12 March 2025. Self-custody exclusion, category 4, and minimum net worth',
    },
    {
        label: 'Decreto Legislativo nº 10961 (Costa Rica), Alcance nº 78 a La Gaceta nº 113',
        href: 'https://www.imprentanacional.go.cr/pub/2026/06/19/ALCA78_19_06_2026.pdf',
        note: 'Published 19 June 2026. Adds article 15 quater to Law 7786. In force three months after publication',
    },
    {
        label: 'Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita, artículo 17, fracción XVI (Mexico)',
        href: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPIORPI.pdf',
        note: 'Chamber of Deputies text. Fraction XVI amended DOF 16 July 2025',
    },
    {
        label: 'INEGI, Unidad de Medida y Actualización 2026',
        href: 'https://www.inegi.org.mx/temas/uma/',
        note: 'Daily UMA MXN 117.31 from 1 February 2026. Used to convert the 210 UMA and 4 UMA notice thresholds',
    },
    {
        label: 'Banxico Circular 4/2019, disposición 3a, texto compilado',
        href: 'https://www.banxico.org.mx/marco-normativo/normativa-emitida-por-el-banco-de-mexico/circular-4-2019/circular-4-2019.html',
        note: 'Published DOF 8 March 2019, as amended by Circular 37/2020, DOF 30 September 2020. Institutions may not be authorized to custody virtual assets for clients',
    },
    {
        label: 'Ley nº 21.521 (Chile)',
        href: 'https://www.bcn.cl/leychile/navegar?idNorma=1187323',
        note: 'Published 4 January 2023. Articles 3, 5, and 10',
    },
    {
        label: 'Cámara de Representantes de Colombia, Proyecto de Ley 510/2025C',
        href: 'https://www.camara.gov.co/servicios-activos-virtuales-497/',
        note: 'Recorded as archived under article 190 of Law 5 of 1992',
    },
    {
        label: 'FATF, Updated Guidance for a Risk-Based Approach to Virtual Assets and VASPs',
        href: 'https://www.fatf-gafi.org/content/dam/fatf-gafi/guidance/RBA-VA-VASPs.pdf',
        note: 'October 2021, paragraphs 41 and 48',
    },
    {
        label: 'Astraea Counsel, Money Transmitter Licensing for Crypto Startups: A State-by-State Strategy',
        href: 'https://astraea.law/insights/money-transmitter-licensing-state-strategy-2025',
        note: 'Updated June 2026. Practitioner cost estimates, not statutory fees',
    },
    {
        label: 'Cavos docs, Concepts — non-custodial invariant',
        href: 'https://docs.cavos.xyz/docs/concepts',
        note: 'Product description, not a regulatory determination',
    },
    {
        label: 'Cavos docs, Hardware-isolated recovery',
        href: 'https://docs.cavos.xyz/docs/hardware-isolated-recovery',
        note: 'What the enclave can and cannot do',
    },
]

const MODELS = [
    {
        question: 'Who can move the assets',
        hosted: 'The host, on the owner’s instructions. FinCEN describes this host as having total independent control.',
        shared: 'Depends on whether the provider can complete a transaction without the user, or holds the means of access.',
        device: 'The user, if the provider has no authority that can spend. That has to be true of the build, not the name.',
    },
    {
        question: 'European Union',
        hosted: 'Custody under Article 3(1)(17). Annex IV Class 2 minimum of EUR 125,000, then Article 67 and Article 75.',
        shared: 'The same definition covers controlling the means of access, including private keys.',
        device: 'Recital 83 puts non-custodial wallet software outside MiCA. Article 3(1)(17) still applies if you control the keys.',
    },
    {
        question: 'United States, federal',
        hosted: 'Hosted wallet providers are money transmitters under FIN-2019-G001 §4.2.1 and register with FinCEN as MSBs.',
        shared: 'A multi-signature provider that has total independent control is a money transmitter regardless of its label. One that cannot move value alone, and only creates the wallet, is not, on the facts in §4.2.2.',
        device: 'For an unhosted single-signature wallet, the owner interacts with the payment system and has total independent control. Using it to buy goods or services for oneself is not money transmission.',
    },
    {
        question: 'California',
        hosted: 'Storing for a resident is digital financial asset business activity and needs a DFAL license from 1 July 2026, unless an exemption applies.',
        shared: '“Control” includes power to execute a transaction unilaterally (Financial Code §3102(c)(1)).',
        device: '“Store” is maintaining that control for a resident. A person who never has it is not storing. Exemptions in §3103 are specific; counsel has to match the product to one of them.',
    },
    {
        question: 'United Kingdom',
        hosted: 'Safeguarding qualifying cryptoassets is a regulated activity from 25 October 2027. Permanent minimum capital for that permission is £150,000, and K-RCS is 0.04% of average assets safeguarded.',
        shared: 'PS26/12 prices safeguarding. It has no separate line for shared keys.',
        device: 'No exemption for wallet software. The £150,000 is for firms that have the safeguarding permission.',
    },
]

export default function CustodyPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                '@id': 'https://cavos.xyz/custody#article',
                headline: 'When an embedded wallet makes your app a custodian',
                dateModified: '2026-09-22',
                datePublished: '2026-09-22',
                description:
                    'Cited comparison of custody obligations under MiCA, FinCEN, the FCA, California, and the Latin American texts cited on this page.',
                author: { '@type': 'Organization', name: 'Cavos', url: 'https://cavos.xyz' },
                publisher: { '@type': 'Organization', name: 'Cavos', url: 'https://cavos.xyz' },
                mainEntityOfPage: 'https://cavos.xyz/custody',
            },
            {
                '@type': 'FAQPage',
                '@id': 'https://cavos.xyz/custody#faq',
                mainEntity: FAQ.map((item) => ({
                    '@type': 'Question',
                    name: item.question,
                    acceptedAnswer: { '@type': 'Answer', text: item.answer },
                })),
            },
        ],
    }

    return (
        <main className="min-h-screen bg-white font-sans text-ink antialiased">
            <Script
                id="custody-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <article className="mx-auto max-w-6xl px-6 pb-24 pt-32 md:px-8">
                <header className="max-w-3xl">
                    <h1 className="text-balance text-[clamp(2.5rem,6vw,4.6rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        When an embedded wallet makes your app a custodian.
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        If your company can move a user’s crypto, you are holding it. The EU, US
                        money-transmission rules, California, and the UK from 25 October 2027 put
                        a price on that. Argentina writes exclusive self-custody wallets out of
                        its registry. The figures are in the table. The statutes are under it.
                    </p>
                </header>

                <aside className="mt-10 max-w-3xl rounded-2xl border border-line bg-surface px-6 py-5 text-sm leading-relaxed text-muted">
                    Statutes and regulator texts. Not legal advice, and not an opinion on
                    whether your Cavos integration needs a license.
                </aside>

                <section className="mt-16">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Cost, pros, and cons</h2>
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
                        Hosted means your company can move the coins. The right column is a wallet
                        the user signs, and you cannot. That is how Cavos is built. Exchange,
                        on-ramps, and transfers for a customer are not in these numbers.
                    </p>
                    <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {[
                            ['EUR 125,000', 'EU, custody minimum'],
                            ['£150,000', 'UK, safeguarding minimum'],
                            ['USD 150,000', 'Argentina, custody net worth'],
                            ['R$3.8–8 million', 'Brazil, worked example'],
                            ['$1–3 million', 'US states, estimate'],
                        ].map(([figure, label]) => (
                            <div key={label} className="rounded-2xl border border-line px-4 py-4">
                                <dt className="text-xl font-semibold tracking-[-0.03em] text-ink">{figure}</dt>
                                <dd className="mt-1 text-xs leading-snug text-muted">{label}</dd>
                            </div>
                        ))}
                    </dl>
                    <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
                        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                            <thead className="bg-brand text-white">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Where users are</th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">Hosted custody</th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">User signs; provider cannot spend</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 align-top font-semibold">European Union</th>
                                    <td className="border-l border-line px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">EUR 125,000</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Class 2 minimum. Then the higher of that or 1/4 of fixed overheads. Liability cap: market value at the time of loss.</p>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">Recital 83</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Non-custodial wallet software should sit outside MiCA. If you control the keys, Article 3(1)(17) still applies.</p>
                                    </td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 align-top font-semibold">United States, federal</th>
                                    <td className="border-l border-line px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">USD 0</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">FinCEN Form 107 has no filing fee. The cost is being a money transmitter. State licenses are the next row.</p>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">Not an MSB</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Buying for yourself, with a wallet only you can sign, is not money transmission. If you can move the coins alone, you register.</p>
                                    </td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 align-top font-semibold">United States, states</th>
                                    <td className="border-l border-line px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">$1–3 million</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">A law firm’s estimate, not a statute. 12–18 months. Fees about $25,000–$250,000. Bonds $25,000–$500,000 a state. Legal $500,000–$1 million. Ongoing $200,000–$500,000 a year.</p>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">Only if you transmit</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">That estimate is for money-transmitter licenses. Embedding a wallet does not put you in it.</p>
                                    </td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 align-top font-semibold">California</th>
                                    <td className="border-l border-line px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">$100,000</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Tangible net worth DFPI expects on a license application, from 1 July 2026. Bond: set by DFPI. No dollar amount in the statute.</p>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">Only if you store</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Store means you keep control for a resident. If you never have it, you are not storing.</p>
                                    </td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 align-top font-semibold">United Kingdom</th>
                                    <td className="border-l border-line px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">£150,000 + 0.04%</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Permanent minimum from 25 October 2027, plus 0.04% of average assets safeguarded.</p>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">Only if you safeguard</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">The £150,000 is for firms with the safeguarding permission. PS26/12 has no exemption for wallet software.</p>
                                    </td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 align-top font-semibold">Argentina</th>
                                    <td className="border-l border-line px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">USD 150,000</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Minimum net worth to custody. USD 75,000 if custodied volume over 12 months is under USD 2,500,000. Register before operating.</p>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">Out, if that is all you do</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">A firm that only offers self-custody wallets is not a PSAV. Exchange is still USD 150,000, or USD 75,000 under the volume test. Transfer is USD 75,000, or USD 37,500.</p>
                                    </td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 align-top font-semibold">Brazil</th>
                                    <td className="border-l border-line px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">R$3.8–8 million</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Worked example for one custody category. The law prints a formula: R$2 million plus R$3 million × 60% to 200%. Authorization comes first.</p>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">Same formula</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Custody includes holding or controlling the keys for someone else. The law has no self-custody exception.</p>
                                    </td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 align-top font-semibold">Costa Rica</th>
                                    <td className="border-l border-line px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">No capital in the law</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">SUGEF registration from 19 September 2026. It is not a license to operate. Refusing to register: a fine of 2–100 base salaries.</p>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">No second figure</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">You register if you custody or control assets as a business. The law never says a self-custody wallet is out, and it never says every wallet is in. CONASSIF still has to draw that line.</p>
                                    </td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 align-top font-semibold">Mexico</th>
                                    <td className="border-l border-line px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">MXN 24,635 / MXN 469</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">AML notices, not a custody license. 210 × and 4 × INEGI’s daily UMA of MXN 117.31, from 1 February 2026. Banks and fintech institutions cannot custody for clients.</p>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">MXN 24,635 / MXN 469</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Offering a way to store or send virtual assets is the same notice.</p>
                                    </td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 align-top font-semibold">Chile</th>
                                    <td className="border-l border-line px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">Set by the CMF</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Registration first. The guarantee is whatever the Commission sets once you pass its volume or client threshold.</p>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">Only that custody</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Registration is for professional custody of financial instruments. The law has no software exemption and no peso amount.</p>
                                    </td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 align-top font-semibold">Colombia</th>
                                    <td className="border-l border-line px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">No license fee</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Bill 510/2025C was archived. It never became law, so it set no fee.</p>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-4 align-top">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">No license fee</p>
                                        <p className="mt-1 text-xs leading-snug text-muted">Same bill. DIAN and UIAF rules are not in this row.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
                        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                            <thead className="bg-brand text-white">
                                <tr>
                                    <th className="w-[16%] px-5 py-4 font-semibold">Tradeoff</th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">Hosted custody</th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">User signs; provider cannot spend</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-5 align-top font-semibold">Pros</th>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">
                                        <ul className="list-disc space-y-2 pl-4">
                                            <li>You can pay someone out, keep an exchange balance, or run a treasury without waiting for the user’s signature.</li>
                                        </ul>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-5 align-top leading-relaxed">
                                        <ul className="list-disc space-y-2 pl-4">
                                            <li>The EU, FinCEN, California, and Argentina price control. A provider that never has it sits outside the words of those tests.</li>
                                            <li>The user holds the key that spends.</li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-5 align-top font-semibold">Cons</th>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">
                                        <ul className="list-disc space-y-2 pl-4">
                                            <li>You pay the rows above.</li>
                                            <li>FinCEN still calls you a money transmitter if you can move the value alone, even when the contract says you only act on instructions.</li>
                                            <li>If the keys are lost and it is your fault, MiCA makes you pay the client, up to the market value at the time.</li>
                                        </ul>
                                    </td>
                                    <td className="border-l border-line bg-brand/[0.035] px-5 py-5 align-top leading-relaxed">
                                        <ul className="list-disc space-y-2 pl-4">
                                            <li>You cannot send a payout or move a treasury on your own.</li>
                                            <li>Exchange, on-ramps, and transfers for a customer are licensed either way.</li>
                                            <li>Brazil, Costa Rica, Mexico, and the UK never wrote Argentina’s exception.</li>
                                            <li>Cavos recovery can unwrap a spend key on Solana and Stellar, or schedule one signer add on Starknet. The docs call that non-custodial, and not trustless.</li>
                                        </ul>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">The test is control</h2>
                    <p className="mt-5 text-base leading-relaxed text-muted">
                        Each of these asks who can hold the assets, or make them move.
                    </p>
                    <ul className="mt-6 space-y-4 text-sm leading-relaxed">
                        <li>
                            <strong className="font-semibold text-ink">European Union.</strong>{' '}
                            <span className="text-muted">
                                “Providing custody and administration of crypto-assets on behalf of
                                clients” means safekeeping or controlling, on behalf of clients,
                                crypto-assets or the means of access to them, where applicable in
                                the form of private cryptographic keys. Regulation (EU) 2023/1114,
                                Article 3(1)(17).
                            </span>
                        </li>
                        <li>
                            <strong className="font-semibold text-ink">United States, FinCEN.</strong>{' '}
                            <span className="text-muted">
                                Treatment of a wallet intermediary depends on who owns the value,
                                where it is stored, whether the owner interacts directly with the
                                payment system, and whether the intermediary has total independent
                                control over the value. FIN-2019-G001, section 4.2.
                            </span>
                        </li>
                        <li>
                            <strong className="font-semibold text-ink">California.</strong>{' '}
                            <span className="text-muted">
                                “Store” means to maintain control of a digital financial asset on
                                behalf of a resident by a person other than the resident. “Control,”
                                for a transaction, includes the power to execute it unilaterally.
                                Financial Code section 3102(u) and 3102(c)(1).
                            </span>
                        </li>
                        <li>
                            <strong className="font-semibold text-ink">United Kingdom.</strong>{' '}
                            <span className="text-muted">
                                The FCA’s prudential rules price the permission to safeguard
                                cryptoassets. Policy Statement PS26/12 (June 2026) sets that
                                permission’s permanent minimum capital at £150,000.
                            </span>
                        </li>
                    </ul>
                </section>

                <section className="mt-20">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Who can sign</h2>
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
                        Embedded only says the wallet lives in the app. The middle column is the
                        one teams misname: if you hold a key the spend needs, or you can move funds
                        alone, the rule looks at that.
                    </p>
                    <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
                        <table className="w-full min-w-[960px] border-collapse text-left">
                            <thead className="bg-brand text-white">
                                <tr>
                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">Question</th>
                                    <th className="border-l border-white/10 px-5 py-4 text-sm font-semibold">Hosted custody</th>
                                    <th className="border-l border-white/10 px-5 py-4 text-sm font-semibold">Provider can spend, or holds a required key</th>
                                    <th className="border-l border-white/10 px-5 py-4 text-sm font-semibold">User signs; provider cannot spend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MODELS.map((row) => (
                                    <tr key={row.question} className="border-t border-line">
                                        <th scope="row" className="w-[16%] px-5 py-5 align-top text-sm font-semibold">{row.question}</th>
                                        <td className="w-[28%] border-l border-line px-5 py-5 align-top text-sm leading-relaxed text-muted">{row.hosted}</td>
                                        <td className="w-[28%] border-l border-line px-5 py-5 align-top text-sm leading-relaxed text-muted">{row.shared}</td>
                                        <td className="w-[28%] border-l border-line bg-brand/[0.035] px-5 py-5 align-top text-sm leading-relaxed">{row.device}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-20 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">European Union: capital, liability, and a recital</h2>
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                        Annex IV of MiCA sets the permanent minimum capital by the services a
                        crypto-asset service provider is authorised for:
                    </p>
                    <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
                        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                            <thead className="bg-brand text-white">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Class</th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">Services include</th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">Permanent minimum</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 font-semibold">1</th>
                                    <td className="border-l border-line px-5 py-4 leading-relaxed text-muted">Execution of orders, placing, transfer services for clients, reception and transmission of orders, advice, portfolio management</td>
                                    <td className="border-l border-line px-5 py-4 font-semibold">EUR 50,000</td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 font-semibold">2</th>
                                    <td className="border-l border-line px-5 py-4 leading-relaxed text-muted">Class 1 services and custody and administration on behalf of clients, exchange of crypto-assets for funds, or exchange of crypto-assets for other crypto-assets</td>
                                    <td className="border-l border-line px-5 py-4 font-semibold">EUR 125,000</td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-4 font-semibold">3</th>
                                    <td className="border-l border-line px-5 py-4 leading-relaxed text-muted">Class 2 services and operation of a trading platform</td>
                                    <td className="border-l border-line px-5 py-4 font-semibold">EUR 150,000</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            Article 67(1) requires prudential safeguards, at all times, equal to
                            the higher of that Annex IV amount and one quarter of the fixed
                            overheads of the preceding year. A firm that has not been in business
                            for one year uses the projected fixed overheads for its first 12 months
                            (Article 67(2)). Safeguards may be Common Equity Tier 1 own funds, an
                            insurance policy, or both (Article 67(4)). Where insurance is used, it
                            must cover liability to clients under Article 75(8) (Article 67(6)(g)).
                        </p>
                        <p>
                            Article 75(8) makes a custody provider liable to its clients for the
                            loss of any crypto-assets, or of the means of access to them, resulting
                            from an incident attributable to the provider. Liability is capped at
                            the market value of the crypto-asset at the time the loss occurred.
                            The provider can point to an incident it shows occurred independently
                            of the service, including a problem inherent in a distributed ledger it
                            does not control. Article 75 also requires a client agreement, a
                            register of positions, a custody policy, segregation of client holdings
                            from the provider’s own, and procedures to return assets or the means
                            of access. Article 74 requires an orderly wind-down plan for providers
                            of the services in Articles 75 to 79, which includes custody.
                        </p>
                        <p>
                            Recital 83 says providers of non-custodial wallet hardware or software
                            should sit outside MiCA. A recital is not the article. If you safekeep
                            client assets or private keys, Article 3(1)(17) still calls it custody.
                        </p>
                        <p>
                            Moving crypto for a customer, from one address to another, is its own
                            service under Article 3(1)(26). It sits in Class 1, at EUR 50,000, even
                            if you are not the custodian. MiCA never says whether broadcasting a
                            transaction the user already signed counts.
                        </p>
                    </div>
                </section>

                <section className="mt-20 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">United States: FinCEN’s hosted-wallet rule</h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            FIN-2019-G001, section 4.2.1, describes hosted wallet providers as
                            account-based money transmitters that receive, store, and transmit
                            convertible virtual currency on behalf of their accountholders. In that
                            model the value belongs to the owner, the owner interacts with the host
                            rather than with the payment system, and the host has total independent
                            control over the value, although it is contractually obligated to
                            access the value only on the owner’s instructions.
                        </p>
                        <p>
                            The same section describes unhosted wallets as software on a person’s
                            device that does not require an additional third party to conduct
                            transactions. For an unhosted single-signature wallet, the value is the
                            owner’s, the owner interacts with the payment system directly, and the
                            owner has total independent control. A person conducting a transaction
                            through that wallet to purchase goods or services on their own behalf
                            is not a money transmitter.
                        </p>
                        <p>
                            Section 4.2.2 covers multiple-signature providers. If the provider’s
                            role is limited to creating unhosted wallets that require a second
                            authorization key, and the provider does not have total independent
                            control, FinCEN says the provider is not a money transmitter because it
                            does not accept and transmit value. The next sentences draw the line
                            the other way: if the provider also operates as a hosted wallet, if the
                            value is an entry on the provider’s books, if the owner does not
                            interact with the payment system directly, or if the provider has total
                            independent control, the provider is a money transmitter regardless of
                            the label it uses.
                        </p>
                        <p>
                            Federal MSB registration is not a state license. A June 2026 guide by
                            Astraea Counsel, citing FinCEN, states that registration on Form 107
                            carries no government fee, and that the anti-money-laundering program
                            behind it is a separate cost. The same guide’s cost ranges for a broad
                            multi-state money-transmitter licensing effort are order-of-magnitude
                            practitioner estimates, which the authors say are not statutory
                            amounts and vary by state and by transaction volume:
                        </p>
                    </div>
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
                        <li>Application fees of roughly $250 to $10,000 per state, often about $25,000 to $250,000 across a 49-state footprint.</li>
                        <li>Surety bonds commonly $25,000 to $500,000 per state, scaled to volume. The premium is a fraction of the face amount.</li>
                        <li>Minimum net worth typically $25,000 to $500,000.</li>
                        <li>Legal and consulting of roughly $500,000 to $1,000,000 for a full multi-state effort.</li>
                        <li>Ongoing annual compliance of roughly $200,000 to $500,000.</li>
                        <li>A planning figure the guide calls reasonable: on the order of $1–3 million and 12–18 months for comprehensive coverage.</li>
                    </ul>
                    <p className="mt-4 text-sm leading-relaxed text-muted">
                        Those ranges are the firm’s, not a fee schedule. Price the states you
                        actually need. The fifty statutes do not agree on when virtual-currency
                        activity is money transmission.
                    </p>
                </section>

                <section className="mt-20 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">California: a license to store, from 1 July 2026</h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            The Digital Financial Assets Law prohibits a person from engaging in
                            digital financial asset business activity with or on behalf of a
                            California resident unless licensed or otherwise covered. The Department
                            of Financial Protection and Innovation’s FAQ states that Assembly Bill
                            1934 moved that license date to 1 July 2026. “Digital financial asset
                            business activity” includes exchanging, transferring, or storing a
                            digital financial asset (Financial Code section 3102(h)).
                        </p>
                        <p>
                            Exchange and transfer, as defined in section 3102(i) and 3102(v), both
                            require assuming control of the asset from or on behalf of a resident.
                            Store requires maintaining that control for the resident. Control, in
                            section 3102(c)(1), is the power to execute a digital financial asset
                            transaction unilaterally, or to prevent one indefinitely, with a narrow
                            exception for terminating or interrupting a transaction solely in
                            response to unauthorized or fraudulent activity.
                        </p>
                        <p>
                            Section 3103 lists exemptions. Two that wallet teams read first, and
                            that have to be matched to the actual product:
                        </p>
                        <ul className="list-disc space-y-2 pl-5">
                            <li>
                                A person that contributes only connectivity software or computing
                                power to securing a network that records digital financial asset
                                transactions, or to a protocol governing transfer of the digital
                                representation of value (section 3103(b)(7)(A)).
                            </li>
                            <li>
                                A person whose digital financial asset business activity with or on
                                behalf of residents is reasonably expected to be valued, in the
                                aggregate, at $50,000 or less per year, measured by the US dollar
                                equivalent of the digital financial assets (section 3103(b)(9)).
                                The statute measures the assets, not your revenue.
                            </li>
                        </ul>
                        <p>
                            DFPI expects $100,000 of tangible net worth to open an application, and
                            says it will set a final amount later under section 3207(b). You also
                            need a surety bond or a trust account. DFPI picks that amount. Neither
                            the statute nor the DFPI pages we checked print one number for it.
                        </p>
                    </div>
                </section>

                <section className="mt-20 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">United Kingdom: safeguarding capital from 25 October 2027</h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            The FCA states that the Financial Services and Markets Act 2000
                            (Cryptoassets) Regulations 2026 were made on 4 February 2026, and that
                            the full scope of regulated cryptoasset activities expands from 25
                            October 2027.
                        </p>
                        <p>
                            Policy Statement PS26/12 (June 2026) sets the permanent minimum capital
                            requirement for a firm with permission for safeguarding cryptoassets at
                            £150,000 (CRYPTOPRU 4.2.1R). Where more than one permission applies, the
                            permanent minimum is the highest applicable figure in that table. The
                            own-funds requirement is the highest of the permanent minimum, one
                            quarter of relevant expenditure (the fixed-overheads requirement), and
                            the K-factor requirement. For a firm safeguarding cryptoassets, the
                            K-RCS requirement equals 0.04% of its average cryptoassets safeguarded
                            (CRYPTOPRU 4.5.1R).
                        </p>
                        <p>
                            PS26/12 never exempts non-custodial wallet software. The £150,000 and the
                            0.04% apply to firms that hold the safeguarding permission.
                        </p>
                    </div>
                </section>

                <section className="mt-20">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Latin America</h2>
                    <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">
                        Argentina takes exclusive self-custody wallets out, and still wants USD
                        150,000 to custody. Brazil wants authorization and a capital formula.
                        Costa Rica wants a SUGEF registration and sets no capital. Mexico, Chile,
                        and Colombia are different again.
                    </p>
                    <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
                        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                            <thead className="bg-brand text-white">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Country</th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">What the text calls custody</th>
                                    <th className="border-l border-white/10 px-5 py-4 font-semibold">What it requires</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-5 align-top font-semibold">Argentina</th>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Category 4: custody or administration of virtual assets or of instruments that allow control over them, “siempre y cuando no sean no custodiados.” Exclusive self-custody wallet providers are outside the definition.</td>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Register before operating. Minimum net worth of USD 150,000, or 50% of that if custodied volume over the last 12 months is under USD 2,500,000.</td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-5 align-top font-semibold">Brazil</th>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Guard and control of the instruments that affect rights in the virtual asset, including private keys. The statute is custody or administration of assets or of instruments that enable control, done in the name of third parties.</td>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Prior federal authorization. Capital is a formula. A custodiante is in the R$3,000,000 operational category, then scaled, plus a cost parcel. There is no single statutory minimum.</td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-5 align-top font-semibold">Costa Rica</th>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Custody, deposit, administration, or control, by any means, of virtual assets, done as a business for oneself or for a third party.</td>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Register with SUGEF. The statute says the registration is not an operating authorization. In force 19 September 2026. No published capital floor in the decree.</td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-5 align-top font-semibold">Mexico</th>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Two perimeters. Licensed banks and fintech institutions cannot be authorized to custody virtual assets for clients. Separately, providing means to custody, store, or transfer virtual assets is an anti-money-laundering vulnerable activity.</td>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Notices when a client’s operation reaches 210 times the daily UMA, and when the fee reaches 4 times the daily UMA. That is reporting, not a custody license.</td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-5 align-top font-semibold">Chile</th>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Professional custody of financial instruments. A financial instrument can be an incorporeal structured to represent a virtual financial asset. Custody means holding those instruments, money, or FX for third parties in the flows the statute describes.</td>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Registration with the CMF before offering the service. A bank bond or insurance policy once the CMF’s volume or client threshold is met, for an amount the CMF sets.</td>
                                </tr>
                                <tr className="border-t border-line">
                                    <th scope="row" className="px-5 py-5 align-top font-semibold">Colombia</th>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Bill 510/2025C would have regulated virtual-asset service providers.</td>
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">Archived under article 190 of Law 5 of 1992. It never became a license.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-10 max-w-3xl space-y-10 text-sm leading-relaxed text-muted">
                        <div>
                            <h3 className="text-xl font-medium tracking-[-0.02em] text-ink">Argentina</h3>
                            <p className="mt-3">
                                Resolución General CNV 1058/2025, of 12 March 2025, rewrites the
                                registry rules for proveedores de servicios de activos virtuales.
                                Article 1 says a person covered by the definition must register
                                before carrying out the activity. The same article says the
                                definition does not reach “quienes prestan servicios exclusivamente
                                en carácter de proveedores de billeteras de autocustodia.” It also
                                leaves out acting for oneself, receiving virtual assets as payment
                                for one’s own goods or services, and a decentralized protocol with
                                no identifiable provider.
                            </p>
                            <p className="mt-3">
                                Category 4 is “custodia y/o administración de Activos Virtuales o
                                instrumentos que permitan el control sobre los mismos (siempre y
                                cuando no sean no custodiados).” Natural persons may only register
                                for categories 1 and 2, exchange, not for custody. Article 9 sets
                                minimum net worth for categories 1, 2, and 4 at USD 150,000. Category
                                3, transfer, is USD 75,000. If volume over the last 12 months is
                                under USD 2,500,000 — transacted for categories 1 to 3, custodied
                                for category 4 — the minimum is half. A firm in more than one category
                                meets the most demanding one. Exchange and transfer stay in
                                categories 1 to 3 even when the wallet itself is outside category 4.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium tracking-[-0.02em] text-ink">Brazil</h3>
                            <p className="mt-3">
                                Lei 14.478/2022, article 2, says a virtual-asset service provider
                                may operate in the country only with prior authorization from a
                                federal body. Article 5 defines that provider as a legal person
                                that, in the name of third parties, performs at least one listed
                                service. Item IV is custody or administration of virtual assets, or of
                                the instruments that let you control them. There is no self-custody
                                exception.
                            </p>
                            <p className="mt-3">
                                Resolução BCB 520, of 10 November 2025, is in force on 2 February
                                2026 (article 92). Article 9 says custody comprises, among other
                                activities, “a guarda e o controle dos instrumentos que afetam o
                                exercício dos direitos,” and gives private keys as the example.
                                Firms already doing this on that date have 270 days from 2 February
                                2026 to ask for authorization (article 88). The resolution prints
                                the 270 days, not a calendar date.
                            </p>
                            <p className="mt-3">
                                Capital is a formula in Resolução Conjunta 14, articles 8 to 10. Paid-in
                                capital and net worth are a cost piece plus an activity piece. Cost
                                is R$2,000,000 times the number of operational categories. Activity
                                puts R$3,000,000 on “custódia e administração de recursos de
                                terceiros,” then multiplies by a funding factor: 60% own resources,
                                80% institutional, 120% public money other than deposits, 200%
                                deposits. The factor is the highest one among sources the institution
                                is allowed to take, including sources it is not using. Resolução BCB 517, article
                                3(III), puts a custodiante in that R$3,000,000 category.
                            </p>
                            <p className="mt-3">
                                One custody category and no investment activity works out to
                                R$3,000,000 times the funding factor, plus R$2,000,000. At 60% that
                                is R$1,800,000 plus R$2,000,000, so R$3,800,000. At 200% it is
                                R$8,000,000. The statute never prints either total. Article 9(II)
                                adds another R$5,000,000, up to R$10,000,000 if there are extra
                                modalities, only for computing services listed in Resolução BCB 517,
                                article 4. Custody of virtual assets is not on that list.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium tracking-[-0.02em] text-ink">Costa Rica</h3>
                            <p className="mt-3">
                                Decreto Legislativo 10961, published in La Gaceta, Alcance 78, on
                                19 June 2026, adds article 15 quater to Law 7786. Article 4 of the
                                decree says it takes effect three months after publication, which
                                is 19 September 2026, and gives up to three months to issue the
                                regulation.
                            </p>
                            <p className="mt-3">
                                A proveedor de servicios de activos virtuales is any natural or
                                legal person who, as a business, does any of four things for
                                themselves or in the name of a third party. Item iii is “custodia,
                                depósito, administración o control, por cualquier medio, de activos
                                virtuales.” The article also covers exchange, transfer, and
                                services tied to issuance or sale. A virtual asset is a digital
                                representation of value that can be traded or transferred and used
                                for payments or investment. The same sentence says that does not
                                make it legal tender or a currency of the Central Bank.
                            </p>
                            <p className="mt-3">
                                Those providers must register with the Superintendencia General de
                                Entidades Financieras. The statute says the registration “no
                                representa una autorización de operación.” SUGEF supervises
                                prevention of money laundering, terrorist financing, and
                                proliferation financing. Customer due diligence applies when a
                                transaction reaches the threshold CONASSIF sets by regulation. The
                                decree leaves the due-diligence threshold to CONASSIF, and it sets no
                                minimum capital. Refusing to register is a fine of two to one
                                hundred base salaries, as Law 7337 defines them.
                                If the virtual-asset activity is also a matter another financial
                                superintendency regulates, that supervision applies as well.
                            </p>
                            <p className="mt-3">
                                There is one capital answer: none. The duty turns on custody, deposit,
                                administration, or control, done as a business. Argentina writes
                                self-custody wallet providers out. Article 15 quater does not, and
                                it also never says that software which never controls the assets is
                                in. CONASSIF has to set that scope. We have not found a published
                                rule that does.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium tracking-[-0.02em] text-ink">Mexico</h3>
                            <p className="mt-3">
                                Banxico Circular 4/2019, disposición 3a of the compiled text
                                (published in the Diario Oficial on 8 March 2019 and amended by
                                Circular 37/2020 on 30 September 2020), applies to credit
                                institutions and financial-technology institutions. Operations with
                                virtual assets that those institutions may be authorized to do are
                                internal operations. Operations through which they would directly
                                provide clients with exchange, transmission, or custody of virtual
                                assets are not eligible for that authorization.
                            </p>
                            <p className="mt-3">
                                Outside that perimeter, article 17, fraction XVI, of the Ley
                                Federal para la Prevención e Identificación de Operaciones con
                                Recursos de Procedencia Ilícita treats as a vulnerable activity the
                                habitual professional offering of virtual-asset exchange by persons
                                other than financial entities, including those who provide means to
                                custody, store, or transfer virtual assets that Banxico has not
                                recognized under the fintech law. The text includes operations with
                                Mexican citizens from another jurisdiction. A notice to the
                                Secretariat is due when a client’s operation reaches 210 times the
                                daily UMA, and, separately, when the consideration for the service
                                reaches 4 times the daily UMA. Fraction XVI was amended in the
                                Diario Oficial on 16 July 2025. This is an anti-money-laundering
                                report, not a custody license. Software that lets someone store or
                                send virtual assets is inside the same sentence.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium tracking-[-0.02em] text-ink">Chile</h3>
                            <p className="mt-3">
                                Law 21.521, published on 4 January 2023, defines a criptoactivo as
                                a digital representation of units of value, goods, or services,
                                excluding money and foreign exchange. A financial instrument
                                includes an incorporeal good designed, used, or structured to
                                generate monetary income, or to represent an outstanding debt or a
                                virtual financial asset. Public-offer securities, and money or
                                foreign exchange, are not financial instruments under the law.
                            </p>
                            <p className="mt-3">
                                Custody of financial instruments is holding, in one’s own name for
                                third parties or in their name, financial instruments, money, or
                                foreign exchange that come from the flows or the sale of instruments
                                held in custody, or that were delivered to acquire instruments or
                                to guarantee operations with them. Article 5 says only persons
                                registered in the Registro de Prestadores de Servicios Financieros
                                may professionally provide that custody. Article 10 requires a bank
                                bond or insurance policy once the volume or number of clients set
                                by the Comisión para el Mercado Financiero is reached. The Commission
                                sets the amount. These articles have no self-custody software
                                exemption and no fixed peso figure for crypto custody.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium tracking-[-0.02em] text-ink">Colombia</h3>
                            <p className="mt-3">
                                The Chamber of Representatives’ file for Proyecto de Ley 510/2025C,
                                “por la cual se regulan los proveedores de servicios de activos
                                virtuales,” records the bill as archived under article 190 of Law 5
                                of 1992. The bill died there. It never became a custody license.
                                That says nothing about DIAN, the UIAF, or any other Colombian rule.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-20 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">FATF</h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            FATF’s October 2021 guidance is what national AML rules implement. It
                            is not itself a license. Paragraph 41 treats safekeeping as exclusive
                            or independent control of someone else’s private key. Paragraph 48
                            leaves out hardware-wallet makers and non-custodial wallet providers,
                            unless they also exchange, transfer, or safekeep for customers as a
                            business.
                        </p>
                    </div>
                </section>

                <section className="mt-20 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">What Cavos holds</h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            The Cavos backend is not allowed to move user funds or enroll itself as
                            a signer. On Solana the relayer pays fees. It does not spend. Registries,
                            recovery, paymasters, and relayers can coordinate a transaction. They
                            cannot authorize one.
                        </p>
                        <p>
                            Recovery is opt-in, and it is a different path. On Solana and Stellar
                            the enclave seals a MasterDEK and can unwrap it. If that wrap is
                            compromised, the spend key can be restored. On Starknet the enclave may
                            schedule one <span className="font-mono text-[13px]">add_signer</span>.
                            The contract still enforces nonce, expiry, timelock, cancellation, and
                            finalization. The docs call this hardware-isolated and non-custodial,
                            and they say it is not trustless: the user is relying on the measured
                            enclave image and on AWS attestation. A Cavos employee has no key to
                            hand over. The key material is sealed to that measurement.
                        </p>
                        <p>
                            Anyone applying MiCA, FinCEN, or California’s control test has to read
                            that recovery path, not only the ordinary spend. Nothing here says a
                            Cavos integration is unlicensed. Exchange, fiat on-ramps, and payments
                            are their own activities even when the user signs the wallet.
                        </p>
                        <p>
                            Provider comparisons of signing models, chains, and recovery are on the{' '}
                            <Link href="/compare" className="font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                                compare pages
                            </Link>
                            . The security write-up is in the{' '}
                            <a href="https://docs.cavos.xyz/docs/concepts" className="font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                                concepts
                            </a>{' '}
                            and{' '}
                            <a href="https://docs.cavos.xyz/docs/hardware-isolated-recovery" className="font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                                hardware-isolated recovery
                            </a>{' '}
                            docs.
                        </p>
                    </div>
                </section>

                <section className="mt-20 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">When the hosted model matches the product</h2>
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                        Use a host when the product has to move a user’s coins without their
                        signature: payouts, an exchange balance, a treasury you operate. That is
                        the capital, the liability, and the license quoted above. A wallet only an
                        enrolled device can spend is a different build. Exchange, on-ramps, and
                        transfers for customers still get classified on their own.
                    </p>
                </section>

                <section className="mt-20" id="faq">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Questions</h2>
                    <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
                        {FAQ.map((item) => (
                            <article key={item.question}>
                                <h3 className="font-semibold">{item.question}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-20 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Sources</h2>
                    <p className="mt-4 text-sm leading-relaxed text-muted">
                        The Astraea dollar ranges are a law firm’s estimates. They are not fees
                        in a statute.
                    </p>
                    <ol className="mt-6 space-y-4 text-sm leading-relaxed">
                        {SOURCES.map((source) => (
                            <li key={source.href}>
                                <a
                                    href={source.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
                                >
                                    {source.label}
                                </a>
                                <span className="mt-1 block text-muted">{source.note}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="mt-20 flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand px-8 py-10 text-white md:flex-row md:items-center">
                    <div>
                        <h2 className="text-2xl font-medium">Read how signing works before you integrate.</h2>
                        <p className="mt-2 max-w-xl text-sm text-white/70">
                            The quickstart is the device signer. A lawyer in each country where
                            you have users still has to classify the rest.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="https://docs.cavos.xyz/docs/quickstart"
                            className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink"
                        >
                            Read the quickstart
                        </a>
                        <Link
                            href="/compare"
                            className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                        >
                            Compare providers
                        </Link>
                    </div>
                </section>
            </article>

            <Footer />
        </main>
    )
}
