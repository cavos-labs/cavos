/**
 * POST /api/stellar/gas/withdraw
 *   { org_id, destination, amount_xlm, network? }
 *
 * Send available (not reserved) XLM from the org's sponsor G-account to a
 * destination they control. Never goes through the public relay.
 */
import { Asset, BASE_FEE, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import {
  horizonServerFor,
  isSupportedStellarNetwork,
  passphraseFor,
} from '@/lib/stellar/relayer';
import { getStellarGas, STROOPS_PER_XLM, withdrawStellarGas } from '@/lib/stellar/gas';
import { accountCounts, getOrgSponsorSigner, loadSponsorAccount } from '@/lib/stellar/sponsor';
import {
  accountMinBalanceStroops,
  fetchBaseReserveStroops,
} from '@/lib/stellar/reserves';

const G_ADDRESS = /^G[A-Z2-7]{55}$/;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      org_id,
      destination,
      amount_xlm,
      network = 'stellar-mainnet',
    } = await request.json();

    if (!org_id || !destination || amount_xlm == null) {
      return NextResponse.json(
        { error: 'org_id, destination and amount_xlm are required' },
        { status: 400 },
      );
    }
    if (!isSupportedStellarNetwork(network)) {
      return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });
    }
    if (!G_ADDRESS.test(destination)) {
      return NextResponse.json({ error: 'destination must be a G-address' }, { status: 400 });
    }
    const amountXlm = Number(amount_xlm);
    if (!Number.isFinite(amountXlm) || amountXlm <= 0) {
      return NextResponse.json({ error: 'amount_xlm must be a positive number' }, { status: 400 });
    }
    const amountStroops = Math.round(amountXlm * STROOPS_PER_XLM);
    if (amountStroops <= 0) {
      return NextResponse.json({ error: 'amount is too small' }, { status: 400 });
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', org_id)
      .eq('owner_id', user.id)
      .single();
    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found or unauthorized' }, { status: 403 });
    }

    const gas = await getStellarGas(org_id);
    if (gas.balance_stroops < amountStroops) {
      return NextResponse.json(
        { error: 'Amount exceeds available (unlocked) balance' },
        { status: 400 },
      );
    }

    const { signer } = await getOrgSponsorSigner(org_id, network);
    if (destination === signer.publicKey()) {
      return NextResponse.json({ error: 'destination cannot be the sponsor itself' }, { status: 400 });
    }

    const account = await loadSponsorAccount(network, signer.publicKey());
    if (!account) {
      return NextResponse.json({ error: 'Sponsor account is not on-chain yet' }, { status: 400 });
    }

    const server = horizonServerFor(network);
    const base = await fetchBaseReserveStroops(server);
    const counts = accountCounts(account);
    const min = accountMinBalanceStroops(counts.subentries, counts.sponsoring, counts.sponsored, base);
    const native = account.balances.find((b) => b.asset_type === 'native');
    const onChain = native ? Math.round(Number(native.balance) * STROOPS_PER_XLM) : 0;
    const spendable = Math.max(0, onChain - min);
    if (amountStroops > spendable) {
      return NextResponse.json(
        {
          error: 'Amount would drop the sponsor below its reserved minimum',
          withdrawable_xlm: spendable / STROOPS_PER_XLM,
        },
        { status: 400 },
      );
    }

    const amount = (amountStroops / STROOPS_PER_XLM).toFixed(7);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: passphraseFor(network),
    })
      .addOperation(Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      }))
      .setTimeout(180)
      .build();

    await signer.signTransaction(tx);

    let hash: string;
    try {
      const res = await server.submitTransaction(tx);
      hash = res.hash;
    } catch (e) {
      const codes = (e as { response?: { data?: { extras?: { result_codes?: unknown } } } })?.response?.data
        ?.extras?.result_codes;
      return NextResponse.json(
        {
          error: 'Horizon rejected the withdrawal',
          detail: codes ? JSON.stringify(codes) : String((e as Error)?.message ?? e),
        },
        { status: 400 },
      );
    }

    const debited = await withdrawStellarGas(org_id, amountStroops);
    if (!debited) {
      // On-chain payment landed; ledger refused. Record the hash so we can reconcile.
      console.error('Withdrawal landed but ledger debit failed', { org_id, hash, amountStroops });
    }

    const admin = createAdminClient();
    await admin.from('stellar_gas_withdrawals').insert({
      org_id,
      destination,
      amount_stroops: amountStroops,
      tx_hash: hash,
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        tx_hash: hash,
        amount_stroops: amountStroops,
        amount_xlm: amountStroops / STROOPS_PER_XLM,
        destination,
      },
    });
  } catch (error) {
    console.error('Stellar gas withdraw error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
