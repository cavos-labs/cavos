/* ──────────────────────────────────────────────────────────────
   FeaturesGrid — Cavos framed-grid bento. Hairline gridlines (not
   floating gradient cards), white surfaces, sharp indigo accents,
   technical dot-grid. Layered mockups bleed off each cell edge.
   Dependency-free server component.
   ────────────────────────────────────────────────────────────── */

/* ── Tiny inline glyphs ──────────────────────────────────────── */
function GoogleG() {
    return (
        <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3C39.9 36 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z" />
        </svg>
    )
}

/* ════════════════════════════════════════════════════════════
   CELL SHELL — a framed grid cell, no floating card / no glyph
   ════════════════════════════════════════════════════════════ */
interface CellProps {
    title: string
    body: string
    className?: string
    children: React.ReactNode
}
function Cell({ title, body, className = '', children }: CellProps) {
    return (
        <div className={`group relative flex flex-col overflow-hidden bg-white ${className}`}>
            {/* faint technical dot-grid + corner indigo wash for depth */}
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-[0.3] [mask-image:linear-gradient(to_bottom,transparent,black_45%)]" />
            <div className="relative z-10 px-7 pt-8 md:px-9 md:pt-9">
                <h3 className="text-[1.1875rem] font-medium leading-tight tracking-[-0.025em] text-ink md:text-[1.3125rem]">{title}</h3>
                <p className="mt-2.5 max-w-[40ch] text-[13.5px] leading-relaxed text-muted">{body}</p>
            </div>
            <div className="relative z-10 mt-auto flex-1">{children}</div>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════
   MOCKUPS
   ════════════════════════════════════════════════════════════ */

/* 1 · Hero (wide) — identity→account transform, rendered as a precise
   hairline ledger (not a browser-window screenshot collage) */
function AppleGlyph() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="text-ink">
            <path d="M16.36 12.78c.02 2.3 2.02 3.06 2.04 3.07-.02.05-.32 1.1-1.05 2.18-.63.93-1.29 1.86-2.32 1.88-1.01.02-1.34-.6-2.5-.6-1.15 0-1.51.58-2.47.62-1 .04-1.76-1-2.4-1.93-1.3-1.9-2.3-5.35-.96-7.69.66-1.16 1.85-1.9 3.14-1.92.98-.02 1.9.66 2.5.66.6 0 1.72-.82 2.9-.7.49.02 1.88.2 2.77 1.5-.07.05-1.65.97-1.63 2.9M14.5 6.2c.53-.64.89-1.54.79-2.43-.76.03-1.69.51-2.24 1.15-.49.56-.92 1.47-.8 2.34.85.07 1.71-.43 2.25-1.06" />
        </svg>
    )
}

function MockupAccount() {
    const row = 'flex items-center'
    return (
        <div className="relative h-[300px] md:h-[330px]">
            {/* one flat credential ledger, anchored to the bottom, bleeding off */}
            <div className="absolute inset-x-5 bottom-0 rounded-t-2xl border border-b-0 border-line bg-white px-6 pb-7 pt-6 shadow-[0_-1px_50px_-30px_rgba(10,10,15,0.45)] md:inset-x-8 md:px-7">

                {/* input → output, side by side on one surface */}
                <div className="flex items-stretch gap-4 md:gap-6">
                    {/* INPUT — OAuth identity */}
                    <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">identity</p>
                        <div className={`${row} mt-2.5 gap-2`}>
                            <span className="flex -space-x-1.5">
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-white ring-1 ring-line"><GoogleG /></span>
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-white ring-1 ring-line"><AppleGlyph /></span>
                            </span>
                            <span className="truncate text-[12.5px] font-medium text-ink">jamie@studio.xyz</span>
                        </div>
                    </div>

                    {/* transform arrow */}
                    <div className="flex shrink-0 items-center self-center pt-4 text-brand">
                        <svg width="26" height="14" viewBox="0 0 26 14" fill="none" aria-hidden>
                            <path d="M1 7h22m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* OUTPUT — smart account */}
                    <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">smart account</p>
                        <div className={`${row} mt-2.5 gap-2`}>
                            <span className="font-mono text-[15px] font-medium tracking-tight text-ink">0x04a3…b7f9</span>
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* attribute footer */}
                <div className={`${row} mt-6 gap-1.5 border-t border-line pt-4`}>
                    {['self-custodial', 'SRC-6', 'gas abstracted'].map((c) => (
                        <span key={c} className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink/50">{c}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* 2 · Gas (narrow) — light cards, indigo chart */
function MockupGas() {
    const bars = [26, 38, 32, 48, 42, 60, 53, 74, 66, 55, 47, 58, 70, 62]
    return (
        <div className="relative h-[330px] md:h-[360px]">
            <div className="absolute left-7 top-2 right-7 rounded-xl border border-line bg-white p-4 shadow-[0_20px_44px_-26px_rgba(10,10,15,0.3)] md:left-9 md:right-9">
                <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-ink/55">Network fee</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">Gasless</span>
                </div>
                <p className="mt-1.5 text-[24px] font-semibold tracking-tight text-ink">$0.00</p>
                <p className="text-[11px] text-emerald-600">Sponsored · user pays nothing</p>
            </div>
            <div className="absolute -bottom-5 left-7 right-7 rounded-xl border border-line bg-white p-4 shadow-[0_20px_44px_-26px_rgba(10,10,15,0.3)] md:left-9 md:right-9">
                <p className="text-[11px] font-medium text-ink/40">Sponsored transactions · 30d</p>
                <p className="text-[16px] font-semibold tracking-tight text-ink">128,400</p>
                <div className="mt-3 flex h-16 items-end gap-1">
                    {bars.map((h, i) => (
                        <div key={i} className="flex-1 rounded-[2px] bg-brand/85" style={{ height: `${h}%` }} />
                    ))}
                </div>
            </div>
        </div>
    )
}

/* 3 · Session keys */
function MockupSessionKeys() {
    return (
        <div className="relative h-[250px]">
            <div className="absolute -bottom-4 left-7 right-7 rounded-xl border border-line bg-white p-4 shadow-[0_18px_40px_-26px_rgba(10,10,15,0.3)] md:left-9 md:right-9">
                <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-white">
                        <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden><path d="M160 16a80 80 0 0 0-78 99L21 176a8 8 0 0 0-5 8v40a8 8 0 0 0 8 8h40a8 8 0 0 0 8-8v-16h16a8 8 0 0 0 8-8v-16h16a8 8 0 0 0 6-3l16-19A80 80 0 1 0 160 16Zm20 76a20 20 0 1 1 20-20 20 20 0 0 1-20 20Z" /></svg>
                    </span>
                    <div className="leading-tight">
                        <p className="text-[12.5px] font-medium text-ink">Session key</p>
                        <p className="font-mono text-[10px] text-ink/40">agent · 0x91c…2e</p>
                    </div>
                    <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-[10px] font-semibold text-ink/70 ring-1 ring-line"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Active</span>
                </div>
                <div className="mt-3 space-y-1.5">
                    {[['Spend limit', '250 USDC / day'], ['Allowed contracts', '3 whitelisted'], ['Expires', 'in 24h']].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between rounded-lg bg-surface px-3 py-1.5 text-[11.5px] ring-1 ring-line">
                            <span className="text-ink/45">{k}</span>
                            <span className="font-medium text-ink">{v}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* 4 · Non-custodial — passkey authorization sheet, monochrome */
function MockupVerify() {
    return (
        <div className="relative h-[250px]">
            <div className="absolute -bottom-4 left-7 right-7 overflow-hidden rounded-xl border border-line bg-white shadow-[0_18px_40px_-26px_rgba(10,10,15,0.3)] md:left-9 md:right-9">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <p className="text-[12.5px] font-semibold text-ink">Authorize transaction</p>
                    <span className="text-[10px] font-medium tracking-tight text-ink/40">Self-custodial</span>
                </div>
                <div className="flex flex-col items-center px-4 pb-4 pt-5">
                    {/* Face ID glyph — thin strokes on an ink tile */}
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink text-white">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H8M16 4h1.5A2.5 2.5 0 0 1 20 6.5V8M20 16v1.5a2.5 2.5 0 0 1-2.5 2.5H16M8 20H6.5A2.5 2.5 0 0 1 4 17.5V16" />
                            <path d="M9 9.5v1M15 9.5v1M12 9.5v3l-1 1" />
                            <path d="M9 15s1.1 1.4 3 1.4 3-1.4 3-1.4" />
                        </svg>
                    </span>
                    <p className="mt-3 text-[12.5px] font-medium text-ink">Approve on your device</p>
                    <p className="mt-0.5 text-[10.5px] text-ink/45">Keys stay with the user</p>
                </div>
                <div className="flex items-center gap-2 border-t border-line bg-surface px-4 py-3">
                    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor" className="shrink-0 text-ink/55" aria-hidden><path d="M208 80h-24V56a56 56 0 0 0-112 0v24H48a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16ZM88 56a40 40 0 0 1 80 0v24H88Zm48 132v12a8 8 0 0 1-16 0v-12a20 20 0 1 1 16 0Z" /></svg>
                    <p className="text-[11px] font-medium text-ink/60">Cavos never holds your keys — non-custodial</p>
                </div>
            </div>
        </div>
    )
}

/* 5 · One SDK — dark code surface (the brand's only dark surface) */
function MockupSdk() {
    return (
        <div className="relative h-[250px]">
            <div className="absolute -bottom-4 left-7 right-7 overflow-hidden rounded-xl bg-ink shadow-[0_18px_40px_-24px_rgba(10,10,15,0.5)] md:left-9 md:right-9">
                <div className="flex items-center gap-1.5 border-b border-white/10 px-3.5 py-2.5">
                    <span className="h-2 w-2 rounded-full bg-white/20" />
                    <span className="h-2 w-2 rounded-full bg-white/20" />
                    <span className="h-2 w-2 rounded-full bg-white/20" />
                    <span className="ml-2 text-[10px] font-medium text-white/35">App.tsx</span>
                </div>
                <pre className="overflow-hidden p-4 font-mono text-[11px] leading-relaxed">
<span className="text-[#8B86FF]">import</span><span className="text-white/80"> {'{ CavosProvider }'} </span><span className="text-[#8B86FF]">from</span><span className="text-[#6EE7B7]"> &apos;cavos&apos;</span>{'\n'}
{'\n'}
<span className="text-white/40">{'<'}</span><span className="text-[#A8A4FF]">CavosProvider</span><span className="text-[#FBBF77]"> appId</span><span className="text-white/40">=</span><span className="text-[#6EE7B7]">{'{id}'}</span><span className="text-white/40">{'>'}</span>{'\n'}
<span className="text-white/40">{'  <'}</span><span className="text-[#A8A4FF]">App</span><span className="text-white/40"> {'/>'}</span>{'\n'}
<span className="text-white/40">{'</'}</span><span className="text-[#A8A4FF]">CavosProvider</span><span className="text-white/40">{'>'}</span>
                </pre>
                <div className="flex gap-2 border-t border-white/10 px-4 py-2.5">
                    <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-medium text-white/70">React</span>
                    <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-medium text-white/70">React Native</span>
                    <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-medium text-white/70">iOS · Android · Web</span>
                </div>
            </div>
        </div>
    )
}

export function FeaturesGrid() {
    return (
        <section className="px-6 py-20 md:px-16 md:py-28 lg:px-24">
            <div data-reveal className="max-w-[46rem]">
                <h2 className="text-[clamp(1.625rem,2.6vw,2.375rem)] font-medium leading-[1.14] tracking-[-0.03em] text-ink">
                    Everything to embed self-custody.{' '}
                    <span className="text-muted">
                        Social login, gas abstraction, and programmable security — built to work
                        individually or together.
                    </span>
                </h2>
            </div>

            {/* Framed bento — hairline gridlines, no gaps */}
            <div
                data-reveal
                data-reveal-group
                className="mt-12 overflow-hidden rounded-2xl border border-line md:mt-16"
            >
                {/* Row 1 — wide + narrow */}
                <div className="grid divide-y divide-line border-b border-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                    <Cell
                        className="lg:col-span-2"
                        title="Smart accounts from a social login"
                        body="Users sign in with Google or Apple and get a self-custodial smart account, deployed automatically. No extensions, no seed phrases."
                    >
                        <MockupAccount />
                    </Cell>
                    <Cell
                        title="Gas, fully abstracted"
                        body="Sponsor gas so users transact from the very first tap — no tokens, no top-ups, no friction."
                    >
                        <MockupGas />
                    </Cell>
                </div>
                {/* Row 2 — three */}
                <div className="grid divide-y divide-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                    <Cell
                        title="Programmable session keys"
                        body="Scoped keys with spend limits, allowlists, and expiries — the foundation for AI agents and automation."
                    >
                        <MockupSessionKeys />
                    </Cell>
                    <Cell
                        title="Non-custodial by design"
                        body="We never hold user keys, or any part of them. Wallets don't depend on Cavos infrastructure to keep working."
                    >
                        <MockupVerify />
                    </Cell>
                    <Cell
                        title="One SDK, every platform"
                        body="Ship the same embedded wallet across web and mobile with the React and React Native SDKs."
                    >
                        <MockupSdk />
                    </Cell>
                </div>
            </div>
        </section>
    )
}
