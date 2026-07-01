/**
 * POST /api/stellar/gas/deposit  { org_id, tx_hash, network }
 * Register an on-chain XLM deposit to the Cavos relayer G-account and credit the
 * org. The deposit tx MUST carry a native MEMO_TEXT `cavos:gas:<org_id>` so it can
 * only be attributed to (and claimed by) the org that owns it.
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  horizonServerFor,
  isSupportedStellarNetwork,
} from '@/lib/stellar/relayer';
import { getRelayerSigner } from '@/lib/stellar/signer';
import { creditStellarGas, depositMemoBase64, STROOPS_PER_XLM } from '@/lib/stellar/gas';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { org_id, tx_hash, network = 'stellar-testnet' } = await request.json();
    if (!org_id || !tx_hash) {
      return NextResponse.json({ error: 'org_id and tx_hash are required' }, { status: 400 });
    }
    if (!isSupportedStellarNetwork(network)) {
      return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });
    }

    // Ownership check.
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', org_id)
      .eq('owner_id', user.id)
      .single();
    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found or unauthorized' }, { status: 403 });
    }

    const relayerAddress = (await getRelayerSigner('stellar-mainnet')).publicKey();
    const server = horizonServerFor(network);

    // Fetch the deposit tx from Horizon (memo + typed payment operations).
    let tx;
    try {
      tx = await server.transactions().transaction(tx_hash).call();
    } catch {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 400 });
    }
    if (!tx.successful) {
      return NextResponse.json({ error: 'Transaction did not succeed' }, { status: 400 });
    }

    // Require the org hash memo — this is what attributes the deposit to the org.
    // Horizon serializes a hash memo as base64.
    const wantMemo = depositMemoBase64(org_id);
    if (tx.memo_type !== 'hash' || tx.memo !== wantMemo) {
      return NextResponse.json(
        { error: 'Deposit must include the org hash memo shown in the dashboard' },
        { status: 400 },
      );
    }

    // Sum native XLM payments to the relayer address.
    const ops = await server.operations().forTransaction(tx_hash).limit(200).call();
    let depositedStroops = 0;
    for (const op of ops.records as any[]) {
      if (
        op.type === 'payment' &&
        op.asset_type === 'native' &&
        op.to === relayerAddress
      ) {
        depositedStroops += Math.round(Number(op.amount) * STROOPS_PER_XLM);
      }
    }

    if (depositedStroops <= 0) {
      return NextResponse.json(
        { error: 'No XLM payment to the Cavos deposit address found' },
        { status: 400 },
      );
    }

    const credited = await creditStellarGas(org_id, depositedStroops, tx_hash);
    if (!credited) {
      return NextResponse.json({ error: 'Deposit already registered' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      deposit: {
        tx_hash,
        amount_stroops: depositedStroops,
        amount_xlm: depositedStroops / STROOPS_PER_XLM,
      },
    });
  } catch (error) {
    console.error('Stellar gas deposit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** GET — deposit instructions (mainnet deposit address). */
export async function GET() {
  try {
    return NextResponse.json({ deposit_address: (await getRelayerSigner('stellar-mainnet')).publicKey() });
  } catch {
    return NextResponse.json({ error: 'relayer not configured' }, { status: 500 });
  }
}
