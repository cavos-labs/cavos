import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { RpcProvider, Contract } from 'starknet'

const GAS_TANK_ABI = [
  {
    name: 'get_balance',
    type: 'function',
    inputs: [{ name: 'org_id', type: 'felt252' }],
    outputs: [{ type: 'u256' }],
    state_mutability: 'view',
  },
] as const

// GET /api/gas/balance?org_id=<uuid> — Query on-chain gas balance
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const orgId = url.searchParams.get('org_id')
    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    // Verify user owns this org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .eq('owner_id', user.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found or unauthorized' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Get or create gas balance record
    let { data: gasBalance } = await admin
      .from('org_gas_balances')
      .select('org_felt_id, balance_strk, total_deposited, total_consumed')
      .eq('org_id', orgId)
      .single()

    if (!gasBalance) {
      // Generate felt ID and create record
      const { data: feltData } = await admin.rpc('generate_org_felt_id', { org_id: orgId })
      const orgFeltId = feltData as string

      const { data: newBalance, error: insertError } = await admin
        .from('org_gas_balances')
        .insert({
          org_id: orgId,
          org_felt_id: orgFeltId,
          balance_strk: 0,
          total_deposited: 0,
          total_consumed: 0,
        })
        .select('org_felt_id, balance_strk, total_deposited, total_consumed')
        .single()

      if (insertError) {
        return NextResponse.json({ error: 'Failed to initialize gas balance' }, { status: 500 })
      }
      gasBalance = newBalance
    }

    // Read on-chain balance if contract is configured
    const gasTankContract = process.env.GAS_TANK_CONTRACT_ADDRESS
    if (gasTankContract && gasBalance) {
      try {
        const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL })
        const contract = new Contract(GAS_TANK_ABI, gasTankContract, provider)
        const onChainBalance = await contract.get_balance(gasBalance.org_felt_id)

        // Convert from u256 (wei) to STRK (18 decimals)
        const balanceStrk = Number(onChainBalance) / 1e18

        // Update cache
        await admin
          .from('org_gas_balances')
          .update({
            balance_strk: balanceStrk,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId)

        gasBalance.balance_strk = balanceStrk
      } catch (err) {
        console.error('Failed to read on-chain balance, using cached:', err)
      }
    }

    return NextResponse.json({
      balance_strk: gasBalance!.balance_strk,
      total_deposited: gasBalance!.total_deposited,
      total_consumed: gasBalance!.total_consumed,
      org_felt_id: gasBalance!.org_felt_id,
    })
  } catch (error) {
    console.error('Balance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
