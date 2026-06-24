import Link from 'next/link';

const SNIPPET = `import { Cavos } from "@cavos/kit";

const cavos = await Cavos.connect({
  network: "sepolia",
  identity: { userId, email },
  appSalt: "my-app",
  paymasterApiKey,
});

await cavos.execute(calls); // gasless`;

const TOPICS: {
  label: string;
  href: string;
  desc: string;
  tag?: string;
}[] = [
  {
    label: 'Quickstart',
    href: '/docs/quickstart',
    desc: 'Install @cavos/kit and ship a gasless transaction in five lines.',
    tag: 'Start here',
  },
  {
    label: 'Authentication',
    href: '/docs/auth',
    desc: 'Bring your own identity, or use hosted Google / Apple / OTP login.',
  },
  {
    label: 'Signing & gasless',
    href: '/docs/signing',
    desc: 'Silent secp256r1 signing and paymaster-sponsored execution.',
  },
  {
    label: 'Multi-device',
    href: '/docs/multi-device',
    desc: 'Add a new device to an existing wallet with on-chain approval.',
  },
  {
    label: 'Recovery',
    href: '/docs/recovery',
    desc: 'Passphrase-derived backup signer — non-custodial after device loss.',
  },
  {
    label: 'API reference',
    href: '/docs/api-reference',
    desc: 'Every export in the package, with types and signatures.',
  },
];

const VALUES: { term: string; desc: string }[] = [
  {
    term: 'No seed phrases',
    desc: 'A non-extractable device key signs invisibly. The user never sees a private key.',
  },
  {
    term: 'MPC-free',
    desc: 'No key sharding, no signing servers. The key is whole and on the device.',
  },
  {
    term: 'Verifiable on-chain',
    desc: 'Signatures are checked by the account contract, not trusted from a backend.',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div>
            <h1 className="text-balance text-[clamp(1.875rem,2.8vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.02em] text-ink">
              Device-native
              <br />
              smart accounts.
            </h1>

            <p className="mt-6 max-w-md text-pretty text-[1.05rem] leading-relaxed text-muted">
              Turn a login into a self-custodial smart-account wallet controlled
              by a silent device key. No seed phrases, no MPC, gasless. Docs
              built for agents — paste them into an LLM and build.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/docs"
                className="inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
              >
                Read the docs
              </Link>
              <Link
                href="/docs/quickstart"
                className="inline-flex items-center rounded-lg border border-line-strong bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface"
              >
                Quickstart →
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-muted">
              <span>
                <span className="text-ink/40">$</span> npm i @cavos/kit
              </span>
              <a
                href="/llms-full.txt"
                className="text-muted transition-colors hover:text-brand"
              >
                /llms-full.txt
              </a>
              <a
                href="/llms.txt"
                className="text-muted transition-colors hover:text-brand"
              >
                /llms.txt
              </a>
            </div>
          </div>

          {/* Dark code window */}
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-[#2c2654] bg-[#181430] shadow-[0_24px_48px_-24px_rgba(64,42,255,0.4)]">
              <div className="flex items-center gap-2 border-b border-[#2c2654] bg-[#211c40] px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="ml-2 font-mono text-[11px] text-[#b9b4e6]">
                  connect.ts
                </span>
              </div>
              <pre className="overflow-x-auto px-5 py-5 font-mono text-[13px] leading-relaxed text-[#e1e4e8]">
                <code>{SNIPPET}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Start building — framed topic grid ───────────── */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
              Start building
            </h2>
            <p className="mt-2 max-w-md text-pretty leading-relaxed text-muted">
              Guides and reference for integrating{' '}
              <span className="font-mono text-[0.9em] text-brand">
                @cavos/kit
              </span>
              .
            </p>
          </div>
          <Link
            href="/docs"
            className="hidden shrink-0 text-sm font-medium text-brand hover:text-brand-hover sm:inline"
          >
            All docs →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 divide-x divide-y divide-line overflow-hidden rounded-xl border border-line sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative flex flex-col gap-2 p-6 transition-colors hover:bg-surface"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
                  {t.label}
                </h3>
                {t.tag && (
                  <span className="rounded-full border border-brand/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-brand">
                    {t.tag}
                  </span>
                )}
              </div>
              <p className="text-pretty text-[13.5px] leading-relaxed text-muted">
                {t.desc}
              </p>
              <span className="mt-1 text-sm text-brand opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why it's different ───────────────────────────── */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-px overflow-hidden px-6 py-16 sm:grid-cols-3 sm:gap-12">
          {VALUES.map((v) => (
            <div key={v.term}>
              <div className="h-px w-8 bg-brand" />
              <h3 className="mt-4 text-base font-semibold tracking-[-0.02em] text-ink">
                {v.term}
              </h3>
              <p className="mt-2 text-pretty text-[14px] leading-relaxed text-muted">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Built for agents ─────────────────────────────── */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">
            Built for agents
          </h2>
          <p className="mt-2 max-w-lg text-pretty leading-relaxed text-muted">
            Every page is available as plain text. Pipe the whole site into an
            LLM and let it write your integration.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <a
            href="/llms-full.txt"
            className="inline-flex items-center rounded-lg border border-line-strong bg-white px-4 py-2.5 font-mono text-xs text-ink transition-colors hover:border-brand hover:text-brand"
          >
            /llms-full.txt
          </a>
          <Link
            href="/docs/for-agents"
            className="inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Read the guide →
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cavos-mark.png" alt="" className="h-4 w-auto" />
            <span className="font-semibold tracking-[-0.02em] text-ink">
              Cavos
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="hover:text-ink">
              Docs
            </Link>
            <a href="https://cavos.xyz" className="hover:text-ink">
              cavos.xyz
            </a>
            <span className="text-line-strong">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
