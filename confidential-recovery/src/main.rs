mod crypto;
mod kms;
mod launcher;
mod oidc;
mod protocol;

use std::{
    env,
    time::{Duration, Instant},
};

use anyhow::{bail, Context, Result};
use p256::{ecdsa::SigningKey, SecretKey};
use protocol::{
    CompletionRequest, EncryptedJob, JobResponse, RegistrationResponse, SealedRecoveryRecord,
    WorkloadJob, WorkloadRegistration, WorkloadResult,
};
use reqwest::Client;
use zeroize::Zeroizing;

struct Config {
    control_plane_url: String,
    session_id: String,
    bootstrap_token: String,
    attestation_audience: String,
    kms_key_name: String,
    wif_audience: String,
    job_timeout: Duration,
}

impl Config {
    fn from_env() -> Result<Self> {
        Ok(Self {
            control_plane_url: required("CAVOS_CONTROL_PLANE_URL")?,
            session_id: required("CAVOS_RECOVERY_SESSION_ID")?,
            bootstrap_token: required("CAVOS_RECOVERY_BOOTSTRAP_TOKEN")?,
            attestation_audience: required("CAVOS_ATTESTATION_AUDIENCE")?,
            kms_key_name: required("CAVOS_KMS_KEY_NAME")?,
            wif_audience: required("CAVOS_WIF_AUDIENCE")?,
            job_timeout: Duration::from_secs(optional_u64(
                "CAVOS_RECOVERY_JOB_TIMEOUT_SECONDS",
                360,
            )?),
        })
    }
}

#[tokio::main]
async fn main() {
    if let Err(error) = run().await {
        // Never print credentials, decrypted jobs, keys, tokens, or KMS blobs.
        eprintln!("confidential recovery workload failed: {error:#}");
        std::process::exit(1);
    }
}

async fn run() -> Result<()> {
    let config = Config::from_env()?;
    let http = Client::builder().timeout(Duration::from_secs(30)).build()?;
    let channel = crypto::ChannelKey::generate();
    let attestation_nonce = channel.attestation_nonce(&config.session_id);
    let nonce_b64 = crypto::b64(attestation_nonce);
    let attestation =
        launcher::attestation_token(&config.attestation_audience, vec![nonce_b64.as_str()]).await?;
    // Mark the worker ready only after the measured workload has already
    // obtained its short-lived KMS authority. This moves STS/attestation out
    // of the post-login critical path.
    let kms = kms::KmsClient::new(config.kms_key_name.clone(), config.wif_audience.clone());
    kms.warm_up().await.context("KMS warm-up failed")?;

    let registration = WorkloadRegistration {
        session_id: config.session_id.clone(),
        ephemeral_public_key_b64: crypto::b64(channel.public_key()),
        attestation_token: attestation,
        attestation_nonce_b64: nonce_b64,
    };
    let register_url = endpoint(
        &config.control_plane_url,
        "/api/recovery/social/workload/register",
    );
    let response = http
        .post(register_url)
        .bearer_auth(&config.bootstrap_token)
        .json(&registration)
        .send()
        .await
        .context("workload registration failed")?;
    if !response.status().is_success() {
        bail!("workload registration rejected: {}", response.status());
    }
    let workload_token = Zeroizing::new(
        response
            .json::<RegistrationResponse>()
            .await?
            .workload_token,
    );

    let (encrypted_job, auth_challenge_hash) = poll_job(&http, &config, &workload_token).await?;
    let plaintext = decrypt_job(&channel, &config.session_id, encrypted_job)?;
    let job: WorkloadJob = serde_json::from_slice(&plaintext).context("invalid recovery job")?;
    let result = process_job(&http, &kms, job, &auth_challenge_hash).await?;

    let complete_url = endpoint(
        &config.control_plane_url,
        "/api/recovery/social/workload/complete",
    );
    let response = http
        .post(complete_url)
        .bearer_auth(workload_token.as_str())
        .header("x-cavos-recovery-session", &config.session_id)
        .json(&CompletionRequest { result })
        .send()
        .await
        .context("workload completion callback failed")?;
    if !response.status().is_success() {
        bail!("workload completion rejected: {}", response.status());
    }
    Ok(())
}

async fn poll_job(http: &Client, config: &Config, token: &str) -> Result<(EncryptedJob, String)> {
    let url = endpoint(
        &config.control_plane_url,
        "/api/recovery/social/workload/job",
    );
    let deadline = Instant::now() + config.job_timeout;
    while Instant::now() < deadline {
        let response = match http
            .get(&url)
            .bearer_auth(token)
            .header("x-cavos-recovery-session", &config.session_id)
            .send()
            .await
        {
            Ok(response) => response,
            Err(_) => {
                tokio::time::sleep(Duration::from_secs(1)).await;
                continue;
            }
        };
        if response.status().as_u16() == 401 || response.status().as_u16() == 410 {
            bail!("workload job poll rejected: {}", response.status());
        }
        if !response.status().is_success() {
            tokio::time::sleep(Duration::from_secs(1)).await;
            continue;
        }
        let response = match response.json::<JobResponse>().await {
            Ok(response) => response,
            Err(_) => {
                tokio::time::sleep(Duration::from_secs(1)).await;
                continue;
            }
        };
        if let Some(job) = response.job {
            let challenge_hash = response
                .auth_challenge_hash
                .context("recovery job omitted auth challenge")?;
            return Ok((job, challenge_hash));
        }
        // Idle pool workers poll cheaply. Once reserved before OAuth, switch to
        // a tight poll so encrypted job delivery adds at most 200 ms.
        tokio::time::sleep(if response.active {
            Duration::from_millis(200)
        } else {
            Duration::from_secs(1)
        })
        .await;
    }
    bail!("recovery job timed out")
}

fn decrypt_job(
    channel: &crypto::ChannelKey,
    session_id: &str,
    job: EncryptedJob,
) -> Result<Zeroizing<Vec<u8>>> {
    channel.decrypt(
        &crypto::unb64(&job.client_public_key_b64)?,
        &crypto::unb64(&job.nonce_b64)?,
        &crypto::unb64(&job.ciphertext_b64)?,
        session_id,
    )
}

async fn process_job(
    http: &Client,
    kms: &kms::KmsClient,
    job: WorkloadJob,
    auth_challenge_hash: &str,
) -> Result<WorkloadResult> {
    match job {
        WorkloadJob::Enroll {
            credential,
            policy,
            stellar_dek_b64,
        } => {
            if credential.provider != policy.provider {
                bail!("credential provider does not match policy");
            }
            let claims =
                oidc::verify_id_token(http, &credential, &policy, auth_challenge_hash).await?;
            let identity = crypto::identity_commitment(&policy, &claims.sub);
            let policy_digest = crypto::policy_hash(&policy);
            let recovery_key = crypto::generate_recovery_key();
            let (compressed, x, y) = crypto::recovery_public_parts(&recovery_key);
            let stellar_dek = stellar_dek_b64
                .map(|value| crypto::unb64(&value))
                .transpose()?;
            if stellar_dek.as_ref().is_some_and(|dek| dek.len() != 32) {
                bail!("Stellar DEK must be 32 bytes");
            }
            let record = SealedRecoveryRecord {
                version: 1,
                policy,
                identity_commitment_hex: crypto::hex(&identity),
                recovery_private_key_b64: crypto::b64(recovery_key.to_bytes()),
                stellar_dek_b64: stellar_dek.map(crypto::b64),
            };
            let serialized = Zeroizing::new(serde_json::to_vec(&record)?);
            let sealed = kms.encrypt(&serialized).await?;
            Ok(WorkloadResult::Enrolled {
                sealed_record_b64: crypto::b64(sealed),
                identity_commitment_hex: crypto::hex(&identity),
                policy_hash_hex: crypto::hex(&policy_digest),
                recovery_pubkey_compressed_b64: crypto::b64(compressed),
                recovery_x_hex: crypto::hex(&x),
                recovery_y_hex: crypto::hex(&y),
            })
        }
        WorkloadJob::Recover {
            credential,
            sealed_record_b64,
            authorizations,
            stellar_recipient_pubkey_b64,
        } => {
            let sealed = crypto::unb64(&sealed_record_b64)?;
            let record_bytes = Zeroizing::new(kms.decrypt(&sealed).await?);
            let record: SealedRecoveryRecord =
                serde_json::from_slice(&record_bytes).context("invalid sealed recovery record")?;
            if record.version != 1 || credential.provider != record.policy.provider {
                bail!("sealed recovery policy mismatch");
            }
            let claims =
                oidc::verify_id_token(http, &credential, &record.policy, auth_challenge_hash)
                    .await?;
            let identity = crypto::identity_commitment(&record.policy, &claims.sub);
            if crypto::hex(&identity) != record.identity_commitment_hex {
                bail!("social identity does not match enrolled identity");
            }
            let secret_bytes = Zeroizing::new(crypto::unb64(&record.recovery_private_key_b64)?);
            let secret = SecretKey::from_slice(&secret_bytes)
                .context("invalid sealed recovery private key")?;
            let signing_key = SigningKey::from(secret);
            let mut signed = Vec::with_capacity(authorizations.len());
            for authorization in &authorizations {
                signed.push(crypto::sign_authorization(&signing_key, authorization)?);
            }
            let stellar_device_wrap_b64 =
                match (record.stellar_dek_b64, stellar_recipient_pubkey_b64) {
                    (Some(dek), Some(recipient)) => Some(crypto::b64(crypto::stellar_wrap(
                        &crypto::unb64(&dek)?,
                        &crypto::unb64(&recipient)?,
                    )?)),
                    (None, None) => None,
                    _ => bail!("Stellar recovery inputs are incomplete"),
                };
            Ok(WorkloadResult::Recovered {
                identity_commitment_hex: crypto::hex(&identity),
                authorizations: signed,
                stellar_device_wrap_b64,
            })
        }
    }
}

fn required(name: &str) -> Result<String> {
    env::var(name).with_context(|| format!("required environment variable {name} is missing"))
}

fn optional_u64(name: &str, default: u64) -> Result<u64> {
    match env::var(name) {
        Ok(value) => value
            .parse::<u64>()
            .with_context(|| format!("environment variable {name} must be an integer")),
        Err(env::VarError::NotPresent) => Ok(default),
        Err(error) => Err(error).with_context(|| format!("could not read {name}")),
    }
}

fn endpoint(base: &str, path: &str) -> String {
    format!("{}{}", base.trim_end_matches('/'), path)
}
