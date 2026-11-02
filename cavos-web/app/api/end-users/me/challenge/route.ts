/**
 * POST /api/end-users/me/challenge  Issue a consent challenge for an account action.
 */

import { NextResponse } from 'next/server';
import { ApiLogger } from '@/lib/api/logger';
import { ApiMiddleware } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';
import { issueConsentChallenge, type ConsentAction } from '@/lib/endUsers/consent';
import { authorizeEndUser, recoveryState } from '@/lib/endUsers/session';

const ACTIONS: ConsentAction[] = ['delete_account', 'disable_recovery', 'enable_recovery'];

export async function POST(request: Request) {
    const logger = ApiLogger.createRequestLogger('/api/end-users/me/challenge', 'POST');
    try {
        const rl = checkRateLimit(`end-user-challenge:${clientIp(request)}`, 20, 60_000);
        if (!rl.allowed) {
            return ApiResponse.error('rate_limited', 429);
        }
        const body = await ApiMiddleware.parseBody<Record<string, unknown>>(request);
        if (!body) return ApiResponse.badRequest('Invalid request body');
        const action = ACTIONS.find((candidate) => candidate === body.action);
        if (!action) return ApiResponse.badRequest('Invalid action', { allowed: ACTIONS });
        const owner = await authorizeEndUser(request, logger, body);
        if (owner instanceof NextResponse) return owner;

        const challenge = issueConsentChallenge({
            appId: owner.appId,
            environmentId: owner.environmentId,
            sub: owner.sub,
            action,
            state: await recoveryState(owner),
        });
        logger.complete(true);
        return ApiResponse.success({ challenge });
    } catch (error) {
        logger.error('Unexpected error', error);
        return ApiResponse.serverError();
    }
}

export async function OPTIONS() {
    return ApiResponse.options();
}
