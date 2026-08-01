use anyhow::{bail, Context, Result};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use jsonwebtoken::{
    decode, decode_header,
    jwk::{AlgorithmParameters, JwkSet},
    Algorithm, DecodingKey, Validation,
};
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::time::{SystemTime, UNIX_EPOCH};
use subtle::ConstantTimeEq;

use crate::protocol::{ProviderCredential, RecoveryPolicy, SocialProvider};

const MAX_AUTH_AGE_SECONDS: u64 = 5 * 60;
const CLOCK_SKEW_SECONDS: u64 = 30;

#[derive(Debug, Deserialize)]
pub struct IdentityClaims {
    pub sub: String,
    pub iss: String,
    #[serde(default)]
    pub aud: Audience,
    #[serde(rename = "exp")]
    pub _exp: u64,
    pub iat: u64,
    #[serde(default)]
    pub auth_time: Option<u64>,
    #[serde(default)]
    pub nonce: Option<String>,
    #[serde(default)]
    pub email_verified: Option<serde_json::Value>,
    #[serde(default)]
    pub firebase: Option<FirebaseClaims>,
}

#[derive(Debug, Deserialize)]
pub struct FirebaseClaims {
    #[serde(default)]
    pub sign_in_provider: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(untagged)]
pub enum Audience {
    One(String),
    Many(Vec<String>),
    #[default]
    Missing,
}

impl Audience {
    fn contains(&self, expected: &str) -> bool {
        match self {
            Self::One(value) => value == expected,
            Self::Many(values) => values.iter().any(|value| value == expected),
            Self::Missing => false,
        }
    }
}

pub async fn verify_id_token(
    http: &reqwest::Client,
    credential: &ProviderCredential,
    policy: &RecoveryPolicy,
    expected_auth_challenge_hash: &str,
) -> Result<IdentityClaims> {
    validate_provider_policy(policy)?;
    verify_credential_binding(credential, expected_auth_challenge_hash)?;
    let token = &credential.id_token;
    let header = decode_header(token).context("invalid OIDC token header")?;
    let kid = header.kid.context("OIDC token omitted kid")?;
    let jwks: JwkSet = http
        .get(&policy.jwks_uri)
        .send()
        .await
        .context("JWKS request failed")?
        .error_for_status()
        .context("JWKS endpoint rejected request")?
        .json()
        .await
        .context("invalid JWKS")?;
    let jwk = jwks
        .keys
        .iter()
        .find(|key| key.common.key_id.as_deref() == Some(kid.as_str()))
        .context("OIDC signing key not found")?;

    let (algorithm, decoding_key) = match &jwk.algorithm {
        AlgorithmParameters::RSA(rsa) => (
            Algorithm::RS256,
            DecodingKey::from_rsa_components(&rsa.n, &rsa.e)
                .context("invalid RSA JWK")?,
        ),
        AlgorithmParameters::EllipticCurve(ec) => {
            let x = URL_SAFE_NO_PAD.decode(&ec.x)?;
            let y = URL_SAFE_NO_PAD.decode(&ec.y)?;
            (
                Algorithm::ES256,
                DecodingKey::from_ec_components(&URL_SAFE_NO_PAD.encode(x), &URL_SAFE_NO_PAD.encode(y))
                    .context("invalid EC JWK")?,
            )
        }
        _ => bail!("unsupported OIDC signing key type"),
    };
    if header.alg != algorithm {
        bail!("OIDC alg/key mismatch");
    }

    let mut validation = Validation::new(algorithm);
    validation.set_issuer(&[policy.issuer.as_str()]);
    validation.set_audience(&[policy.audience.as_str()]);
    validation.validate_exp = true;
    validation.leeway = 30;
    let claims = decode::<IdentityClaims>(token, &decoding_key, &validation)
        .context("OIDC signature/claims verification failed")?
        .claims;
    if claims.iss != policy.issuer || !claims.aud.contains(&policy.audience) {
        bail!("OIDC issuer or audience mismatch");
    }
    let email_verified = match claims.email_verified.as_ref() {
        Some(serde_json::Value::Bool(true)) => true,
        Some(serde_json::Value::String(value)) => value == "true",
        _ => false,
    };
    if matches!(policy.provider, SocialProvider::Email) && !email_verified {
        bail!("email identity is not verified");
    }
    enforce_recent_auth(&claims, &policy.provider, unix_time()?)?;
    Ok(claims)
}

fn verify_credential_binding(
    credential: &ProviderCredential,
    expected_auth_challenge_hash: &str,
) -> Result<()> {
    let fingerprint = URL_SAFE_NO_PAD.encode(Sha256::digest(credential.id_token.as_bytes()));
    if fingerprint.len() != 43
        || credential.token_fingerprint.len() != 43
        || fingerprint
            .as_bytes()
            .ct_eq(credential.token_fingerprint.as_bytes())
            .unwrap_u8()
            != 1
    {
        bail!("social credential fingerprint mismatch");
    }
    let stored_hash = hex_sha256(credential.token_fingerprint.as_bytes());
    if expected_auth_challenge_hash.len() != 64
        || stored_hash
            .as_bytes()
            .ct_eq(expected_auth_challenge_hash.as_bytes())
            .unwrap_u8()
            != 1
    {
        bail!("social credential is not bound to this recovery session");
    }
    Ok(())
}

fn enforce_recent_auth(
    claims: &IdentityClaims,
    provider: &SocialProvider,
    now: u64,
) -> Result<()> {
    let authenticated_at = claims.auth_time.unwrap_or(claims.iat);
    if authenticated_at > now.saturating_add(CLOCK_SKEW_SECONDS) {
        bail!("social authentication time is in the future");
    }
    if now.saturating_sub(authenticated_at) > MAX_AUTH_AGE_SECONDS {
        bail!("social authentication is too old; sign in again");
    }

    match provider {
        SocialProvider::Google | SocialProvider::Apple => {
            if claims.nonce.as_deref().is_none_or(|nonce| nonce.len() < 16) {
                bail!("OIDC token is not bound to a login nonce");
            }
        }
        SocialProvider::Email => {
            let sign_in_provider = claims
                .firebase
                .as_ref()
                .and_then(|firebase| firebase.sign_in_provider.as_deref());
            if !matches!(sign_in_provider, Some("password") | Some("emailLink")) {
                bail!("Firebase token was not issued by the email provider");
            }
        }
    }
    Ok(())
}

fn unix_time() -> Result<u64> {
    Ok(SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .context("system clock is before Unix epoch")?
        .as_secs())
}

fn hex_sha256(value: &[u8]) -> String {
    Sha256::digest(value)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn validate_provider_policy(policy: &RecoveryPolicy) -> Result<()> {
    let allowed = match policy.provider {
        SocialProvider::Google => {
            (policy.issuer == "https://accounts.google.com"
                || policy.issuer == "accounts.google.com")
                && policy.jwks_uri == "https://www.googleapis.com/oauth2/v3/certs"
        }
        SocialProvider::Apple => {
            policy.issuer == "https://appleid.apple.com"
                && policy.jwks_uri == "https://appleid.apple.com/auth/keys"
        }
        SocialProvider::Email => {
            policy.issuer.starts_with("https://securetoken.google.com/")
                && policy.jwks_uri
                    == "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
        }
    };
    if !allowed {
        bail!("provider issuer/JWKS combination is not allowlisted");
    }
    if policy.app_id.is_empty()
        || policy.environment_id.is_empty()
        || policy.audience.is_empty()
    {
        bail!("recovery policy is incomplete");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn claims(
        issued_at: u64,
        nonce: Option<&str>,
        firebase_provider: Option<&str>,
    ) -> IdentityClaims {
        IdentityClaims {
            sub: "user-1".into(),
            iss: "issuer".into(),
            aud: Audience::One("audience".into()),
            _exp: issued_at + 3_600,
            iat: issued_at,
            auth_time: None,
            nonce: nonce.map(str::to_owned),
            email_verified: Some(serde_json::Value::Bool(true)),
            firebase: firebase_provider.map(|provider| FirebaseClaims {
                sign_in_provider: Some(provider.into()),
            }),
        }
    }

    #[test]
    fn credential_fingerprint_is_bound_to_the_stored_session_hash() {
        let token = "header.payload.signature";
        let fingerprint = URL_SAFE_NO_PAD.encode(Sha256::digest(token.as_bytes()));
        let credential = ProviderCredential {
            provider: SocialProvider::Google,
            id_token: token.into(),
            token_fingerprint: fingerprint.clone(),
        };
        let expected = hex_sha256(fingerprint.as_bytes());
        assert!(verify_credential_binding(&credential, &expected).is_ok());
        assert!(verify_credential_binding(&credential, &"0".repeat(64)).is_err());
    }

    #[test]
    fn provider_login_must_be_recent_and_nonce_bound() {
        let now = 2_000_000_000;
        let recent = claims(now - 60, Some("fresh-login-nonce-123"), None);
        assert!(enforce_recent_auth(&recent, &SocialProvider::Google, now).is_ok());

        let stale = claims(
            now - MAX_AUTH_AGE_SECONDS - 1,
            Some("fresh-login-nonce-123"),
            None,
        );
        assert!(enforce_recent_auth(&stale, &SocialProvider::Google, now).is_err());

        let missing_nonce = claims(now - 60, None, None);
        assert!(
            enforce_recent_auth(&missing_nonce, &SocialProvider::Apple, now).is_err()
        );
    }

    #[test]
    fn email_recovery_accepts_only_firebase_email_authentication() {
        let now = 2_000_000_000;
        let email = claims(now - 60, None, Some("password"));
        assert!(enforce_recent_auth(&email, &SocialProvider::Email, now).is_ok());

        let google = claims(now - 60, None, Some("google.com"));
        assert!(enforce_recent_auth(&google, &SocialProvider::Email, now).is_err());
    }
}
