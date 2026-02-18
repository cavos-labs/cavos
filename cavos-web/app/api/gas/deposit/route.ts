import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { RpcProvider } from 'starknet'

// POST /api/gas/deposit — Register an on-chain deposit after tx confirmation
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tx_hash, org_id } = await request.json()
    if (!tx_hash || !org_id) {
      return NextResponse.json({ error: 'tx_hash and org_id are required' }, { status: 400 })
    }

    // Verify user owns this org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', org_id)
      .eq('owner_id', user.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found or unauthorized' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Check for duplicate tx_hash
    const { data: existing } = await admin
      .from('gas_deposits')
      .select('id')
      .eq('tx_hash', tx_hash)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Deposit already registered' }, { status: 409 })
    }

    // Verify transaction on-chain
    const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const receipt = await provider.getTransactionReceipt(tx_hash) as any

    if (!receipt || receipt.execution_status !== 'SUCCEEDED') {
      return NextResponse.json({ error: 'Transaction not confirmed or reverted' }, { status: 400 })
    }

    // Parse Deposit event from the receipt
    // Event keys[0] is the event selector for Deposit
    // Event data contains: org_id, amount (u256: low, high), fee (u256: low, high), net (u256: low, high)
    const gasTankContract = process.env.GAS_TANK_CONTRACT_ADDRESS
    if (!gasTankContract) {
      return NextResponse.json({ error: 'Gas tank contract not configured' }, { status: 500 })
    }

    let depositAmount = '0'
    let depositFee = '0'
    let depositNet = '0'

    // Starknet addresses can be returned with or without leading zeros.
    // Use BigInt comparison to normalise both sides (0x03fed... == 0x3fed...).
    const gasTankBigInt = BigInt(gasTankContract)

    const events = receipt.events || []
    for (const event of events) {
      // Match events emitted by the GasTank contract
      if (event.from_address && BigInt(event.from_address) === gasTankBigInt) {
        // Deposit event layout (org_id is #[key] so it's in keys[], not data[]):
        //   data[0..1] = amount (u256 low, high)
        //   data[2..3] = fee    (u256 low, high)
        //   data[4..5] = net    (u256 low, high)
        const data = event.data
        if (data && data.length >= 6) {
          const amount = BigInt(data[0]) + (BigInt(data[1]) << 128n)
          const fee    = BigInt(data[2]) + (BigInt(data[3]) << 128n)
          const net    = BigInt(data[4]) + (BigInt(data[5]) << 128n)

          depositAmount = (Number(amount) / 1e18).toString()
          depositFee    = (Number(fee)    / 1e18).toString()
          depositNet    = (Number(net)    / 1e18).toString()
          break
        }
      }
    }

    if (depositAmount === '0') {
      console.error('Deposit event not found. GasTank:', gasTankContract, 'Events:', JSON.stringify(events))
      return NextResponse.json({ error: 'No valid Deposit event found in transaction' }, { status: 400 })
    }

    // Record deposit
    const { error: insertError } = await admin
      .from('gas_deposits')
      .insert({
        org_id,
        tx_hash,
        amount_strk: depositAmount,
        fee_strk: depositFee,
        net_strk: depositNet,
        status: 'confirmed',
      })

    if (insertError) {
      console.error('Error inserting deposit:', insertError)
      return NextResponse.json({ error: 'Failed to record deposit' }, { status: 500 })
    }

    // Update gas balance cache
    const { data: gasBalance } = await admin
      .from('org_gas_balances')
      .select('balance_strk, total_deposited, org_felt_id')
      .eq('org_id', org_id)
      .single()

    if (gasBalance) {
      await admin
        .from('org_gas_balances')
        .update({
          balance_strk: parseFloat(gasBalance.balance_strk) + parseFloat(depositNet),
          total_deposited: parseFloat(gasBalance.total_deposited) + parseFloat(depositAmount),
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', org_id)
    } else {
      // Create balance record if it doesn't exist
      const { data: feltData } = await admin.rpc('generate_org_felt_id', { org_id })

      await admin
        .from('org_gas_balances')
        .insert({
          org_id,
          org_felt_id: feltData as string,
          balance_strk: parseFloat(depositNet),
          total_deposited: parseFloat(depositAmount),
          total_consumed: 0,
        })
    }

    return NextResponse.json({
      success: true,
      deposit: {
        tx_hash,
        amount_strk: depositAmount,
        fee_strk: depositFee,
        net_strk: depositNet,
      },
    })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
