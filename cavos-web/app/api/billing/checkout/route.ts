import { NextResponse } from 'next/server'

/**
 * POST /api/billing/checkout
 *
 * Checkout is not yet implemented. Stripe Checkout integration is planned;
 * paid plans currently route to /contact-sales.
 *
 * Expected Stripe price IDs for launch:
 *   - Essential ($59/mo): price_1UBe29EAUKDn4fxSzTKg7olW
 *   - Complete ($139/mo): price_1UBe29EAUKDn4fxS8xVaXfjt
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Checkout is not implemented. Contact sales to upgrade.' },
    { status: 501 },
  )
}
