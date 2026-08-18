/**
 * POST /api/stellar/gas/deposit  { org_id, tx_hash, network }
 *
 * Credit an org for XLM that landed on *its* sponsor G-account (createAccount
 * or payment). Legacy deposits to the shared relayer with the org hash memo
 * are still accepted so in-flight transfers are not lost.
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  horizonServerFor,
  isSupportedStellarNetwork,
} from '@/lib/stellar/relayer';
import { getRelayerSigner } from '@/lib/stellar/signer';
import { creditStellarGas, depositMemoBase64, STROOPS_PER_XLM } from '@/lib/stellar/gas';
import { ensureOrgSponsor } from '@/lib/stellar/sponsor';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { org_id, tx_hash, network = 'stellar-mainnet' } = await request.json();
    if (!org_id || !tx_hash) {
      return NextResponse.json({ error: 'org_id and tx_hash are required' }, { status: 400 });
    }
    if (!isSupportedStellarNetwork(network)) {
      return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });
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

    const sponsor = await ensureOrgSponsor(org_id, network);
    let legacyAddress: string | null = null;
    try {
      legacyAddress = (await getRelayerSigner(network)).publicKey();
    } catch {
      /* no shared key configured — org address is enough */
    }

    const server = horizonServerFor(network);
    let tx;
    try {
      tx = await server.transactions().transaction(tx_hash).call();
    } catch {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 400 });
    }
    if (!tx.successful) {
      return NextResponse.json({ error: 'Transaction did not succeed' }, { status: 400 });
    }

    const ops = await server.operations().forTransaction(tx_hash).limit(200).call();
    let toOrg = 0;
    let toLegacy = 0;
    for (const op of ops.records as Array<{
      type: string;
      asset_type?: string;
      to?: string;
      account?: string;
      amount?: string;
      starting_balance?: string;
    }>) {
      if (op.type === 'payment' && op.asset_type === 'native') {
        const stroops = Math.round(Number(op.amount) * STROOPS_PER_XLM);
        if (op.to === sponsor.publicKey) toOrg += stroops;
        else if (legacyAddress && op.to === legacyAddress) toLegacy += stroops;
      }
      if (op.type === 'create_account') {
        const stroops = Math.round(Number(op.starting_balance) * STROOPS_PER_XLM);
        if (op.account === sponsor.publicKey) toOrg += stroops;
        else if (legacyAddress && op.account === legacyAddress) toLegacy += stroops;
      }
    }

    let depositedStroops = toOrg;
    if (depositedStroops <= 0 && toLegacy > 0) {
      const wantMemo = depositMemoBase64(org_id);
      if (tx.memo_type !== 'hash' || tx.memo !== wantMemo) {
        return NextResponse.json(
          { error: 'Legacy shared-address deposits must include the org hash memo' },
          { status: 400 },
        );
      }
      depositedStroops = toLegacy;
    }

    if (depositedStroops <= 0) {
      return NextResponse.json(
        { error: 'No XLM payment to this organization\'s sponsor address found' },
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

/** GET — this org's deposit address. Requires org_id. */
export async function GET(request: Request) {
  try {
    const orgId = new URL(request.url).searchParams.get('org_id');
    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }
    const sponsor = await ensureOrgSponsor(orgId, 'stellar-mainnet');
    return NextResponse.json({ deposit_address: sponsor.publicKey });
  } catch {
    return NextResponse.json({ error: 'relayer not configured' }, { status: 500 });
  }
}
