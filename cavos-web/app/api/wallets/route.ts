/**
 * POST /api/wallets
 * Save or update a wallet
 * 
 * GET /api/wallets
 * Retrieve a wallet
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { ApiLogger } from '@/lib/api/logger';
import { ApiResponse } from '@/lib/api/response';
import { ApiValidator } from '@/lib/api/validation';
import { ApiMiddleware } from '@/lib/api/middleware';
import type { WalletSaveRequest, WalletGetRequest } from '@/lib/api/types';

/**
 * GET - Retrieve wallet
 */
export async function GET(request: Request) {
    const logger = ApiLogger.createRequestLogger('/api/wallets', 'GET');
    logger.info('Wallet retrieval request');

    try {
        const { searchParams } = new URL(request.url);
        const app_id = searchParams.get('app_id');
        const user_social_id = searchParams.get('user_social_id');
        const network = searchParams.get('network');

        // Validate required fields
        if (!app_id || !user_social_id || !network) {
            logger.warn('Missing required query parameters');
            return ApiResponse.badRequest('Missing required query parameters', {
                required: ['app_id', 'user_social_id', 'network']
            });
        }

        // Verify app ID
        const { valid, app } = await ApiMiddleware.verifyAppId(app_id, logger);
        if (!valid) {
            return ApiResponse.unauthorized('Invalid App ID');
        }

        // Fetch wallet (+ its authorized device signers via wallet_devices).
        logger.debug('Fetching wallet', { user_social_id, network });
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('wallets')
            .select('encrypted_pk_blob, address, updated_at, wallet_devices(pub_x, pub_y, device_label)')
            .eq('app_id', app_id)
            .eq('user_social_id', user_social_id)
            .eq('network', network)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                logger.info('Wallet not found');
                logger.complete(true);
                return ApiResponse.success({ found: false });
            }
            logger.error('Database error', error);
            logger.complete(false);
            return ApiResponse.serverError('Failed to fetch wallet');
        }

        logger.info('Wallet retrieved successfully');
        logger.complete(true);
        return ApiResponse.success({
            found: true,
            encrypted_pk_blob: data.encrypted_pk_blob,
            address: data.address,
            updated_at: data.updated_at,
            devices: (data.wallet_devices ?? []).map((d: { pub_x: string; pub_y: string; device_label: string | null }) => ({
                pub_x: d.pub_x,
                pub_y: d.pub_y,
                device_label: d.device_label,
            })),
        });

    } catch (error) {
        logger.error('Unexpected error', error);
        logger.complete(false);
        return ApiResponse.serverError();
    }
}

/**
 * POST - Save or update wallet
 */
export async function POST(request: Request) {
    const logger = ApiLogger.createRequestLogger('/api/wallets', 'POST');
    logger.info('Wallet save request');

    try {
        // Parse request body
        const body = await ApiMiddleware.parseBody<WalletSaveRequest>(request);
        if (!body) {
            logger.warn('Invalid JSON body');
            return ApiResponse.badRequest('Invalid request body');
        }

        const { app_id, user_social_id, network, address, encrypted_pk_blob, email, devices } = body;

        // Validate required fields. `encrypted_pk_blob` is required for legacy
        // JWT/WebAuthn wallets; device-signer wallets send `devices` instead and
        // may omit the blob.
        const required: (keyof WalletSaveRequest)[] = ['app_id', 'user_social_id', 'network', 'address'];
        if (!devices || !Array.isArray(devices) || devices.length === 0) {
            required.push('encrypted_pk_blob');
        }
        const validation = ApiValidator.validateRequired<WalletSaveRequest>(body, required);

        if (!validation.valid) {
            logger.warn('Missing required fields', { missing: validation.missing });
            return ApiResponse.badRequest('Missing required fields', {
                missing: validation.missing
            });
        }

        // Verify app ID
        const { valid, app } = await ApiMiddleware.verifyAppId(app_id, logger);
        if (!valid) {
            return ApiResponse.unauthorized('Invalid App ID');
        }

        // Check if email is verified via firebase verification tokens (for Firebase email/password users)
        let emailVerified = false;
        const adminSupabase = createAdminClient();
        if (email) {
            const { data: verifiedToken } = await adminSupabase
                .from('email_verification_tokens')
                .select('verified_at')
                .eq('firebase_uid', user_social_id)
                .eq('app_id', app_id)
                .not('verified_at', 'is', null)
                .limit(1)
                .single();
            emailVerified = !!verifiedToken;
        }

        // Save wallet. (`email` was removed from the wallets table in the PII
        // cleanup migration; email-verification is tracked via email_verified*.)
        logger.debug('Saving wallet', { user_social_id, network, address });
        const walletData: Record<string, any> = {
            app_id,
            user_social_id,
            network,
            address,
            encrypted_pk_blob: encrypted_pk_blob ?? null,
            updated_at: new Date().toISOString(),
        };
        if (emailVerified) {
            walletData.email_verified = true;
            walletData.email_verified_at = new Date().toISOString();
        }
        const { data, error } = await adminSupabase
            .from('wallets')
            .upsert(
                walletData,
                {
                    onConflict: 'app_id,user_social_id,network',
                    ignoreDuplicates: false
                }
            )
            .select()
            .single();

        if (error) {
            logger.error('Database error', error);
            logger.complete(false);
            return ApiResponse.serverError('Failed to save wallet');
        }

        // Store the authorized device signer(s) for device-signer wallets.
        if (devices && Array.isArray(devices) && devices.length > 0) {
            const rows = devices.map((d: { x: string; y: string; label?: string }) => ({
                wallet_id: data.id,
                pub_x: d.x,
                pub_y: d.y,
                device_label: d.label ?? null,
            }));
            await adminSupabase
                .from('wallet_devices')
                .upsert(rows, { onConflict: 'wallet_id,pub_x,pub_y', ignoreDuplicates: false });
        }

        logger.info('Wallet saved successfully');
        logger.complete(true);
        return ApiResponse.success({
            success: true,
            address: data.address,
            network: data.network,
            updated_at: data.updated_at
        });

    } catch (error) {
        logger.error('Unexpected error', error);
        logger.complete(false);
        return ApiResponse.serverError();
    }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
    return ApiResponse.options();
}
