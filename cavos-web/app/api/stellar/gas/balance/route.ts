/**
 * GET /api/stellar/gas/balance?org_id=<uuid>
 * Dashboard read of an org's prepaid Stellar gas balance + deposit instructions.
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getStellarGas, depositMemoHex, STROOPS_PER_XLM } from '@/lib/stellar/gas';
import { getRelayerSigner } from '@/lib/stellar/signer';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = new URL(request.url).searchParams.get('org_id');
    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    // Ownership check.
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .eq('owner_id', user.id)
      .single();
    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found or unauthorized' }, { status: 403 });
    }

    const gas = await getStellarGas(orgId);

    // Deposit instructions: send XLM to the relayer G-account with this hash memo
    // so the deposit is attributed to this org and cannot be claimed by anyone else.
    let depositAddress: string | null = null;
    try {
      // Deposits fund the mainnet prepaid balance → mainnet relayer address.
      depositAddress = (await getRelayerSigner('stellar-mainnet')).publicKey();
    } catch {
      /* relayer not configured in this env */
    }

    return NextResponse.json({
      balance_stroops: gas.balance_stroops,
      total_deposited_stroops: gas.total_deposited_stroops,
      total_consumed_stroops: gas.total_consumed_stroops,
      balance_xlm: gas.balance_stroops / STROOPS_PER_XLM,
      total_deposited_xlm: gas.total_deposited_stroops / STROOPS_PER_XLM,
      total_consumed_xlm: gas.total_consumed_stroops / STROOPS_PER_XLM,
      deposit_address: depositAddress,
      deposit_memo_hash: depositMemoHex(orgId),
    });
  } catch (error) {
    console.error('Stellar gas balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
