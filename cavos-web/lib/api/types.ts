/**
 * API Type Definitions
 */

export interface WalletSaveRequest {
    app_id: string;
    user_social_id: string;
    network: string;
    address: string;
    /** Legacy JWT/WebAuthn wallets store an encrypted key here; device-signer wallets send `devices` instead. */
    encrypted_pk_blob?: string;
    email?: string;
    /** Device-signer wallets: the authorized device public keys (secp256r1, hex). */
    devices?: { x: string; y: string; label?: string }[];
}

export interface WalletGetRequest {
    app_id: string;
    user_social_id: string;
    network: string;
}

export interface WalletResponse {
    found: boolean;
    encrypted_pk_blob?: string;
    address?: string;
    email?: string;
    updated_at?: string;
}

export interface ApiError {
    error: string;
    details?: any;
    missing?: string[];
}
