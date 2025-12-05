'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, CreditCard, Zap, BarChart3, Shield, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PLANS = [
    {
        id: 'developer',
        name: 'Developer',
        price: '$0',
        period: '/month',
        features: ['Up to 200 MAU', 'Mainnet & Sepolia', 'Community Support', 'Standard Limits'],
        limit: 200,
    },
    {
        id: 'growth',
        name: 'Growth',
        price: '$149',
        period: '/month',
        priceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID,
        features: ['Up to 3,000 MAU', 'Priority Support', 'Higher Rate Limits', 'Advanced Analytics'],
        limit: 3000,
        recommended: true,
    },
    {
        id: 'scale',
        name: 'Scale',
        price: '$349',
        period: '/month',
        priceId: process.env.NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID,
        features: ['Up to 16,000 MAU', 'Dedicated Support', 'Custom Rate Limits', 'SLA Guarantees'],
        limit: 16000,
    },
];

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);
    const [usage, setUsage] = useState<any>(null);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const searchParams = new URL(window.location.href).searchParams;
        if (searchParams.get('upgrade') === 'success') {
            setShowSuccess(true);
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => setShowSuccess(false), 5000);
        }

        fetchData();
    }, []);

    const fetchData = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.replace('/login');
            return;
        }

        const [subRes, usageRes] = await Promise.all([
            supabase.from('user_subscriptions').select('*').eq('user_id', user.id).single(),
            supabase
                .from('usage_metrics')
                .select('*')
                .eq('user_id', user.id)
                .order('period_start', { ascending: false })
                .limit(1)
                .single()
        ]);

        setSubscription(subRes.data);
        setUsage(usageRes.data);
        setLoading(false);
    };

    const handleCheckout = async (priceId: string) => {
        setCheckoutLoading(priceId);
        try {
            const res = await fetch('/api/subscriptions/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (error) {
            console.error('Checkout error:', error);
        } finally {
            setCheckoutLoading(null);
        }
    };

    const handlePortal = async () => {
        setCheckoutLoading('portal');
        try {
            const res = await fetch('/api/subscriptions/portal', {
                method: 'POST',
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (error) {
            console.error('Portal error:', error);
        } finally {
            setCheckoutLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    const currentPlanId = subscription?.plan_tier || 'developer';
    const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0];
    const currentMAU = usage?.total_mau || 0;
    const limit = currentPlan.limit;
    const usagePercent = Math.min((currentMAU / limit) * 100, 100);

    return (
        <div className="space-y-8 animate-fadeIn max-w-5xl">
            {showSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <div className="p-2 bg-green-100 rounded-full">
                        <Check className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-medium">Plan Upgraded Successfully!</p>
                        <p className="text-sm text-green-600">Your new limits are active immediately.</p>
                    </div>
                </div>
            )}

            <div>
                <h1 className="text-3xl font-semibold tracking-tight mb-2">Billing & Subscription</h1>
                <p className="text-black/60">Manage your plan, billing details, and view usage.</p>
            </div>

            {/* Current Usage Card */}
            <Card className="bg-linear-to-br from-black/2 to-black/5 border-black/10">
                <div className="flex flex-col md:flex-row justify-between gap-6 md:items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentPlanId === 'developer' ? 'bg-gray-100 text-gray-700' :
                                currentPlanId === 'growth' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                }`}>
                                {currentPlan.name} Plan
                            </span>
                            <span className="text-sm text-black/40">
                                {(!subscription && currentPlanId === 'developer') || subscription?.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold mb-1">
                            {currentMAU.toLocaleString()} / {limit.toLocaleString()} MAU
                        </h2>
                        <p className="text-sm text-black/60">Monthly Active Users this billing period</p>
                    </div>

                    <div className="flex-1 max-w-sm">
                        <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500' :
                                    usagePercent > 75 ? 'bg-orange-500' : 'bg-black'
                                    }`}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-black/50">
                            <span>0%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {currentPlanId !== 'developer' && (
                        <Button
                            variant="outline"
                            onClick={handlePortal}
                            loading={checkoutLoading === 'portal'}
                        >
                            Manage Subscription
                        </Button>
                    )}
                </div>
            </Card>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => {
                    const isCurrent = plan.id === currentPlanId;
                    const isHigher = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlanId);

                    return (
                        <Card key={plan.id} className={`relative flex flex-col ${plan.recommended ? 'ring-2 ring-black border-transparent shadow-lg' : ''}`}>
                            {plan.recommended && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded-full text-xs font-medium">
                                    Recommended
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="text-3xl font-bold">{plan.price}</span>
                                    <span className="text-black/60 text-sm">{plan.period}</span>
                                </div>
                                <p className="text-sm text-black/60 mt-2">{plan.limit.toLocaleString()} MAU Limit</p>
                            </div>

                            <div className="space-y-3 flex-1 mb-8">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-600 shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            {isCurrent ? (
                                <div className="w-full py-2 text-center text-sm font-medium bg-black/5 text-black rounded-lg border border-transparent">
                                    Current Plan
                                </div>
                            ) : (
                                <Button
                                    className="w-full"
                                    variant={isHigher ? 'primary' : 'outline'}
                                    disabled={plan.id !== 'developer' && !plan.priceId}
                                    onClick={() => {
                                        if (plan.id === 'developer') {
                                            handlePortal();
                                        } else if (plan.priceId) {
                                            handleCheckout(plan.priceId);
                                        }
                                    }}
                                    loading={checkoutLoading === (plan.id === 'developer' ? 'portal' : plan.priceId)}
                                >
                                    {isHigher ? 'Upgrade' : 'Downgrade'}
                                </Button>
                            )}
                            {!plan.priceId && !isCurrent && plan.id !== 'developer' && (
                                <p className="text-xs text-red-500 mt-2 text-center">
                                    Missing PRICE_ID in .env.local
                                </p>
                            )}
                        </Card>
                    );
                })}
            </div>

            <div className="mt-12 p-6 bg-black/5 rounded-xl">
                <div className="flex gap-4 items-start">
                    <Shield className="w-6 h-6 text-black/60 mt-1" />
                    <div>
                        <h3 className="font-semibold mb-1">Secure Payments via Stripe</h3>
                        <p className="text-sm text-black/60 max-w-2xl">
                            All payments are processed securely by Stripe. We do not store your credit card information.
                            You can cancel or change your plan at any time from the billing portal.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
