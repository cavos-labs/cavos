/**
 * API Validation Utilities
 * Type-safe request validation helpers
 */

import { isValidNetwork } from '@/lib/constants/networks';

export class ApiValidator {
    /**
     * Validate required fields in request body
     */
    static validateRequired<T extends Record<string, any>>(
        body: any,
        requiredFields: (keyof T)[]
    ): { valid: boolean; missing?: string[] } {
        const missing: string[] = [];

        for (const field of requiredFields) {
            if (!body[field]) {
                missing.push(field as string);
            }
        }

        if (missing.length > 0) {
            return { valid: false, missing };
        }

        return { valid: true };
    }

    /**
     * Validate app ID format
     */
    static isValidAppId(appId: string): boolean {
        // UUID v4 format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(appId);
    }

    /**
     * Validate network
     */
    static isValidNetwork(network: string): boolean {
        // Single source of truth (lib/constants/networks.ts) so Starknet and
        // Solana networks stay in sync across validation + dashboard UI.
        return isValidNetwork(network);
    }

    /**
     * Validate Ethereum address format
     */
    static isValidAddress(address: string): boolean {
        // Basic hex address validation (0x + 64 hex chars for Starknet)
        return /^0x[0-9a-fA-F]{64}$/.test(address) || /^0x[0-9a-fA-F]{40}$/.test(address);
    }
}
