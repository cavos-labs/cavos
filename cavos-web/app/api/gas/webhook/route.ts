import { createAdminClient } from '@/lib/supabase/admin'
import { hashApiKey } from '@/lib/api-key'
import { NextResponse } from 'next/server'

// GET /api/gas/webhook — Paymaster webhook to validate API key and return org_felt_id
// Called by the paymaster service with x-paymaster-api-key header.
// Query param ?network=sepolia|mainnet determines which logic to apply.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isSepolia = searchParams.get('network') === 'sepolia'

    const apiKey = request.headers.get('x-paymaster-api-key')
    if (!apiKey) {
      return NextResponse.json({ is_valid: false, reason: 'Missing API key' }, { status: 401 })
    }

    // Verify webhook secret — support a per-network secret for sepolia so each
    // paymaster deployment can have its own secret without sharing.
    const webhookSecret = request.headers.get('x-webhook-secret')
    const validSecrets = [
      process.env.PAYMASTER_WEBHOOK_SECRET,
      isSepolia ? process.env.PAYMASTER_WEBHOOK_SECRET_SEPOLIA : undefined,
    ].filter(Boolean)

    if (!validSecrets.includes(webhookSecret ?? undefined)) {
      return NextResponse.json({ is_valid: false, reason: 'Invalid webhook secret' }, { status: 401 })
    }

    const keyHash = hashApiKey(apiKey)
    const supabase = createAdminClient()

    // Lookup API key by hash
    const { data: keyRecord, error: keyError } = await supabase
      .from('organization_api_keys')
      .select('org_id, is_active')
      .eq('key_hash', keyHash)
      .single()

    if (keyError || !keyRecord || !keyRecord.is_active) {
      return NextResponse.json({ is_valid: false, reason: 'Invalid or inactive API key' }, { status: 401 })
    }

    // Update last_used_at
    await supabase
      .from('organization_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash)

    // ── Sepolia: free for all — no deposit required ───────────────────────────
    // All valid API keys are sponsored from the Cavos testnet pool.
    // If SEPOLIA_FREE_POOL_FELT_ID is set, the paymaster deducts from that pool.
    // If not set, sponsor_metadata is empty and no gas tank deduction happens
    // (the relayer absorbs the cost, which is fine for testnet).
    if (isSepolia) {
      const poolFeltId = process.env.SEPOLIA_FREE_POOL_FELT_ID
      return NextResponse.json({
        is_valid: true,
        sponsor_metadata: poolFeltId ? [poolFeltId] : [],
        validity_duration: 30,
      })
    }

    // ── Mainnet: check org balance ────────────────────────────────────────────
    const { data: gasBalance, error: balanceError } = await supabase
      .from('org_gas_balances')
      .select('org_felt_id, balance_strk')
      .eq('org_id', keyRecord.org_id)
      .single()

    if (balanceError || !gasBalance) {
      return NextResponse.json({ is_valid: false, reason: 'No gas balance found. Deposit STRK first.' }, { status: 402 })
    }

    // Check minimum balance threshold (0.001 STRK)
    if (parseFloat(gasBalance.balance_strk) < 0.001) {
      return NextResponse.json({ is_valid: false, reason: 'Insufficient gas balance' }, { status: 402 })
    }

    return NextResponse.json({
      is_valid: true,
      sponsor_metadata: [gasBalance.org_felt_id],
      validity_duration: 30,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ is_valid: false, reason: 'Internal error' }, { status: 500 })
  }
}
