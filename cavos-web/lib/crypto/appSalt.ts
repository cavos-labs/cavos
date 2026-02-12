/**
 * Per-App Salt Computation
 * 
 * Computes a unique salt for each app_id using Poseidon hash.
 * This ensures each app gets unique wallet addresses per user.
 * 
 * Formula: app_salt = Poseidon(app_id_felt, base_salt_felt)
 */

import { hash, num } from 'starknet';

/**
 * Compute the per-app salt from an app UUID and base salt.
 * @param appId - The app UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * @param baseSalt - The base salt from environment (hex string)
 * @returns The computed app_salt as hex string
 */
export function computeAppSalt(appId: string, baseSalt: string): string {
    // Convert UUID to felt by hashing it (UUIDs are too long for felt252)
    const appIdFelt = uuidToFelt(appId);
    const baseSaltFelt = num.toHex(baseSalt);

    // Poseidon([app_id, base_salt])
    return hash.computePoseidonHashOnElements([appIdFelt, baseSaltFelt]);
}

/**
 * Convert a UUID string to a felt252.
 * Removes hyphens and converts hex to felt.
 */
function uuidToFelt(uuid: string): string {
    // Remove hyphens: 550e8400-e29b-41d4-a716-446655440000 -> 550e8400e29b41d4a716446655440000
    const hex = uuid.replace(/-/g, '');
    // UUID is 128 bits (32 hex chars), fits in felt252
    return '0x' + hex;
}
