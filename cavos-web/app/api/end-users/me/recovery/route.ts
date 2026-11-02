/**
 * POST /api/end-users/me/recovery  Disable or re-enable enclave recovery.
 *
 * Disabling removes the sealed copy Cavos holds and blocks new enrollments.
 * Consent is a signature from one of the user's wallet keys over a challenge.
 */

import { NextResponse, after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiLogger } from '@/lib/api/logger';
import { ApiMiddleware } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';
import { readConsentChallenge, verifyConsentProof, type ConsentAction } from '@/lib/endUsers/consent';
import { authorizeEndUser, recoveryState } from '@/lib/endUsers/session';
import { recordCavosEvent } from '@/lib/operations/events';

export async function POST(request: Request) {
    const logger = ApiLogger.createRequestLogger('/api/end-users/me/recovery', 'POST');
    try {
        const rl = checkRateLimit(`end-user-recovery:${clientIp(request)}`, 10, 60_000);
        if (!rl.allowed) {
            return ApiResponse.error('rate_limited', 429);
        }
        const body = await ApiMiddleware.parseBody<Record<string, unknown>>(request);
        if (!body) return ApiResponse.badRequest('Invalid request body');
        const { enabled, challenge, proof } = body;
        if (typeof enabled !== 'boolean' || typeof challenge !== 'string' || !proof) {
            return ApiResponse.badRequest('Missing required fields', { required: ['enabled', 'challenge', 'proof'] });
        }
        const owner = await authorizeEndUser(request, logger, body);
        if (owner instanceof NextResponse) return owner;

        const admin = createAdminClient();
        const { data: wallets, error } = await admin
            .from('wallets')
            .select('network, address')
            .eq('app_id', owner.appId)
            .eq('environment_id', owner.environmentId)
            .eq('user_social_id', owner.sub);
        if (error) {
            logger.error('Database error', error);
            return ApiResponse.serverError('Failed to update recovery');
        }
        if (!wallets?.length) return ApiResponse.notFound('wallet_not_found');

        const action: ConsentAction = enabled ? 'enable_recovery' : 'disable_recovery';
        try {
            readConsentChallenge(challenge, {
                appId: owner.appId,
                environmentId: owner.environmentId,
                sub: owner.sub,
                action,
                state: await recoveryState(owner),
            });
        } catch {
            return ApiResponse.error('invalid_consent', 403);
        }
        if (!verifyConsentProof(proof, challenge, wallets)) {
            return ApiResponse.error('invalid_consent', 403);
        }

        const { error: rpcError } = await admin.rpc('set_enclave_recovery', {
            p_app: owner.appId,
            p_env: owner.environmentId,
            p_sub: owner.sub,
            p_enabled: enabled,
        });
        if (rpcError) {
            logger.error('Database error', rpcError);
            return ApiResponse.serverError('Failed to update recovery');
        }
        after(() =>
            recordCavosEvent({
                appId: owner.appId,
                environmentId: owner.environmentId,
                eventType: enabled ? 'user.recovery_enabled' : 'user.recovery_disabled',
                status: 'success',
                requestId: logger.requestId,
                metadata: { user_social_id: owner.sub },
                expiresAt: new Date(),
            }),
        );
        logger.complete(true);
        return ApiResponse.success({ recovery: enabled ? 'on' : 'off' });
    } catch (error) {
        logger.error('Unexpected error', error);
        return ApiResponse.serverError();
    }
}

export async function OPTIONS() {
    return ApiResponse.options();
}
