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

        // Fetch wallet
        logger.debug('Fetching wallet', { user_social_id, network });
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('wallets')
            .select('encrypted_pk_blob, address, email, updated_at')
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
            email: data.email,
            updated_at: data.updated_at
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

        const { app_id, user_social_id, network, address, encrypted_pk_blob, email } = body;

        // Validate required fields
        const validation = ApiValidator.validateRequired<WalletSaveRequest>(body, [
            'app_id',
            'user_social_id',
            'network',
            'address',
            'encrypted_pk_blob'
        ]);

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

        // Save wallet
        logger.debug('Saving wallet', { user_social_id, network, address });
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('wallets')
            .upsert(
                {
                    app_id,
                    user_social_id,
                    network,
                    address,
                    encrypted_pk_blob,
                    email: email || null,
                    updated_at: new Date().toISOString(),
                },
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
