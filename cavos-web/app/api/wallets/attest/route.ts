import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashApiKey } from '@/lib/api-key';
import { signAttestationForChain } from '@/lib/crypto/attestation';
import { ApiResponse } from '@/lib/api/response';
import { ApiLogger } from '@/lib/api/logger';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';

/**
 * POST /api/wallets/attest
 *
 * Issues a deploy attestation signature for a new DeviceAccount. The SDK
 * includes this signature in the deploy bundle; the on-chain `initialize`
 * verifies it before registering the first device signer.
 *
 * Authorization: Bearer cav_... (an org API key). This is stricter than the
 * un-keyed /api/wallets routes — deploy attestation is a privileged operation
 * (it authorises a new account to be created under an app), so we require a
 * real API key rather than just the app_id.
 *
 * Body:
 *   {
 *     app_id: string,            // UUID — must belong to the key's org
 *     user_social_id: string,    // the user's stable id (OAuth sub / Firebase uid)
 *     address_seed: string,      // hex felt252 — Poseidon(userId, appSalt) for Starknet
 *     pub_x: string,             // hex u256 — device pubkey x coord
 *     pub_y: string              // hex u256 — device pubkey y coord
 *   }
 *
 * Response:
 *   { r: string, s: string, y_parity: boolean }
 *
 * The signature is over sha256(address_seed_be32 || pub_x_be32 || pub_y_be32)
 * — bound to the exact (seed, device) being registered, so an attestation
 * minted for one user/device cannot be replayed against another.
 */
export async function POST(request: Request) {
    const logger = ApiLogger.createRequestLogger('/api/wallets/attest', 'POST');
    logger.info('Attestation request');

    try {
        // --- Auth: require a valid org API key (Bearer cav_...) ---
        const authHeader = request.headers.get('authorization') ?? '';
        const [scheme, rawKey] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !rawKey?.startsWith('cav_')) {
            logger.warn('Missing or invalid Authorization header');
            return ApiResponse.unauthorized(
                'Missing or invalid Authorization header. Expected: Bearer cav_...'
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
            logger.warn('Invalid or revoked API key');
            return ApiResponse.unauthorized('Invalid or revoked API key');
        }

        // --- Rate limit: 30 attestations / min / IP (deploy is heavier than a wallet read) ---
        const ip = clientIp(request);
        const rl = checkRateLimit(`attest:${ip}`, 30, 60_000);
        if (!rl.allowed) {
            logger.warn('Rate limited', { ip });
            return NextResponse.json(
                { error: 'Too many attestation requests. Retry later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
            );
        }

        // --- Parse + validate body ---
        const body = await request.json().catch(() => null);
        if (!body) {
            return ApiResponse.badRequest('Invalid JSON body');
        }

        const { app_id, user_social_id, address_seed, pub_x, pub_y } = body;
        // Which chain's digest to sign. Defaults to starknet for back-compat.
        // (Stellar no longer uses attestation — it moved to self-custodial classic
        // `G…` accounts that need no deploy attestation.)
        const chain = (body.chain ?? 'starknet') as 'starknet' | 'solana';

        if (
            !app_id || typeof app_id !== 'string' ||
            !user_social_id || typeof user_social_id !== 'string' ||
            !address_seed || typeof address_seed !== 'string' ||
            !pub_x || typeof pub_x !== 'string' ||
            !pub_y || typeof pub_y !== 'string'
        ) {
            return ApiResponse.badRequest('Missing required fields', {
                required: ['app_id', 'user_social_id', 'address_seed', 'pub_x', 'pub_y'],
            });
        }

        if (chain !== 'starknet' && chain !== 'solana') {
            return ApiResponse.badRequest('chain must be one of: starknet, solana');
        }

        // All hex inputs must be 0x-prefixed and parse as bigints.
        if (!/^0x[0-9a-fA-F]+$/.test(address_seed) ||
            !/^0x[0-9a-fA-Fx]+$/.test(pub_x) ||
            !/^0x[0-9a-fA-Fx]+$/.test(pub_y)) {
            return ApiResponse.badRequest('address_seed, pub_x, pub_y must be hex strings');
        }

        // --- Verify the app belongs to the API key's org ---
        const { data: app, error: appError } = await admin
            .from('apps')
            .select('id, organization_id')
            .eq('id', app_id)
            .single();

        if (appError || !app) {
            logger.warn('App not found', { app_id });
            return ApiResponse.badRequest('App not found');
        }

        if (app.organization_id !== apiKey.org_id) {
            logger.warn('App does not belong to API key org', {
                app_id,
                key_org: apiKey.org_id,
                app_org: app.organization_id,
            });
            return ApiResponse.unauthorized('API key is not authorized for this app');
        }

        // --- Issue the attestation ---
        // The signature is bound to (address_seed, pub_x, pub_y). The contract
        // verifies it recovers to the hardcoded ATTESTATION_SIGNER_ID. An
        // attestation minted here cannot be replayed against a different user
        // or device — the digest includes all three.
        const signature = signAttestationForChain(chain, address_seed, pub_x, pub_y);

        logger.info('Attestation issued', { app_id, user_social_id, chain });
        logger.complete(true);

        return ApiResponse.success({
            r: signature.r,
            s: signature.s,
            y_parity: signature.y_parity,
        });
    } catch (error) {
        logger.error('Attestation failed', error);
        logger.complete(false);

        // CAVOS_ATTESTATION_PRIVATE_KEY missing / malformed → 500 with a hint.
        const message = error instanceof Error ? error.message : 'Attestation failed';
        return ApiResponse.error(
            message.includes('ATTESTATION_PRIVATE_KEY')
                ? 'Server attestation key not configured'
                : 'Attestation failed',
            500
        );
    }
}

// Pre-flight for CORS (the route is called cross-origin from the SDK).
export async function OPTIONS() {
    return new NextResponse(null, { status: 204 });
}
