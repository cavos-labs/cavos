/**
 * GET  /api/passkey-wraps  List the passkey wraps of a user's native wallet.
 * POST /api/passkey-wraps  Store one.
 *
 * A wrap is the wallet's DEK encrypted by the kit under a passkey's PRF, which
 * never reaches this server. Only the end user may read or add their own.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiLogger } from '@/lib/api/logger';
import { ApiMiddleware } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response';
import { checkRateLimit, clientIp } from '@/lib/api/rateLimit';
import { isSubject, verifyUserToken } from '@/lib/api/verifyUserToken';
import { MAX_WRAPS_PER_USER, parsePasskeyWrap } from '@/lib/api/passkeyWraps';

type Owner = { appId: string; environmentId: string; userSocialId: string };
type Logger = ReturnType<typeof ApiLogger.createRequestLogger>;

/** The app, its environment and the user, once the caller is proven to be that user. */
async function authorize(
    request: Request,
    logger: Logger,
    params: { appId: unknown; userSocialId: unknown; environment: unknown },
): Promise<Owner | NextResponse> {
    const { appId, userSocialId, environment } = params;
    if (typeof appId !== 'string' || typeof userSocialId !== 'string' || !appId || !userSocialId) {
        return ApiResponse.badRequest('Missing required fields', { required: ['app_id', 'user_social_id'] });
    }
    const { valid, app, resolved } = await ApiMiddleware.verifyAppId(
        appId,
        logger,
        typeof environment === 'string' ? environment : null,
    );
    if (!valid || !app || !resolved?.environmentId) return ApiResponse.unauthorized('Invalid App ID');
    if (!isSubject(await verifyUserToken(request), userSocialId)) {
        return ApiResponse.unauthorized('Invalid user token');
    }
    return { appId: app.id, environmentId: resolved.environmentId, userSocialId };
}

export async function GET(request: Request) {
    const logger = ApiLogger.createRequestLogger('/api/passkey-wraps', 'GET');
    try {
        const params = new URL(request.url).searchParams;
        const owner = await authorize(request, logger, {
            appId: params.get('app_id'),
            userSocialId: params.get('user_social_id'),
            environment: params.get('environment'),
        });
        if (owner instanceof NextResponse) return owner;

        const { data, error } = await createAdminClient()
            .from('passkey_dek_wraps')
            .select('credential_id, wrapped_dek')
            .eq('app_id', owner.appId)
            .eq('environment_id', owner.environmentId)
            .eq('user_social_id', owner.userSocialId)
            .order('created_at');
        if (error) {
            logger.error('Database error', error);
            return ApiResponse.serverError('Failed to read passkey wraps');
        }
        logger.complete(true);
        return ApiResponse.success({ wraps: data ?? [] });
    } catch (error) {
        logger.error('Unexpected error', error);
        return ApiResponse.serverError();
    }
}

export async function POST(request: Request) {
    const logger = ApiLogger.createRequestLogger('/api/passkey-wraps', 'POST');
    try {
        const rl = checkRateLimit(`passkey-wraps:${clientIp(request)}`, 10, 60_000);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'rate_limited', message: 'Too many passkey requests. Slow down.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
            );
        }

        const body = await ApiMiddleware.parseBody<Record<string, unknown>>(request);
        if (!body) return ApiResponse.badRequest('Invalid request body');
        const wrap = parsePasskeyWrap(body);
        if ('error' in wrap) return ApiResponse.badRequest(wrap.error);
        const owner = await authorize(request, logger, {
            appId: body.app_id,
            userSocialId: body.user_social_id,
            environment: body.environment,
        });
        if (owner instanceof NextResponse) return owner;

        const admin = createAdminClient();
        const { count, error: countError } = await admin
            .from('passkey_dek_wraps')
            .select('id', { count: 'exact', head: true })
            .eq('app_id', owner.appId)
            .eq('environment_id', owner.environmentId)
            .eq('user_social_id', owner.userSocialId);
        if (countError) {
            logger.error('Database error', countError);
            return ApiResponse.serverError('Failed to save passkey wrap');
        }
        if ((count ?? 0) >= MAX_WRAPS_PER_USER) {
            return ApiResponse.badRequest(`At most ${MAX_WRAPS_PER_USER} passkeys per wallet`);
        }

        // One row per passkey, never overwritten: a replaced copy could lock the user out.
        const { error } = await admin.from('passkey_dek_wraps').upsert(
            {
                app_id: owner.appId,
                environment_id: owner.environmentId,
                user_social_id: owner.userSocialId,
                credential_id: wrap.credentialId,
                wrapped_dek: wrap.wrappedDek,
            },
            { onConflict: 'app_id,environment_id,user_social_id,credential_id', ignoreDuplicates: true },
        );
        if (error) {
            logger.error('Database error', error);
            return ApiResponse.serverError('Failed to save passkey wrap');
        }
        logger.complete(true);
        return ApiResponse.success({ saved: true });
    } catch (error) {
        logger.error('Unexpected error', error);
        return ApiResponse.serverError();
    }
}

export async function OPTIONS() {
    return ApiResponse.options();
}
