'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PlanUsage {
    tier: 'free' | 'essential' | 'complete' | 'pro' | 'custom';
    status: 'active' | 'past_due' | 'canceled';
    /** Wallet count for the org, summed across all apps + networks. `-1` = unlimited. */
    count: number;
    /** Wallet limit. `null` = unlimited (paid plans). */
    limit: number | null;
    /** `'approaching_limit'` at ≥80% on a capped plan. */
    warning: 'approaching_limit' | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
}

const TIER_LABEL: Record<PlanUsage['tier'], string> = {
    free: 'Free',
    essential: 'Essential',
    complete: 'Complete',
    pro: 'Pro',
    custom: 'Custom',
};

function formatDate(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<PlanUsage | null>(null);
    const [planError, setPlanError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

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

    const handleCancel = async () => {
        if (!window.confirm('Cancel your paid plan? You keep access until the end of the current billing period, then drop to Free.')) return;
        setNotice(null);
        try {
            const res = await fetch('/api/billing/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not cancel subscription.');
            setNotice(data.reason || 'Your paid plan will not renew.');
            await fetchData();
        } catch (err) {
            setNotice(err instanceof Error ? err.message : 'Could not cancel subscription.');
        }
    };

    const isPaidTier = (t: PlanUsage['tier']) => t === 'essential' || t === 'complete' || t === 'pro';

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
                eyebrow="Workspace"
                title="Plan and billing"
                subtitle="Your subscription, wallet usage, and available plans."
            />

            {/* ── Current plan — light, compact panel ── */}
            <section data-dash-panel className="rounded-2xl bg-white border border-line p-6 md:p-7">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">Current plan</span>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight text-ink">{plan ? TIER_LABEL[tier] : '—'}</h2>
                        </div>
                        {plan && (
                            <p className="text-xs text-black/45 font-medium">
                                {plan.cancel_at_period_end
                                    ? `Cancels at period end${renewal ? ` — access until ${renewal}` : ''}`
                                    : plan.status === 'past_due'
                                    ? 'Payment past due'
                                    : isPaidTier(tier) && renewal
                                    ? `Renews ${renewal}`
                                    : tier === 'free' && plan.warning === 'approaching_limit'
                                    ? 'Approaching wallet limit'
                                    : null}
                            </p>
                        )}
                    </div>

                    {/* Plan CTA */}
                    {plan && isPaidTier(tier) && !plan.cancel_at_period_end && (
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
                                    className={`h-full rounded-full transition-all ${plan.warning ? 'bg-amber-500' : 'bg-brand'}`}
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

            {/* ── Plans comparison ── */}
            <PlansComparison tier={tier} />
        </div>
    );
}

/* ── Plans comparison ───────────────────────────────────────────
   Three tiers: Free, Essential $59, Complete $139.
   Paid plans route to /contact-sales until Stripe Checkout is live. */

interface TierDef {
    id: 'free' | 'essential' | 'complete';
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
        features: ['Up to 1,000 wallets', 'Device-native wallets', 'Gas sponsorship (usage-based)', 'All core SDK features', 'Community support'],
    },
    {
        id: 'essential', name: 'Essential', price: '$59', cadence: 'per month',
        blurb: 'Unlimited wallets, on-device recovery.',
        features: ['Unlimited wallets', 'On-device recovery (passkey, code, device)', 'Gas sponsorship (usage-based)', 'Priority support', 'Cancel anytime'],
    },
    {
        id: 'complete', name: 'Complete', price: '$139', cadence: 'per month',
        blurb: 'Unlimited wallets, enclave recovery.',
        features: ['Unlimited wallets', 'Enclave recovery', 'Gas sponsorship (usage-based)', 'Priority support', 'Cancel anytime'],
    },
];

function PlansComparison({ tier }: { tier: PlanUsage['tier'] }) {
    const isPaidTier = (t: PlanUsage['tier']) => t === 'essential' || t === 'complete' || t === 'pro';
    const isCurrentPaid = isPaidTier(tier);

    return (
        <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40 px-1">Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line rounded-2xl border border-line overflow-hidden">
                {TIERS.map((t) => {
                    const isCurrent = t.id === tier || (isCurrentPaid && t.id === 'essential' && tier === 'pro');
                    return (
                        <div
                            key={t.id}
                            className="relative flex flex-col p-6 bg-white"
                        >
                            <div className="flex items-center justify-between gap-2 min-h-[22px]">
                                <h3 className="text-sm font-bold tracking-tight text-ink">{t.name}</h3>
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
                                ) : t.id === 'free' ? (
                                    <div className="inline-flex items-center justify-center w-full h-10 rounded-xl text-sm font-medium bg-surface border border-line text-black/40">
                                        Included
                                    </div>
                                ) : (
                                    <Link
                                        href="/contact-sales"
                                        className="w-full h-10 inline-flex items-center justify-center gap-1.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-hover transition-colors active:scale-[0.98]"
                                    >
                                        Contact sales
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
