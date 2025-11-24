/**
 * API Response Helpers
 * Standardized response utilities with CORS headers
 */

import { NextResponse } from 'next/server';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-app-id',
};

export class ApiResponse {
    /**
     * Success response
     */
    static success<T = any>(data: T, status: number = 200): NextResponse {
        return NextResponse.json(data, {
            status,
            headers: CORS_HEADERS,
        });
    }

    /**
     * Error response
     */
    static error(
        message: string,
        status: number = 500,
        details?: any
    ): NextResponse {
        const body: any = { error: message };
        if (details && process.env.NODE_ENV === 'development') {
            body.details = details;
        }
        return NextResponse.json(body, {
            status,
            headers: CORS_HEADERS,
        });
    }

    /**
     * Bad request (400)
     */
    static badRequest(message: string, details?: any): NextResponse {
        return this.error(message, 400, details);
    }

    /**
     * Unauthorized (401)
     */
    static unauthorized(message: string = 'Unauthorized'): NextResponse {
        return this.error(message, 401);
    }

    /**
     * Not found (404)
     */
    static notFound(message: string = 'Resource not found'): NextResponse {
        return this.error(message, 404);
    }

    /**
     * Internal server error (500)
     */
    static serverError(message: string = 'Internal server error', error?: any): NextResponse {
        return this.error(message, 500, error?.message);
    }

    /**
     * OPTIONS preflight response
     */
    static options(): NextResponse {
        return new NextResponse(null, {
            status: 200,
            headers: CORS_HEADERS,
        });
    }
}
