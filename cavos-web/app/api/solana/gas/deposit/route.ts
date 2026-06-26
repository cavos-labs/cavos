/**
 * POST /api/solana/gas/deposit  { org_id, signature }
 * Register an on-chain SOL deposit to the Cavos relayer address and credit the
 * org. The deposit tx MUST carry a memo `cavos:gas:<org_id>` so it can only be
 * attributed to (and claimed by) the org that owns it.
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  connectionFor,
  isSupportedSolanaNetwork,
} from '@/lib/solana/relayer';
import { getRelayerSigner } from '@/lib/solana/signer';
import { creditSolanaGas, depositMemo, LAMPORTS_PER_SOL } from '@/lib/solana/gas';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { org_id, signature, network = 'solana-devnet' } = await request.json();
    if (!org_id || !signature) {
      return NextResponse.json({ error: 'org_id and signature are required' }, { status: 400 });
    }
    if (!isSupportedSolanaNetwork(network)) {
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

    const relayerPubkey = (await getRelayerSigner('solana-mainnet')).publicKey.toBase58();
    const connection = connectionFor(network);
    const parsed = await connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (!parsed || parsed.meta?.err) {
      return NextResponse.json({ error: 'Transaction not found or failed' }, { status: 400 });
    }

    const instructions = parsed.transaction.message.instructions as any[];
    const wantMemo = depositMemo(org_id);

    // (a) sum SOL transferred to the relayer address; (b) require the org memo.
    let depositedLamports = 0;
    let memoMatches = false;
    for (const ix of instructions) {
      const parsedIx = ix.parsed;
      if (ix.program === 'system' && parsedIx?.type === 'transfer') {
        if (parsedIx.info?.destination === relayerPubkey) {
          depositedLamports += Number(parsedIx.info.lamports);
        }
      }
      if (ix.program === 'spl-memo') {
        const memoText = typeof parsedIx === 'string' ? parsedIx : ix.parsed;
        if (memoText === wantMemo) memoMatches = true;
      }
    }

    if (depositedLamports <= 0) {
      return NextResponse.json({ error: 'No SOL transfer to the Cavos deposit address found' }, { status: 400 });
    }
    if (!memoMatches) {
      return NextResponse.json(
        { error: `Deposit must include the memo "${wantMemo}"` },
        { status: 400 },
      );
    }

    const credited = await creditSolanaGas(org_id, depositedLamports, signature);
    if (!credited) {
      return NextResponse.json({ error: 'Deposit already registered' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      deposit: {
        signature,
        amount_lamports: depositedLamports,
        amount_sol: depositedLamports / LAMPORTS_PER_SOL,
      },
    });
  } catch (error) {
    console.error('Solana gas deposit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** GET — deposit instructions (mainnet deposit address). */
export async function GET() {
  try {
    return NextResponse.json({ deposit_address: (await getRelayerSigner('solana-mainnet')).publicKey.toBase58() });
  } catch {
    return NextResponse.json({ error: 'relayer not configured' }, { status: 500 });
  }
}
