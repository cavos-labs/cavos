import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { priceId } = await request.json();

        if (!priceId) {
            return new NextResponse('Price ID is required', { status: 400 });
        }

        // Get or create Stripe customer
        let { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        let customerId = subscription?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_user_id: user.id }
            });
            customerId = customer.id;

            // Save customer ID using admin client to bypass RLS
            const adminSupabase = createAdminClient();
            await adminSupabase
                .from('user_subscriptions')
                .upsert({
                    user_id: user.id,
                    stripe_customer_id: customerId,
                    plan_tier: 'developer', // Default
                    status: 'active'
                }, { onConflict: 'user_id' });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard/billing?upgrade=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard/billing?upgrade=canceled`,
            metadata: { user_id: user.id },
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
