/**
 * SEP-10 client_domain signing endpoint.
 *
 * POST /api/stellar/sep10/sign
 * Authorization: Bearer cav_...
 *
 * Body: { transaction: string, network_passphrase: string }
 *   - transaction: XDR envelope (base64) of a SEP-10 challenge.
 *   - network_passphrase: must be "Test SDF Network ; September 2015" (testnet).
 *
 * Signs the transaction with the org auth key (STELLAR_SEP10_SIGNING_SEED) to
 * prove that the user's wallet is integrated with Cavos (client_domain). This
 * key is NOT a user-control seed, NOT cv:ct, NOT Nitro. Cavos never signs user
 * payments with this key.
 *
 * Returns: { transaction: string, network_passphrase: string }
 *
 * Gate: only SEP-10 challenge transactions are signed (sequence === 0).
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashApiKey } from '@/lib/api-key';
import {
  SEP10_TESTNET_PASSPHRASE,
  validateSep10Request,
  signSep10Transaction,
} from '@/lib/stellar/sep10';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') ?? '';
    const [scheme, rawKey] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !rawKey?.startsWith('cav_')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Expected: Bearer cav_...' },
        { status: 401, headers: corsHeaders() },
      );
    }

    const admin = createAdminClient();
    const keyHash = hashApiKey(rawKey);

    const { data: apiKey, error: keyError } = await admin
      .from('organization_api_keys')
      .select('id, org_id, is_active')
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !apiKey || !apiKey.is_active) {
      return NextResponse.json(
        { error: 'Invalid or revoked API key' },
        { status: 401, headers: corsHeaders() },
      );
    }

    const signingSecret = process.env.STELLAR_SEP10_SIGNING_SEED;
    if (!signingSecret) {
      console.error('STELLAR_SEP10_SIGNING_SEED is not configured');
      return NextResponse.json(
        { error: 'SEP-10 signing is not configured' },
        { status: 503, headers: corsHeaders() },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected: { transaction: string, network_passphrase: string }' },
        { status: 400, headers: corsHeaders() },
      );
    }

    const validation = validateSep10Request(body, SEP10_TESTNET_PASSPHRASE);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status, headers: corsHeaders() },
      );
    }

    const result = signSep10Transaction(
      validation.tx,
      signingSecret,
      SEP10_TESTNET_PASSPHRASE,
    );

    admin
      .from('organization_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id)
      .then(() => {});

    return NextResponse.json(
      { transaction: result.transaction, network_passphrase: result.network_passphrase },
      { status: 200, headers: corsHeaders() },
    );
  } catch (error) {
    console.error('SEP-10 sign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() },
    );
  }
}
