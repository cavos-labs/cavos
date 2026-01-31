import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
        return new NextResponse('Missing Stripe signature', { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createAdminClient();

    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;

                // Get plan tier from price metadata
                // Assuming single item subscription
                const price = subscription.items.data[0].price;
                let planTier = price.metadata.plan_tier;

                // If not on price, check product
                if (!planTier) {
                    const productId = typeof price.product === 'string'
                        ? price.product
                        : price.product.id;

                    const product = await stripe.products.retrieve(productId);
                    planTier = product.metadata.plan_tier;
                }

                planTier = planTier || 'developer';

                await supabase
                    .from('user_subscriptions')
                    .update({
                        stripe_subscription_id: subscription.id,
                        plan_tier: planTier,
                        status: subscription.status,
                        current_period_end: new Date((subscription as any).current_period_end * 1000),
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        updated_at: new Date()
                    })
                    .eq('stripe_customer_id', subscription.customer as string);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;

                // Downgrade to developer plan
                await supabase
                    .from('user_subscriptions')
                    .update({
                        stripe_subscription_id: null,
                        plan_tier: 'developer',
                        status: 'active', // User is active on free tier
                        updated_at: new Date()
                    })
                    .eq('stripe_customer_id', subscription.customer as string);
                break;
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        return new NextResponse('Webhook processing failed', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
