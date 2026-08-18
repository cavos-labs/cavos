/**
 * GET /api/stellar/gas/balance?org_id=<uuid>
 * Dashboard read of an org's prepaid Stellar gas + its own deposit address.
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getStellarGas, STROOPS_PER_XLM } from '@/lib/stellar/gas';
import { accountCounts, ensureOrgSponsor, loadSponsorAccount } from '@/lib/stellar/sponsor';
import { accountMinBalanceStroops, fetchBaseReserveStroops } from '@/lib/stellar/reserves';
import { horizonServerFor } from '@/lib/stellar/relayer';

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

    let depositAddress: string | null = null;
    let withdrawableStroops = gas.balance_stroops;
    try {
      const sponsor = await ensureOrgSponsor(orgId, 'stellar-mainnet');
      depositAddress = sponsor.publicKey;
      const account = await loadSponsorAccount('stellar-mainnet', sponsor.publicKey);
      if (account) {
        const base = await fetchBaseReserveStroops(horizonServerFor('stellar-mainnet'));
        const counts = accountCounts(account);
        const min = accountMinBalanceStroops(counts.subentries, counts.sponsoring, counts.sponsored, base);
        const native = account.balances.find((b) => b.asset_type === 'native');
        const onChain = native ? Math.round(Number(native.balance) * STROOPS_PER_XLM) : 0;
        const spendable = Math.max(0, onChain - min);
        withdrawableStroops = Math.min(gas.balance_stroops, spendable);
      } else {
        withdrawableStroops = 0;
      }
    } catch {
      /* relayer secret not configured */
    }

    return NextResponse.json({
      balance_stroops: gas.balance_stroops,
      reserved_stroops: gas.reserved_stroops,
      withdrawn_stroops: gas.withdrawn_stroops,
      total_deposited_stroops: gas.total_deposited_stroops,
      total_consumed_stroops: gas.total_consumed_stroops,
      withdrawable_stroops: withdrawableStroops,
      balance_xlm: gas.balance_stroops / STROOPS_PER_XLM,
      reserved_xlm: gas.reserved_stroops / STROOPS_PER_XLM,
      withdrawn_xlm: gas.withdrawn_stroops / STROOPS_PER_XLM,
      total_deposited_xlm: gas.total_deposited_stroops / STROOPS_PER_XLM,
      total_consumed_xlm: gas.total_consumed_stroops / STROOPS_PER_XLM,
      withdrawable_xlm: withdrawableStroops / STROOPS_PER_XLM,
      deposit_address: depositAddress,
    });
  } catch (error) {
    console.error('Stellar gas balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
