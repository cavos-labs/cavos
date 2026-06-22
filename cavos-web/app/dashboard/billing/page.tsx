'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { useRouter } from 'next/navigation';
import { tokenizeOnvoCard } from '@/lib/onvo-client';

interface PlanUsage {
    tier: 'free' | 'pro' | 'custom';
    status: 'active' | 'past_due' | 'canceled';
    /** Wallet count for the org, summed across all apps + networks. `-1` = unlimited. */
    count: number;
    /** Wallet limit. `null` = unlimited (pro / custom without cap). */
    limit: number | null;
    /** `'approaching_limit'` at ≥80% on a capped plan. */
    warning: 'approaching_limit' | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
}

const TIER_LABEL: Record<PlanUsage['tier'], string> = { free: 'Free', pro: 'Pro', custom: 'Custom' };

function formatDate(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<PlanUsage | null>(null);
    const [planError, setPlanError] = useState<string | null>(null);
    const [showUpgradeForm, setShowUpgradeForm] = useState(false);
    const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [card, setCard] = useState({ number: '', expiry: '', cvc: '', holderName: '', email: '' });

    const router = useRouter();

    const fetchData = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/login'); return; }

        try {
            const statusRes = await fetch('/api/billing/status', { cache: 'no-store' });
            if (statusRes.ok) {
                const s = await statusRes.json() as {
                    plan_tier: PlanUsage['tier'];
                    status: PlanUsage['status'];
                    wallet_count: number;
                    wallet_limit: number | null;
                    warning: PlanUsage['warning'];
                    current_period_end: string | null;
                    cancel_at_period_end?: boolean;
                };
                setPlan({
                    tier: s.plan_tier,
                    status: s.status,
                    count: s.wallet_count,
                    limit: s.wallet_limit,
                    warning: s.warning,
                    current_period_end: s.current_period_end,
                    cancel_at_period_end: s.cancel_at_period_end ?? false,
                });
                setPlanError(null);
            } else {
                setPlanError('Could not load plan usage. Refresh to retry.');
            }
        } catch {
            setPlanError('Could not load plan usage. Refresh to retry.');
        }
        setLoading(false);
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpgrade = async () => {
        const publicKey = process.env.NEXT_PUBLIC_ONVO_PUBLIC_KEY;
        if (!publicKey) {
            setCheckoutError('Payments are not configured. Contact support to upgrade.');
            setCheckoutStatus('error');
            return;
        }
        if (!card.number || !card.expiry || !card.cvc || !card.holderName || !card.email) {
            setCheckoutError('Fill in all card details.');
            setCheckoutStatus('error');
            return;
        }

        setCheckoutStatus('submitting');
        setCheckoutError(null);
        try {
            // Tokenize browser-side — raw card data never hits our server. Onvo
            // also creates/associates a customer for the card.
            const { paymentMethodId, customerId } = await tokenizeOnvoCard(publicKey, card);

            // plan_tier is NOT flipped here — the Onvo renewal webhook does that.
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethodId, customerId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Checkout failed.');

            setCheckoutStatus('done');
            await fetchData();
            setTimeout(() => {
                setCheckoutStatus('idle');
                setShowUpgradeForm(false);
                setCard({ number: '', expiry: '', cvc: '', holderName: '', email: '' });
            }, 3000);
        } catch (err) {
            setCheckoutError(err instanceof Error ? err.message : 'Checkout failed.');
            setCheckoutStatus('error');
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Cancel Pro? You keep Pro until the end of the current billing period, then drop to Free.')) return;
        setNotice(null);
        try {
            const res = await fetch('/api/billing/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not cancel subscription.');
            setNotice(data.reason || 'Your Pro plan will not renew.');
            await fetchData();
        } catch (err) {
            setNotice(err instanceof Error ? err.message : 'Could not cancel subscription.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-7 h-7 border-2 border-black/15 border-t-black/60 rounded-full animate-spin" />
            </div>
        );
    }

    const tier = plan?.tier ?? 'free';
    const renewal = formatDate(plan?.current_period_end ?? null);
    const usagePct = plan && plan.limit ? Math.min(100, (plan.count / plan.limit) * 100) : 0;

    return (
        <div className="space-y-7 animate-fadeIn max-w-4xl">

            <PageHeader
                eyebrow="Billing"
                title="Plan &amp; Billing"
                subtitle="Your subscription, wallet usage, and available plans."
            />

            {/* ── Current plan — light, compact panel ── */}
            <section data-dash-panel className="rounded-2xl bg-white border border-line p-6 md:p-7">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">Current plan</span>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight text-ink">{plan ? TIER_LABEL[tier] : '—'}</h2>
                            {plan && (
                                <Badge
                                    variant={
                                        plan.cancel_at_period_end ? 'warning'
                                        : plan.status === 'past_due' ? 'warning'
                                        : plan.status === 'active' && tier !== 'free' ? 'success'
                                        : plan.warning === 'approaching_limit' ? 'warning'
                                        : 'neutral'
                                    }
                                >
                                    {plan.cancel_at_period_end ? 'Cancels at period end'
                                        : tier === 'free' ? (plan.warning === 'approaching_limit' ? 'Near limit' : 'Free plan')
                                        : plan.status === 'active' ? 'Active'
                                        : plan.status === 'past_due' ? 'Past due' : 'Canceled'}
                                </Badge>
                            )}
                        </div>
                        {tier !== 'free' && renewal && (
                            <p className="text-xs text-black/45 font-medium">
                                {plan?.cancel_at_period_end ? 'Access until' : 'Renews'} {renewal}
                            </p>
                        )}
                    </div>

                    {/* Plan CTA */}
                    {plan && tier === 'free' && (
                        <button
                            type="button"
                            disabled
                            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-ink/40 text-white text-sm font-semibold rounded-xl cursor-not-allowed"
                        >
                            <Icon.Bolt size={15} weight="fill" />
                            Upgrade to Pro — Coming soon
                        </button>
                    )}
                    {plan && tier === 'pro' && !plan.cancel_at_period_end && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 border border-line text-black/60 text-sm font-semibold rounded-xl hover:bg-surface hover:text-ink transition-all active:scale-[0.97]"
                        >
                            Cancel plan
                        </button>
                    )}
                </div>

                {/* Usage */}
                <div className="mt-6 space-y-2 max-w-md">
                    {planError ? (
                        <p className="text-xs text-red-600">{planError}</p>
                    ) : !plan ? (
                        <div className="space-y-2">
                            <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden"><div className="h-full w-1/3 bg-black/15 rounded-full" /></div>
                            <div className="h-3 w-40 bg-black/[0.06] rounded" />
                        </div>
                    ) : plan.limit === null ? (
                        <p className="text-sm text-black/55">
                            {plan.count === -1
                                ? 'Unlimited wallets on your plan.'
                                : <>You&apos;ve created <span className="tabular-nums font-semibold text-ink">{plan.count.toLocaleString()}</span> wallets — unlimited on your plan.</>}
                        </p>
                    ) : plan.count === 0 ? (
                        <p className="text-sm text-black/55">
                            No wallets yet. Your free plan includes <span className="tabular-nums font-semibold text-ink">{plan.limit.toLocaleString()}</span>.
                        </p>
                    ) : (
                        <>
                            <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${plan.warning ? 'bg-amber-500' : 'bg-ink'}`}
                                    style={{ width: `${usagePct}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-semibold text-black/45">
                                <span className="tabular-nums">{plan.count.toLocaleString()} / {plan.limit.toLocaleString()} wallets</span>
                                {plan.warning && <span className="text-amber-600">Approaching limit</span>}
                            </div>
                        </>
                    )}
                </div>

                {notice && (
                    <div className="mt-5 flex items-start gap-2 p-3 rounded-xl bg-surface border border-line text-xs text-black/65">
                        <Icon.CheckCircle size={15} weight="fill" className="shrink-0 mt-px text-emerald-500" />
                        <span>{notice}</span>
                    </div>
                )}

                <p className="mt-5 text-[11px] text-black/40 leading-relaxed max-w-xl">
                    Wallet count is the sum across every app and network your organization owns.
                    Creating new wallets is gated at the limit; existing wallets always keep working.
                    {tier === 'custom' && ' Your plan is managed under a custom contract.'}
                </p>
            </section>

            {/* ── Upgrade card form (Free tier only) ── */}
            {showUpgradeForm && tier === 'free' && (
                <div className="rounded-2xl bg-white border border-line p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold">Upgrade to Pro — $99/mo</h3>
                        <button
                            onClick={() => { setShowUpgradeForm(false); setCheckoutStatus('idle'); setCheckoutError(null); }}
                            className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors rounded-lg hover:bg-black/5"
                        >
                            <Icon.Close size={16} weight="bold" />
                        </button>
                    </div>

                    <p className="text-xs text-black/50 leading-relaxed">
                        Unlimited wallets across all your apps. Cancel anytime. Card details are tokenized in your
                        browser and never reach our server.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { key: 'holderName', label: 'Cardholder name', placeholder: 'Jane Doe', span: true, type: 'text', mode: undefined, auto: 'cc-name' },
                            { key: 'email', label: 'Email', placeholder: 'you@company.com', span: true, type: 'email', mode: undefined, auto: 'email' },
                            { key: 'number', label: 'Card number', placeholder: '4242 4242 4242 4242', span: true, type: 'text', mode: 'numeric', auto: 'cc-number' },
                            { key: 'expiry', label: 'Expiry', placeholder: 'MM/YY', span: false, type: 'text', mode: 'numeric', auto: 'cc-exp' },
                            { key: 'cvc', label: 'CVC', placeholder: '123', span: false, type: 'text', mode: 'numeric', auto: 'cc-csc' },
                        ].map((f) => (
                            <div key={f.key} className={`space-y-1.5 ${f.span ? 'sm:col-span-2' : ''}`}>
                                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40 block">{f.label}</label>
                                <input
                                    type={f.type}
                                    inputMode={f.mode as React.HTMLAttributes<HTMLInputElement>['inputMode']}
                                    autoComplete={f.auto}
                                    placeholder={f.placeholder}
                                    value={card[f.key as keyof typeof card]}
                                    onChange={(e) => setCard({ ...card, [f.key]: e.target.value })}
                                    className="w-full h-10 px-3 rounded-lg bg-surface border border-line text-sm text-ink placeholder:text-black/30 focus:outline-none focus:border-ink/30 focus:bg-white transition-colors tabular-nums"
                                />
                            </div>
                        ))}
                    </div>

                    {checkoutStatus === 'error' && checkoutError && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                            <Icon.Warning size={14} weight="fill" className="shrink-0" />
                            <span>{checkoutError}</span>
                        </div>
                    )}
                    {checkoutStatus === 'done' && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                            <Icon.CheckCircle size={14} weight="fill" className="shrink-0" />
                            <span>Subscription created. Your plan updates to Pro once Onvo confirms the charge.</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleUpgrade}
                        disabled={checkoutStatus === 'submitting'}
                        className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 bg-ink text-white text-sm font-semibold rounded-xl hover:bg-ink/90 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {checkoutStatus === 'submitting'
                            ? <><Icon.Spinner size={15} weight="bold" className="animate-spin" /> Processing…</>
                            : <><Icon.Bolt size={15} weight="fill" /> Start Pro — $99/mo</>}
                    </button>
                </div>
            )}

            {/* ── Plans comparison ── */}
            <PlansComparison tier={tier} onUpgrade={() => { setShowUpgradeForm(true); setCheckoutStatus('idle'); setCheckoutError(null); }} />
        </div>
    );
}

/* ── Plans comparison ───────────────────────────────────────────
   Three tiers, each visually distinct (not an identical card grid):
   Free is the baseline, Pro is the emphasized brand tier, Custom is
   the contact-sales lane. The current tier is marked inline. */

interface TierDef {
    id: PlanUsage['tier'];
    name: string;
    price: string;
    cadence: string;
    blurb: string;
    features: string[];
}

const TIERS: TierDef[] = [
    {
        id: 'free', name: 'Free', price: '$0', cadence: 'forever',
        blurb: 'Everything you need to ship.',
        features: ['Up to 1,000 wallets', 'OAuth + session keys', 'Gasless paymaster', 'All core SDK features', 'Community support'],
    },
    {
        id: 'pro', name: 'Pro', price: '$99', cadence: 'per month',
        blurb: 'For apps growing past the free tier.',
        features: ['Unlimited wallets', 'Everything in Free', 'Higher rate limits', 'Priority support', 'Cancel anytime'],
    },
    {
        id: 'custom', name: 'Custom', price: "Let's talk", cadence: 'tailored',
        blurb: 'Volume, compliance, and SLAs.',
        features: ['Volume-based pricing', 'Dedicated infrastructure', 'Invoicing & contracts'],
    },
];

function PlansComparison({ tier, onUpgrade }: { tier: PlanUsage['tier']; onUpgrade: () => void }) {
    return (
        <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40 px-1">Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line rounded-2xl border border-line overflow-hidden">
                {TIERS.map((t) => {
                    const isCurrent = t.id === tier;
                    const isPro = t.id === 'pro';
                    return (
                        <div
                            key={t.id}
                            className={`relative flex flex-col p-6 ${isPro ? 'bg-surface' : 'bg-white'}`}
                        >
                            <div className="flex items-center justify-between gap-2 min-h-[22px]">
                                <h3 className="text-sm font-bold tracking-tight text-ink">{t.name}</h3>
                                {isPro && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-ink text-white text-[9px] font-bold uppercase tracking-[0.12em]">
                                        Popular
                                    </span>
                                )}
                            </div>

                            <p className="mt-1.5 text-xs text-black/45 leading-relaxed">{t.blurb}</p>

                            <div className="mt-5 flex items-baseline gap-1.5">
                                <span className="text-[26px] font-bold tracking-tight text-ink leading-none">{t.price}</span>
                                <span className="text-xs font-medium text-black/35">{t.cadence}</span>
                            </div>

                            <div className="mt-5 h-px bg-line" />

                            <ul className="mt-5 space-y-2.5 flex-1">
                                {t.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2.5 text-sm">
                                        <Icon.Check size={14} weight="bold" className="shrink-0 mt-1 text-ink/70" />
                                        <span className="text-black/65">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6">
                                {isCurrent ? (
                                    <div className="inline-flex items-center justify-center gap-1.5 w-full h-10 rounded-xl text-sm font-semibold bg-surface border border-line text-black/45">
                                        <Icon.Check size={14} weight="bold" /> Current plan
                                    </div>
                                ) : t.id === 'pro' ? (
                                    <button
                                        disabled
                                        className="w-full h-10 inline-flex items-center justify-center gap-1.5 bg-ink/40 text-white text-sm font-semibold rounded-xl cursor-not-allowed"
                                    >
                                        <Icon.Bolt size={14} weight="fill" /> Coming soon
                                    </button>
                                ) : t.id === 'custom' ? (
                                    <a
                                        href="/contact-sales"
                                        className="w-full h-10 inline-flex items-center justify-center gap-1.5 border border-ink/80 text-ink text-sm font-semibold rounded-xl hover:bg-ink hover:text-white transition-all active:scale-[0.98]"
                                    >
                                        Contact sales <Icon.ArrowRight size={14} weight="bold" />
                                    </a>
                                ) : (
                                    <div className="inline-flex items-center justify-center w-full h-10 rounded-xl text-sm font-medium bg-surface border border-line text-black/40">
                                        Included
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
