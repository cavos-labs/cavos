/**
 * API Logger Utility
 * Provides structured logging with request tracking
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
    requestId?: string;
    endpoint?: string;
    method?: string;
    [key: string]: any;
}

export class ApiLogger {
    private static generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    static createRequestLogger(endpoint: string, method: string) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();

        return {
            requestId,
            info: (message: string, data?: any) => {
                console.log(`[${requestId}] [${endpoint}] ${message}`, data || '');
            },
            warn: (message: string, data?: any) => {
                console.warn(`[${requestId}] [${endpoint}] ${message}`, data || '');
            },
            error: (message: string, error?: any) => {
                console.error(`[${requestId}] [${endpoint}] ${message}`, error || '');
            },
            debug: (message: string, data?: any) => {
                if (process.env.NODE_ENV === 'development') {
                    console.debug(`[${requestId}] [${endpoint}] ${message}`, data || '');
                }
            },
            complete: (success: boolean = true) => {
                const duration = Date.now() - startTime;
                const status = success ? 'SUCCESS' : 'FAILED';
                console.log(`[${requestId}] [${endpoint}] ${status} in ${duration}ms`);
            }
        };
    }
}
