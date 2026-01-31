/**
 * API Type Definitions
 */

export interface WalletSaveRequest {
    app_id: string;
    user_social_id: string;
    network: string;
    address: string;
    encrypted_pk_blob: string;
    email?: string;
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
