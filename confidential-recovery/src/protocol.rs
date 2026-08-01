use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SocialProvider {
    Google,
    Apple,
    Email,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderCredential {
    pub provider: SocialProvider,
    /// Raw OIDC ID token. It reaches this workload only inside the P-256
    /// application-layer encrypted channel.
    pub id_token: String,
    /// Base64url SHA-256 of `id_token`. The control plane stores only a second
    /// SHA-256 of this value to enforce single use.
    pub token_fingerprint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryPolicy {
    pub app_id: String,
    pub environment_id: String,
    pub provider: SocialProvider,
    pub issuer: String,
    pub audience: String,
    pub jwks_uri: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "action", rename_all = "snake_case")]
pub enum WorkloadJob {
    Enroll {
        credential: ProviderCredential,
        policy: RecoveryPolicy,
        /// Present only for Stellar classic accounts. This is the random DEK
        /// which encrypts the Stellar control seed; the control seed itself is
        /// never sent to or stored by the enclave.
        stellar_dek_b64: Option<String>,
    },
    Recover {
        credential: ProviderCredential,
        sealed_record_b64: String,
        authorizations: Vec<ChainAuthorization>,
        stellar_recipient_pubkey_b64: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "chain", rename_all = "snake_case")]
pub enum ChainAuthorization {
    Starknet {
        chain_id_hex: String,
        account_hex: String,
        new_x_hex: String,
        new_y_hex: String,
        recovery_nonce: String,
        expires_at: u64,
    },
    Solana {
        account_b58_bytes_b64: String,
        new_pubkey_b64: String,
        /// Decimal string to avoid precision loss in browser JSON runtimes.
        recovery_nonce: String,
        expires_at: i64,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SealedRecoveryRecord {
    pub version: u8,
    pub policy: RecoveryPolicy,
    pub identity_commitment_hex: String,
    pub recovery_private_key_b64: String,
    pub stellar_dek_b64: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "result", rename_all = "snake_case")]
pub enum WorkloadResult {
    Enrolled {
        sealed_record_b64: String,
        identity_commitment_hex: String,
        policy_hash_hex: String,
        recovery_pubkey_compressed_b64: String,
        recovery_x_hex: String,
        recovery_y_hex: String,
    },
    Recovered {
        identity_commitment_hex: String,
        authorizations: Vec<SignedAuthorization>,
        stellar_device_wrap_b64: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "chain", rename_all = "snake_case")]
pub enum SignedAuthorization {
    Starknet {
        digest_hex: String,
        r_hex: String,
        s_hex: String,
        y_parity: bool,
        recovery_nonce: String,
        expires_at: u64,
    },
    Solana {
        message_b64: String,
        signature_b64: String,
        recovery_pubkey_compressed_b64: String,
        recovery_nonce: String,
        expires_at: i64,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedJob {
    pub client_public_key_b64: String,
    pub nonce_b64: String,
    pub ciphertext_b64: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkloadRegistration {
    pub session_id: String,
    pub ephemeral_public_key_b64: String,
    pub attestation_token: String,
    pub attestation_nonce_b64: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistrationResponse {
    pub workload_token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobResponse {
    pub job: Option<EncryptedJob>,
    pub auth_challenge_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletionRequest {
    pub result: WorkloadResult,
}
