use anyhow::{bail, Context, Result};
use base64::{engine::general_purpose::STANDARD, Engine};
use reqwest::Client;
use serde::Deserialize;
use serde_json::json;

use crate::launcher;

#[derive(Clone)]
pub struct KmsClient {
    http: Client,
    key_name: String,
    wif_audience: String,
}

#[derive(Deserialize)]
struct StsResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct EncryptResponse {
    ciphertext: String,
}

#[derive(Deserialize)]
struct DecryptResponse {
    plaintext: String,
}

impl KmsClient {
    pub fn new(key_name: String, wif_audience: String) -> Self {
        Self {
            http: Client::new(),
            key_name,
            wif_audience,
        }
    }

    async fn access_token(&self) -> Result<String> {
        let attestation = launcher::attestation_token("https://sts.googleapis.com", vec![]).await?;
        let response = self
            .http
            .post("https://sts.googleapis.com/v1/token")
            .json(&json!({
                "audience": self.wif_audience,
                "grantType": "urn:ietf:params:oauth:grant-type:token-exchange",
                "requestedTokenType": "urn:ietf:params:oauth:token-type:access_token",
                "scope": "https://www.googleapis.com/auth/cloud-platform",
                "subjectToken": attestation,
                "subjectTokenType": "urn:ietf:params:oauth:token-type:jwt"
            }))
            .send()
            .await
            .context("STS token exchange failed")?;
        if !response.status().is_success() {
            bail!("STS token exchange rejected: {}", response.text().await?);
        }
        Ok(response.json::<StsResponse>().await?.access_token)
    }

    pub async fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>> {
        let token = self.access_token().await?;
        let response = self
            .http
            .post(format!(
                "https://cloudkms.googleapis.com/v1/{}:encrypt",
                self.key_name
            ))
            .bearer_auth(token)
            .json(&json!({ "plaintext": STANDARD.encode(plaintext) }))
            .send()
            .await
            .context("Cloud KMS encrypt request failed")?;
        if !response.status().is_success() {
            bail!("Cloud KMS encrypt rejected: {}", response.text().await?);
        }
        STANDARD
            .decode(response.json::<EncryptResponse>().await?.ciphertext)
            .context("invalid KMS ciphertext")
    }

    pub async fn decrypt(&self, ciphertext: &[u8]) -> Result<Vec<u8>> {
        let token = self.access_token().await?;
        let response = self
            .http
            .post(format!(
                "https://cloudkms.googleapis.com/v1/{}:decrypt",
                self.key_name
            ))
            .bearer_auth(token)
            .json(&json!({ "ciphertext": STANDARD.encode(ciphertext) }))
            .send()
            .await
            .context("Cloud KMS decrypt request failed")?;
        if !response.status().is_success() {
            bail!("Cloud KMS decrypt rejected: {}", response.text().await?);
        }
        STANDARD
            .decode(response.json::<DecryptResponse>().await?.plaintext)
            .context("invalid KMS plaintext")
    }
}
