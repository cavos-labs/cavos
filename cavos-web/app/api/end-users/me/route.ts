/**
 * DELETE /api/end-users/me  Delete the user's account data in one environment.
 *
 * Consent is a wallet-key signature over a challenge. A user with no recovery
 * material left to protect may instead prove consent with a fresh login token.
 */

import { NextResponse, after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiLogger } from '@/lib/api/logger';
import { ApiMiddleware } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';
import { readConsentChallenge, verifyConsentProof } from '@/lib/endUsers/consent';
import { authorizeEndUser, recoveryState } from '@/lib/endUsers/session';
import { recordCavosEvent } from '@/lib/operations/events';

const FRESH_TOKEN_SECONDS = 600;

export async function DELETE(request: Request) {
    const logger = ApiLogger.createRequestLogger('/api/end-users/me', 'DELETE');
    try {
        const rl = checkRateLimit(`end-user-delete:${clientIp(request)}`, 5, 60_000);
        if (!rl.allowed) {
            return ApiResponse.error('rate_limited', 429);
        }
        const body = await ApiMiddleware.parseBody<Record<string, unknown>>(request);
        if (!body) return ApiResponse.badRequest('Invalid request body');
        const { challenge, proof } = body;
        if (typeof challenge !== 'string') return ApiResponse.badRequest('Missing required fields', { required: ['challenge'] });
        const owner = await authorizeEndUser(request, logger, body);
        if (owner instanceof NextResponse) return owner;

        try {
            readConsentChallenge(challenge, {
                appId: owner.appId,
                environmentId: owner.environmentId,
                sub: owner.sub,
                action: 'delete_account',
                state: await recoveryState(owner),
            });
        } catch {
            return ApiResponse.error('invalid_consent', 403);
        }

        const admin = createAdminClient();
        const { data: wallets, error } = await admin
            .from('wallets')
            .select('id, network, address')
            .eq('app_id', owner.appId)
            .eq('environment_id', owner.environmentId)
            .eq('user_social_id', owner.sub);
        if (error) {
            logger.error('Database error', error);
            return ApiResponse.serverError('Failed to delete account');
        }

        if (wallets?.length) {
            if (proof) {
                if (!verifyConsentProof(proof, challenge, wallets)) {
                    return ApiResponse.error('invalid_consent', 403);
                }
            } else {
                const issuedAt = owner.user.issuedAt;
                const fresh = issuedAt !== null && Date.now() / 1000 - issuedAt <= FRESH_TOKEN_SECONDS;
                const [enrollments, wraps] = await Promise.all([
                    admin
                        .from('social_recovery_enrollments')
                        .select('wallet_id', { count: 'exact', head: true })
                        .in('wallet_id', wallets.map((wallet) => wallet.id)),
                    admin
                        .from('passkey_dek_wraps')
                        .select('id', { count: 'exact', head: true })
                        .eq('app_id', owner.appId)
                        .eq('environment_id', owner.environmentId)
                        .eq('user_social_id', owner.sub),
                ]);
                if (enrollments.error || wraps.error) {
                    logger.error('Database error', enrollments.error ?? wraps.error);
                    return ApiResponse.serverError('Failed to delete account');
                }
                if (!fresh || (enrollments.count ?? 0) > 0 || (wraps.count ?? 0) > 0) {
                    return ApiResponse.error('consent_proof_required', 403);
                }
            }

            const { error: rpcError } = await admin.rpc('delete_end_user', {
                p_app: owner.appId,
                p_env: owner.environmentId,
                p_sub: owner.sub,
            });
            if (rpcError) {
                logger.error('Database error', rpcError);
                return ApiResponse.serverError('Failed to delete account');
            }
        }

        after(() =>
            recordCavosEvent({
                appId: owner.appId,
                environmentId: owner.environmentId,
                eventType: 'user.deleted',
                status: 'success',
                requestId: logger.requestId,
                metadata: { user_social_id: owner.sub },
                expiresAt: new Date(),
            }),
        );
        logger.complete(true);
        return ApiResponse.success({ deleted: true });
    } catch (error) {
        logger.error('Unexpected error', error);
        return ApiResponse.serverError();
    }
}

export async function OPTIONS() {
    return ApiResponse.options();
}
