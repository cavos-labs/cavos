/**
 * POST /api/wallets
 * Save or update a wallet
 * 
 * GET /api/wallets
 * Retrieve a wallet
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { ApiLogger } from '@/lib/api/logger';
import { ApiResponse } from '@/lib/api/response';
import { ApiValidator } from '@/lib/api/validation';
import { ApiMiddleware } from '@/lib/api/middleware';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';
import { canCreateWallet, resolveOrgForApp } from '@/lib/billing/limits';
import { shouldBlock } from '@/lib/billing/enforce';
import type { WalletSaveRequest, WalletGetRequest } from '@/lib/api/types';
import { recordCavosEvent, resolveEnvironment } from '@/lib/operations/events';

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
        const environmentId = searchParams.get('environment_id') ?? searchParams.get('environment');

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
            await recordCavosEvent({ appId: app_id, eventType: 'api.authentication_failed', status: 'failed', severity: 'warning', requestId: logger.requestId, errorCode: 'invalid_app_id' });
            return ApiResponse.unauthorized('Invalid App ID');
        }

        // Fetch wallet (+ its authorized device signers via wallet_devices).
        logger.debug('Fetching wallet', { user_social_id, network });
        const adminSupabase = createAdminClient();
        const environment = await resolveEnvironment(app_id, environmentId);
        if (!environment) return ApiResponse.serverError('Production environment is not configured for this app');
        let walletQuery = adminSupabase
            .from('wallets')
            .select('encrypted_pk_blob, address, updated_at, wallet_devices(pub_x, pub_y, device_label)')
            .eq('app_id', app_id)
            .eq('user_social_id', user_social_id)
            .eq('network', network);
        if (environment?.id) walletQuery = walletQuery.eq('environment_id', environment.id);
        const { data, error } = await walletQuery.single();

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
        await recordCavosEvent({ appId: app_id, environmentId: environment?.id, eventType: 'wallet.retrieved', status: 'success', requestId: logger.requestId, network });
        logger.complete(true);
        return ApiResponse.success({
            found: true,
            request_id: logger.requestId,
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
        // IP rate-limit (best-effort, per-process) — near-term quota-griefing cap
        // while the wallet routes are un-keyed. See lib/api/rateLimit.ts.
        const ip = clientIp(request);
        const rl = checkRateLimit(`wallet-create:${ip}`, 20, 60_000);
        if (!rl.allowed) {
            logger.warn('Wallet creation rate-limited', { ip });
            return NextResponse.json(
                { error: 'rate_limited', message: 'Too many wallet requests. Slow down.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
            );
        }

        // Parse request body
        const body = await ApiMiddleware.parseBody<WalletSaveRequest>(request);
        if (!body) {
            logger.warn('Invalid JSON body');
            return ApiResponse.badRequest('Invalid request body');
        }

        const { app_id, user_social_id, network, address, encrypted_pk_blob, email, devices } = body;
        const environmentBody = body as WalletSaveRequest & { environment_id?: string; environment?: 'development' | 'production' };
        const requestedEnvironment = environmentBody.environment_id ?? environmentBody.environment;

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
            await recordCavosEvent({ appId: app_id, eventType: 'api.authentication_failed', status: 'failed', severity: 'warning', requestId: logger.requestId, errorCode: 'invalid_app_id' });
            return ApiResponse.unauthorized('Invalid App ID');
        }
        const environment = await resolveEnvironment(app_id, requestedEnvironment);
        if (requestedEnvironment && !environment) return ApiResponse.badRequest('environment does not belong to app_id');
        if (!environment) return ApiResponse.serverError('Production environment is not configured for this app');
        await recordCavosEvent({ appId: app_id, environmentId: environment?.id, eventType: 'wallet.creation_requested', status: 'pending', requestId: logger.requestId, network });

        // ── Billing gate ────────────────────────────────────────────────────
        // Only the creation of NEW wallets is gated. Existing wallets are always
        // readable/signable. So we pre-check existence by the kit conflict key
        // `(app_id, user_social_id, network)` and skip the gate on re-save.
        // Resolves app_id → org internally; both SDKs already send app_id, so
        // this needs no SDK change. See lib/billing/limits.ts.
        const adminSupabase = createAdminClient();
        const { data: existingWallet } = await adminSupabase
            .from('wallets')
            .select('id')
            .eq('app_id', app_id)
            .eq('environment_id', environment!.id)
            .eq('user_social_id', user_social_id)
            .eq('network', network)
            .limit(1)
            .maybeSingle();

        if (!existingWallet) {
            const orgId = await resolveOrgForApp(app_id);
            if (orgId) {
                const gate = await canCreateWallet(orgId);
                if (!gate.allowed) {
                    const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/billing`;
                    if (shouldBlock(gate.allowed)) {
                        logger.warn('Wallet creation blocked — org at limit', {
                            app_id, org_id: orgId, count: gate.count, limit: gate.limit
                        });
                        logger.complete(false);
                        return ApiResponse.paymentRequired('wallet_limit_reached', {
                            count: gate.count,
                            limit: gate.limit,
                            upgrade_url: upgradeUrl,
                        });
                    }
                    // warn mode: log + allow through so we can soak before enforcing.
                    logger.warn('Wallet creation over limit (warn mode, allowing)', {
                        app_id, org_id: orgId, count: gate.count, limit: gate.limit
                    });
                }
            }
        }

        // Check if email is verified via firebase verification tokens (for Firebase email/password users)
        let emailVerified = false;
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
            environment_id: environment?.id ?? null,
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
                    onConflict: 'app_id,environment_id,user_social_id,network',
                    ignoreDuplicates: false
                }
            )
            .select()
            .single();

        if (error) {
            await recordCavosEvent({ appId: app_id, environmentId: environment?.id, eventType: 'wallet.creation_failed', status: 'failed', requestId: logger.requestId, network, errorCode: 'database_write_failed' });
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
        await recordCavosEvent({ appId: app_id, environmentId: environment?.id, walletId: data.id, eventType: existingWallet ? 'wallet.updated' : 'wallet.created', status: 'success', requestId: logger.requestId, network, metadata: { device_count: devices?.length ?? 0 } });
        logger.complete(true);
        return ApiResponse.success({
            success: true,
            request_id: logger.requestId,
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
