import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiMiddleware } from '@/lib/api/middleware';
import { ApiResponse } from '@/lib/api/response';
import { isUserOfApp, verifyUserToken, type VerifiedUser } from '@/lib/api/verifyUserToken';
import type { ApiLogger } from '@/lib/api/logger';

export interface EndUser {
    appId: string;
    environmentId: string;
    sub: string;
    user: VerifiedUser;
}

/** Resolves the app and environment and proves the bearer token is a user of that app. */
export async function authorizeEndUser(
    request: Request,
    logger: ReturnType<typeof ApiLogger.createRequestLogger>,
    body: Record<string, unknown>,
): Promise<EndUser | NextResponse> {
    const { app_id: appId, environment } = body;
    if (typeof appId !== 'string' || !appId) {
        return ApiResponse.badRequest('Missing required fields', { required: ['app_id'] });
    }
    const { valid, app, resolved } = await ApiMiddleware.verifyAppId(
        appId,
        logger,
        typeof environment === 'string' ? environment : null,
    );
    if (!valid || !app || !resolved?.environmentId) return ApiResponse.unauthorized('Invalid App ID');
    const user = await verifyUserToken(request);
    if (!user || !isUserOfApp(user, user.sub, app.id)) return ApiResponse.unauthorized('Invalid user token');
    return { appId: app.id, environmentId: resolved.environmentId, sub: user.sub, user };
}

/** Whether Cavos currently holds the user's sealed recovery copy. */
export async function recoveryState(owner: EndUser): Promise<'on' | 'off'> {
    const { data } = await createAdminClient()
        .from('recovery_opt_outs')
        .select('user_social_id')
        .eq('app_id', owner.appId)
        .eq('environment_id', owner.environmentId)
        .eq('user_social_id', owner.sub)
        .maybeSingle();
    return data ? 'off' : 'on';
}
