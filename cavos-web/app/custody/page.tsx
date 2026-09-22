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

const UPDATED = '22 September 2026'

const FAQ = [
    {
        question: 'Does calling a wallet non-custodial keep a product outside these rules?',
        answer: 'No regulator cited on this page uses the marketing label as the test. MiCA Article 3(1)(17) covers safekeeping or controlling crypto-assets or the means of access to them, including private keys. FinCEN’s May 2019 guidance says a provider is a money transmitter if it has total independent control over the value, regardless of the label it applies to itself. Argentina writes the carve-out down: Resolución General CNV 1058/2025 says people who exclusively provide self-custody wallets are outside the virtual-asset service provider definition. Mexico’s anti-money-laundering statute, and Costa Rica’s Law 10961, do not copy that carve-out. Costa Rica covers a person who, as a business, has custody, deposit, administration, or control of virtual assets by any means.',
    },
    {
        question: 'What capital does MiCA require for crypto custody?',
        answer: 'Annex IV of Regulation (EU) 2023/1114 sets a permanent minimum of EUR 125,000 for a crypto-asset service provider authorised for custody and administration of crypto-assets on behalf of clients. Article 67 requires prudential safeguards equal to the higher of that Annex IV amount and one quarter of the preceding year’s fixed overheads. Those safeguards may be own funds, an insurance policy, or a combination. Article 75(8) makes the custodian liable for loss of crypto-assets or of the means of access when the incident is attributable to it, capped at the market value at the time of the loss.',
    },
    {
        question: 'Are hosted crypto wallets money transmitters under FinCEN?',
        answer: 'FinCEN guidance FIN-2019-G001 (9 May 2019), section 4.2.1, describes hosted wallet providers as account-based money transmitters that receive, store, and transmit convertible virtual currency on behalf of accountholders. In that model the host has total independent control over the value, even when it is contractually limited to acting on the owner’s instructions. Unhosted single-signature wallets, where the owner interacts with the payment system directly and has total independent control, are described differently: a person using one to buy goods or services on their own behalf is not a money transmitter.',
    },
    {
        question: 'Does California license crypto storage?',
        answer: 'From 1 July 2026, California’s Digital Financial Assets Law prohibits engaging in digital financial asset business activity with or on behalf of a California resident unless the person is licensed or otherwise permitted. “Store” means maintaining control of a digital financial asset on behalf of a resident by someone other than the resident. “Control” includes the power to execute a transaction unilaterally. The Department of Financial Protection and Innovation says it expects an initial tangible net worth of $100,000 on an application. The surety bond or trust account amount is set by the Department under Financial Code section 3207; the statute does not fix that amount at a published dollar figure.',
    },
    {
        question: 'Is Latin America one custody rule?',
        answer: 'No. Brazil’s Central Bank, from 2 February 2026, treats custody as guard or control of the instruments that affect rights in a virtual asset, including private keys, and requires prior authorization. Argentina’s securities regulator requires registration and a minimum net worth of USD 150,000 for custody, and excludes exclusive self-custody wallet providers. Costa Rica’s Law 10961, in force three months after its 19 June 2026 publication, requires SUGEF registration for a person who as a business custodies or controls virtual assets. That registration is not an operating authorization. Mexico bars licensed fintech institutions from custodying virtual assets for clients, and separately treats providing means to custody or transfer virtual assets as an anti-money-laundering vulnerable activity. Chile registers professional custody of financial instruments, a category that can include a virtual financial asset. Colombia’s 2025 bill to license virtual-asset service providers was archived; that bill did not become a license.',
    },
    {
        question: 'Does integrating Cavos mean an application needs no license?',
        answer: 'This page does not reach that conclusion. Cavos documents a model in which its backend does not hold a key that can spend user funds. Opt-in hardware-isolated recovery can wrap a spend key on Solana and Stellar, or schedule one add-signer on Starknet, and the docs describe that path as non-custodial and not trustless. Exchange, on-ramp, fiat payments, and any service that transfers crypto on behalf of clients are separate activities under the rules above. Whether a specific integration is licensed is a question for counsel in each jurisdiction where the product has users.',
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
        device: 'Recital 83 says hardware or software providers of non-custodial wallets should fall outside MiCA. The operative test remains Article 3(1)(17).',
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
        shared: 'PS26/12 prices the permission to safeguard. It does not publish a separate category for shared keys.',
        device: 'PS26/12 does not state a general exemption for non-custodial software. Whether a design is “safeguarding” is a facts question.',
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
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                        Last updated {UPDATED}
                    </p>
                    <h1 className="mt-4 text-balance text-[clamp(2.5rem,6vw,4.6rem)] font-medium leading-[0.98] tracking-[-0.045em]">
                        When an embedded wallet makes your app a custodian.
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
                        Custody of someone else’s crypto is a licensed financial service in the
                        European Union, under US federal money-transmission rules, in California,
                        and, from 25 October 2027, in the United Kingdom. Latin America does not
                        share one rule. Argentina excludes exclusive self-custody wallet providers
                        and still requires USD 150,000 of net worth to custody. Brazil requires
                        prior authorization to guard or control the keys. Costa Rica, since 19
                        September 2026, requires SUGEF registration to custody or control virtual
                        assets as a business, and that registration is not an operating license.
                        The trigger, where a text states one, is control of the assets or of the
                        keys.
                    </p>
                </header>

                <aside className="mt-10 max-w-3xl rounded-2xl border border-line bg-surface px-6 py-5 text-sm leading-relaxed text-muted">
                    This page quotes and paraphrases public legal texts so a founder can see the
                    cost of custody before talking to counsel. It is not legal advice, not a
                    determination that any product — including Cavos — is inside or outside a
                    license, and not a complete survey of every jurisdiction. Figures were checked
                    against the sources at the bottom on {UPDATED}.
                </aside>

                <section className="mt-16 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">The test is control</h2>
                    <p className="mt-5 text-base leading-relaxed text-muted">
                        These four texts ask the same question: can someone other than the owner
                        safekeep the assets or cause them to move? Latin America answers it
                        country by country, in the section below.
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
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Three builds, four regimes</h2>
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
                        “Embedded” describes where the wallet sits in the app. It does not say who
                        can sign. The middle column is the one most often mislabeled: a provider
                        that holds a key required to spend, or that can move funds on its own, is
                        judged on that power. The Latin American texts do not fit one extra column,
                        so they are cited on their own below.
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
                            Recital 83 states that hardware or software providers of non-custodial
                            wallets should not fall within the scope of the Regulation. A recital
                            guides interpretation. It does not rewrite Article 3(1)(17): a business
                            that safekeeps or controls client assets or private keys is providing
                            custody, whatever it calls the product.
                        </p>
                        <p>
                            Custody is not the only in-scope service. Article 3(1)(26) defines
                            transfer services on behalf of clients as transferring crypto-assets,
                            on behalf of a person, from one distributed-ledger address or account
                            to another. That service sits in Annex IV Class 1, with a EUR 50,000
                            minimum, even when the provider is not a custodian. Whether a relayer
                            that broadcasts a user-signed transaction is “providing” that service
                            is a facts question the Regulation does not answer with an example.
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
                        Those dollar figures are the law firm’s estimates. Build a budget from
                        current state requirements before relying on them. State statutes differ on
                        when virtual-currency activity is money transmission; this page does not
                        restate all fifty.
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
                                That measure is the value of the assets, which is the statutory
                                wording. It is not a revenue cap.
                            </li>
                        </ul>
                        <p>
                            DFPI’s application guide says the Department expects an initial tangible
                            net worth of $100,000, and that it will set a final amount later under
                            Financial Code section 3207(b). Applicants must obtain a surety bond or
                            fund a trust account under section 3207(a). DFPI determines that amount.
                            The statute and the DFPI pages checked for this article do not publish a
                            single required bond figure.
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
                            PS26/12 does not publish a rule that non-custodial wallet software is
                            outside safeguarding. The capital figures apply to firms that have the
                            safeguarding permission.
                        </p>
                    </div>
                </section>

                <section className="mt-20">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Latin America: six texts, not one rule</h2>
                    <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">
                        A product with users in São Paulo, Buenos Aires, and San José is not under
                        one custody statute. Argentina writes an exclusion for exclusive
                        self-custody wallet providers. Brazil prices custody as a licensed
                        activity with a capital formula. Costa Rica registers the activity for
                        anti-money-laundering supervision and says that registration is not an
                        operating authorization. None of the other texts below copies Argentina’s
                        exclusion.
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
                                    <td className="border-l border-line px-5 py-5 align-top leading-relaxed text-muted">The Chamber of Representatives records the bill as archived under article 190 of Law 5 of 1992. That bill did not become a license. This page does not survey other Colombian rules.</td>
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
                                minimum net worth for categories 1, 2, and 4 at USD 150,000. If
                                custodied volume over the last 12 months is under USD 2,500,000,
                                the minimum is 50% of that figure. A firm in more than one category
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
                                service. Item IV is custody or administration of virtual assets or
                                of instruments that enable control over them. The law does not copy
                                Argentina’s self-custody exclusion.
                            </p>
                            <p className="mt-3">
                                Resolução BCB 520, of 10 November 2025, is in force on 2 February
                                2026 (article 92). Article 9 says custody comprises, among other
                                activities, “a guarda e o controle dos instrumentos que afetam o
                                exercício dos direitos,” and gives private keys as the example.
                                Societies already performing those activities on the effective date
                                must request authorization within 270 days counted from 2 February
                                2026 (article 88). Adding 270 days to that date lands on 30 October
                                2026. The resolution states the 270-day count and does not print
                                that calendar date.
                            </p>
                            <p className="mt-3">
                                Capital is Resolução Conjunta 14, articles 8 to 10, not a single
                                published minimum. The minimum paid-in capital and net worth is a
                                cost parcel plus an activity parcel. The cost parcel is R$2,000,000
                                times the number of operational-activity categories. The activity
                                parcel assigns R$3,000,000 to “custódia e administração de recursos
                                de terceiros,” then multiplies the sum of operational categories by
                                a funding factor: 60% for own resources, 80% for institutional
                                resources, 120% for public resources other than deposits, and 200%
                                for deposits. Classification uses the highest factor among funding
                                sources the applicable regulation permits, even if unused.
                                Resolução BCB 517, article 3(III), places a sociedade prestadora de
                                serviços de ativos virtuais in the modalidade custodiante in the
                                custody category associated with that R$3,000,000 line.
                            </p>
                            <p className="mt-3">
                                An illustration, not a figure the statute prints as “the” minimum: a
                                custodian in only that operational category, with no investment
                                activity, has an activity parcel of R$3,000,000 times the funding
                                factor, plus a cost parcel of R$2,000,000. At the 60% factor the
                                activity parcel is R$1,800,000, and those two parcels sum to
                                R$3,800,000. Article 9(II) adds R$5,000,000, and more for extra
                                modalities up to R$10,000,000 on that sub-parcel, only when the
                                institution provides a computing service listed in Resolução BCB
                                517, article 4. Virtual-asset custody is not itself on that list.
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
                                decree does not print that threshold, and it does not print a
                                minimum capital. Refusal to register is a ground for a fine of two
                                to one hundred base salaries, as defined in article 2 of Law 7337.
                                If the virtual-asset activity is also a matter another financial
                                superintendency regulates, that supervision applies as well.
                            </p>
                            <p className="mt-3">
                                Article 15 quater does not exclude self-custody wallet software.
                                CONASSIF is the body that sets the scope of the listed activities
                                by regulation. This page does not cite a published CONASSIF rule
                                that carves that software out.
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
                                Diario Oficial on 16 July 2025. That is an anti-money-laundering
                                reporting duty. It is not a license to custody, and it does not
                                exclude software that provides the means to store or transfer.
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
                                by the Comisión para el Mercado Financiero is reached. The amount
                                is the one the Commission sets. The articles cited here do not
                                publish a self-custody software exemption, and they do not publish
                                a fixed capital number for crypto custody.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium tracking-[-0.02em] text-ink">Colombia</h3>
                            <p className="mt-3">
                                The Chamber of Representatives’ file for Proyecto de Ley 510/2025C,
                                “por la cual se regulan los proveedores de servicios de activos
                                virtuales,” records the bill as archived under article 190 of Law 5
                                of 1992. Archiving means that bill did not become a custody
                                license. This page does not treat that as a finding that no other
                                Colombian rule applies.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-20 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">The international AML frame</h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            FATF’s October 2021 guidance is the document national AML regimes
                            implement, not a license by itself. Paragraph 41 says safekeeping and
                            administration includes persons that have exclusive or independent
                            control of the private key associated with virtual assets belonging to
                            another person. Paragraph 48 says FATF does not seek to regulate, as
                            virtual asset service providers, hardware wallet manufacturers and
                            providers of non-custodial wallets, to the extent they do not also
                            engage in or facilitate covered activities as a business on behalf of
                            customers. Covered activities include exchange, transfer, and
                            safekeeping.
                        </p>
                    </div>
                </section>

                <section className="mt-20 max-w-3xl">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">What Cavos documents, and what this page does not decide</h2>
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                        <p>
                            Cavos’s concepts page states a product invariant: the Cavos backend
                            must not possess authority that can move user funds or enroll itself as
                            a signer. On Solana, the relayer is described as a fee payer and not a
                            spender. Registries, recovery services, paymasters, and relayers
                            coordinate, fund, or submit transactions. The docs say none of those
                            roles substitutes for user authorization.
                        </p>
                        <p>
                            Opt-in hardware-isolated recovery is a different path, and the recovery
                            page is explicit about it. On Solana and Stellar the enclave seals and
                            unwraps a MasterDEK from which the spend key is derived. The page says
                            compromise of that wrap means the spend key can be restored. On
                            Starknet the enclave may schedule one <span className="font-mono text-[13px]">add_signer</span>,
                            with the contract enforcing nonce, expiry, timelock, cancellation, and
                            finalization. The docs call this hardware-isolated and non-custodial,
                            and they say it is not trustless: the measured enclave image and AWS
                            attestation are part of what a user relies on. A Cavos employee is
                            described as having no key to hand over, because the key material is
                            sealed to the enclave measurement.
                        </p>
                        <p>
                            A regulator applying Article 3(1)(17), FinCEN’s total-independent-control
                            test, or California’s definition of control has to look at that recovery
                            path as well as the ordinary spend path. This page does not conclude
                            that either path, or an application that integrates Cavos, is outside
                            any license. Exchange, fiat on-ramps, and payments remain their own
                            activities even when the wallet itself is user-signed.
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
                        Hosted custody is the structure the texts above describe when the business
                        must move a user’s assets without that user producing a signature: automated
                        payouts, an exchange balance, or a treasury the company operates. Those
                        products take on the capital, liability, segregation, and licensing duties
                        quoted here. A wallet in which only an enrolled device can authorize a
                        spend is a different structure, and it still leaves every other activity
                        the company performs — exchange, on-ramp, transfer for clients — to be
                        classified on its own facts.
                    </p>
                </section>

                <section className="mt-20" id="faq">
                    <h2 className="text-3xl font-medium tracking-[-0.03em]">Frequently asked</h2>
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
                        Primary texts first. The Astraea ranges are estimates from a law-firm
                        article, included because teams ask what a US licensing effort costs, and
                        labeled as estimates because they are not fees set by statute.
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
                        <h2 className="text-2xl font-medium">Read the signing model before you integrate.</h2>
                        <p className="mt-2 max-w-xl text-sm text-white/70">
                            The quickstart shows the device signer. Counsel in each user
                            jurisdiction still classifies the rest of the product.
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
