/**
 * GET /api/solana/gas/balance?org_id=<uuid>
 * Dashboard read of an org's prepaid Solana gas balance + deposit instructions.
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSolanaGas, depositMemo, LAMPORTS_PER_SOL } from '@/lib/solana/gas';
import { loadRelayerKeypair } from '@/lib/solana/relayer';

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

    const gas = await getSolanaGas(orgId);

    // Deposit instructions: send SOL to the relayer address with this memo so the
    // deposit is attributed to this org and cannot be claimed by anyone else.
    let depositAddress: string | null = null;
    try {
      // Deposits fund the mainnet prepaid balance → mainnet relayer address.
      depositAddress = loadRelayerKeypair('solana-mainnet').publicKey.toBase58();
    } catch {
      /* relayer not configured in this env */
    }

    return NextResponse.json({
      balance_lamports: gas.balance_lamports,
      total_deposited_lamports: gas.total_deposited_lamports,
      total_consumed_lamports: gas.total_consumed_lamports,
      balance_sol: gas.balance_lamports / LAMPORTS_PER_SOL,
      total_deposited_sol: gas.total_deposited_lamports / LAMPORTS_PER_SOL,
      total_consumed_sol: gas.total_consumed_lamports / LAMPORTS_PER_SOL,
      deposit_address: depositAddress,
      deposit_memo: depositMemo(orgId),
    });
  } catch (error) {
    console.error('Solana gas balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
