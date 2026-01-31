/**
 * API Middleware
 * Reusable middleware for common operations
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { ApiResponse } from './response';
import { ApiLogger } from './logger';

export class ApiMiddleware {
    /**
     * Verify app ID exists in database
     */
    static async verifyAppId(appId: string, logger: ReturnType<typeof ApiLogger.createRequestLogger>) {
        logger.debug('Verifying app_id', { appId });

        const adminSupabase = createAdminClient();
        const { data: app, error } = await adminSupabase
            .from('apps')
            .select('id, name')
            .eq('id', appId)
            .single();

        if (error || !app) {
            logger.warn('Invalid app_id', { appId, error: error?.message });
            return { valid: false, app: null };
        }

        logger.debug('App verified', { appName: app.name });
        return { valid: true, app };
    }

    /**
     * Parse and validate JSON request body
     */
    static async parseBody<T = any>(request: Request): Promise<T | null> {
        try {
            return await request.json();
        } catch (error) {
            return null;
        }
    }
}
