use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce,
};
use anyhow::{anyhow, bail, Context, Result};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use ecdsa::RecoveryId;
use hkdf::Hkdf;
use p256::{
    ecdh::{diffie_hellman, EphemeralSecret},
    ecdsa::{
        signature::hazmat::PrehashSigner, Signature, SigningKey, VerifyingKey,
    },
    elliptic_curve::sec1::ToEncodedPoint,
    PublicKey, SecretKey,
};
use rand_core::OsRng;
use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;
use zeroize::Zeroizing;

use crate::protocol::{
    ChainAuthorization, RecoveryPolicy, SignedAuthorization, SocialProvider,
};

pub const CHANNEL_INFO: &[u8] = b"cavos-confidential-channel-v1";
const STELLAR_ECIES_INFO: &[u8] = b"cavos-stellar-dek-ecies";
const STARKNET_DOMAIN: &[u8] = b"CAVOS_SOC_REC_V1";
const SOLANA_DOMAIN: &[u8] = b"cavos:schedule_social:v1";

pub fn b64(bytes: impl AsRef<[u8]>) -> String {
    URL_SAFE_NO_PAD.encode(bytes)
}

pub fn unb64(value: &str) -> Result<Vec<u8>> {
    URL_SAFE_NO_PAD
        .decode(value)
        .context("invalid base64url")
}

pub fn sha256(bytes: impl AsRef<[u8]>) -> [u8; 32] {
    Sha256::digest(bytes).into()
}

pub fn identity_commitment(
    policy: &RecoveryPolicy,
    subject: &str,
) -> [u8; 32] {
    hash_fields(
        b"cavos-social-id-v1",
        &[
            policy.app_id.as_bytes(),
            policy.environment_id.as_bytes(),
            policy.issuer.as_bytes(),
            policy.audience.as_bytes(),
            subject.as_bytes(),
        ],
    )
}

pub fn policy_hash(policy: &RecoveryPolicy) -> [u8; 32] {
    let provider = match policy.provider {
        SocialProvider::Google => b"google".as_slice(),
        SocialProvider::Apple => b"apple".as_slice(),
        SocialProvider::Email => b"email".as_slice(),
    };
    hash_fields(
        b"cavos-social-policy-v1",
        &[
            policy.app_id.as_bytes(),
            policy.environment_id.as_bytes(),
            provider,
            policy.issuer.as_bytes(),
            policy.audience.as_bytes(),
            policy.jwks_uri.as_bytes(),
        ],
    )
}

fn hash_fields(domain: &[u8], fields: &[&[u8]]) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(domain);
    for field in fields {
        h.update((field.len() as u32).to_be_bytes());
        h.update(field);
    }
    h.finalize().into()
}

pub struct ChannelKey {
    secret: EphemeralSecret,
    public: Vec<u8>,
}

impl ChannelKey {
    pub fn generate() -> Self {
        let secret = EphemeralSecret::random(&mut OsRng);
        let public = PublicKey::from(&secret)
            .to_encoded_point(false)
            .as_bytes()
            .to_vec();
        Self { secret, public }
    }

    pub fn public_key(&self) -> &[u8] {
        &self.public
    }

    pub fn attestation_nonce(&self, session_id: &str) -> [u8; 32] {
        let mut input = Vec::with_capacity(self.public.len() + session_id.len());
        input.extend_from_slice(&self.public);
        input.extend_from_slice(session_id.as_bytes());
        sha256(input)
    }

    pub fn decrypt(
        &self,
        client_public_key: &[u8],
        nonce: &[u8],
        ciphertext: &[u8],
        session_id: &str,
    ) -> Result<Zeroizing<Vec<u8>>> {
        if nonce.len() != 12 {
            bail!("channel nonce must be 12 bytes");
        }
        let client_public =
            PublicKey::from_sec1_bytes(client_public_key).context("bad client P-256 key")?;
        let shared = self.secret.diffie_hellman(&client_public);
        let mut key = [0u8; 32];
        Hkdf::<Sha256>::new(Some(session_id.as_bytes()), shared.raw_secret_bytes())
            .expand(CHANNEL_INFO, &mut key)
            .map_err(|_| anyhow!("channel HKDF failed"))?;
        let plaintext = Aes256Gcm::new_from_slice(&key)
            .expect("AES key size")
            .decrypt(
                Nonce::from_slice(nonce),
                Payload {
                    msg: ciphertext,
                    aad: session_id.as_bytes(),
                },
            )
            .map_err(|_| anyhow!("channel authentication failed"))?;
        key.fill(0);
        Ok(Zeroizing::new(plaintext))
    }
}

pub fn generate_recovery_key() -> SigningKey {
    SigningKey::random(&mut OsRng)
}

pub fn recovery_public_parts(key: &SigningKey) -> (Vec<u8>, [u8; 32], [u8; 32]) {
    let point = key.verifying_key().to_encoded_point(false);
    let compressed = key
        .verifying_key()
        .to_encoded_point(true)
        .as_bytes()
        .to_vec();
    let mut x = [0u8; 32];
    let mut y = [0u8; 32];
    x.copy_from_slice(point.x().expect("P-256 x"));
    y.copy_from_slice(point.y().expect("P-256 y"));
    (compressed, x, y)
}

pub fn sign_authorization(
    key: &SigningKey,
    auth: &ChainAuthorization,
) -> Result<SignedAuthorization> {
    match auth {
        ChainAuthorization::Starknet {
            chain_id_hex,
            account_hex,
            new_x_hex,
            new_y_hex,
            recovery_nonce,
            expires_at,
        } => {
            let recovery_nonce = recovery_nonce
                .parse::<u128>()
                .context("invalid Starknet recovery nonce")?;
            let mut encoded = Vec::with_capacity(224);
            encoded.extend_from_slice(&left_pad_32(STARKNET_DOMAIN)?);
            encoded.extend_from_slice(&parse_hex_32(chain_id_hex)?);
            encoded.extend_from_slice(&parse_hex_32(account_hex)?);
            encoded.extend_from_slice(&parse_hex_32(new_x_hex)?);
            encoded.extend_from_slice(&parse_hex_32(new_y_hex)?);
            encoded.extend_from_slice(&u128_word(recovery_nonce));
            encoded.extend_from_slice(&u64_word(*expires_at));
            let digest = sha256(encoded);
            let (sig, recovery_id) = sign_recoverable(key, &digest)?;
            Ok(SignedAuthorization::Starknet {
                digest_hex: hex(&digest),
                r_hex: hex(&sig.r().to_bytes()),
                s_hex: hex(&sig.s().to_bytes()),
                y_parity: recovery_id.is_y_odd(),
                recovery_nonce: recovery_nonce.to_string(),
                expires_at: *expires_at,
            })
        }
        ChainAuthorization::Solana {
            account_b58_bytes_b64,
            new_pubkey_b64,
            recovery_nonce,
            expires_at,
        } => {
            let recovery_nonce = recovery_nonce
                .parse::<u64>()
                .context("invalid Solana recovery nonce")?;
            let account = unb64(account_b58_bytes_b64)?;
            let new_key = unb64(new_pubkey_b64)?;
            if account.len() != 32 || new_key.len() != 33 {
                bail!("Solana account/new signer length is invalid");
            }
            let mut message = Vec::with_capacity(SOLANA_DOMAIN.len() + 32 + 33 + 8 + 8);
            message.extend_from_slice(SOLANA_DOMAIN);
            message.extend_from_slice(&account);
            message.extend_from_slice(&new_key);
            message.extend_from_slice(&recovery_nonce.to_le_bytes());
            message.extend_from_slice(&expires_at.to_le_bytes());
            let digest = sha256(&message);
            let signature: Signature = key
                .sign_prehash(&digest)
                .map_err(|_| anyhow!("P-256 signing failed"))?;
            let normalized = signature.normalize_s().unwrap_or(signature);
            let (compressed, _, _) = recovery_public_parts(key);
            Ok(SignedAuthorization::Solana {
                message_b64: b64(message),
                signature_b64: b64(normalized.to_bytes()),
                recovery_pubkey_compressed_b64: b64(compressed),
                recovery_nonce: recovery_nonce.to_string(),
                expires_at: *expires_at,
            })
        }
    }
}

fn sign_recoverable(key: &SigningKey, digest: &[u8; 32]) -> Result<(Signature, RecoveryId)> {
    let signature: Signature = key
        .sign_prehash(digest)
        .map_err(|_| anyhow!("P-256 signing failed"))?;
    let signature = signature.normalize_s().unwrap_or(signature);
    let expected = key.verifying_key().to_encoded_point(false);
    for id in [RecoveryId::new(false, false), RecoveryId::new(true, false)] {
        if let Ok(recovered) = VerifyingKey::recover_from_prehash(digest, &signature, id) {
            if recovered
                .to_encoded_point(false)
                .as_bytes()
                .ct_eq(expected.as_bytes())
                .into()
            {
                return Ok((signature, id));
            }
        }
    }
    bail!("could not derive P-256 recovery id")
}

pub fn stellar_wrap(dek: &[u8], recipient_sec1: &[u8]) -> Result<Vec<u8>> {
    if dek.len() != 32 {
        bail!("Stellar DEK must be 32 bytes");
    }
    let recipient = PublicKey::from_sec1_bytes(recipient_sec1)
        .context("invalid Stellar device unwrap public key")?;
    let eph = SecretKey::random(&mut OsRng);
    let eph_public = eph.public_key().to_encoded_point(true);
    let shared = diffie_hellman(eph.to_nonzero_scalar(), recipient.as_affine());
    let mut kek = [0u8; 32];
    Hkdf::<Sha256>::new(Some(eph_public.as_bytes()), shared.raw_secret_bytes())
        .expand(STELLAR_ECIES_INFO, &mut kek)
        .map_err(|_| anyhow!("Stellar ECIES HKDF failed"))?;
    let mut nonce = [0u8; 12];
    rand_core::RngCore::fill_bytes(&mut OsRng, &mut nonce);
    let ct = Aes256Gcm::new_from_slice(&kek)
        .expect("AES key size")
        .encrypt(Nonce::from_slice(&nonce), dek)
        .map_err(|_| anyhow!("Stellar DEK wrapping failed"))?;
    kek.fill(0);
    let mut out = Vec::with_capacity(33 + 12 + ct.len());
    out.extend_from_slice(eph_public.as_bytes());
    out.extend_from_slice(&nonce);
    out.extend_from_slice(&ct);
    Ok(out)
}

fn left_pad_32(bytes: &[u8]) -> Result<[u8; 32]> {
    if bytes.len() > 32 {
        bail!("field exceeds 32 bytes");
    }
    let mut out = [0u8; 32];
    out[32 - bytes.len()..].copy_from_slice(bytes);
    Ok(out)
}

fn parse_hex_32(value: &str) -> Result<[u8; 32]> {
    let value = value.strip_prefix("0x").unwrap_or(value);
    if value.len() > 64 {
        bail!("hex field exceeds 32 bytes");
    }
    let padded = format!("{value:0>64}");
    let mut out = [0u8; 32];
    for (i, pair) in padded.as_bytes().chunks_exact(2).enumerate() {
        out[i] = u8::from_str_radix(std::str::from_utf8(pair)?, 16)?;
    }
    Ok(out)
}

fn u128_word(value: u128) -> [u8; 32] {
    let mut out = [0u8; 32];
    out[16..].copy_from_slice(&value.to_be_bytes());
    out
}

fn u64_word(value: u64) -> [u8; 32] {
    let mut out = [0u8; 32];
    out[24..].copy_from_slice(&value.to_be_bytes());
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use aes_gcm::aead::Payload;
    use p256::ecdsa::signature::hazmat::PrehashVerifier;

    use crate::protocol::{ChainAuthorization, RecoveryPolicy, SocialProvider};

    fn policy(provider: SocialProvider) -> RecoveryPolicy {
        RecoveryPolicy {
            app_id: "app_123".into(),
            environment_id: "env_123".into(),
            provider,
            issuer: "https://accounts.google.com".into(),
            audience: "client.apps.googleusercontent.com".into(),
            jwks_uri: "https://www.googleapis.com/oauth2/v3/certs".into(),
        }
    }

    #[test]
    fn identity_commitment_is_domain_and_policy_bound() {
        let google = policy(SocialProvider::Google);
        let same = identity_commitment(&google, "subject-1");
        assert_eq!(same, identity_commitment(&google, "subject-1"));
        assert_ne!(same, identity_commitment(&google, "subject-2"));
        let mut other_app = google.clone();
        other_app.app_id = "app_456".into();
        assert_ne!(same, identity_commitment(&other_app, "subject-1"));
        assert_ne!(policy_hash(&google), policy_hash(&other_app));
    }

    #[test]
    fn attested_channel_round_trip_and_aad_binding() {
        let enclave = ChannelKey::generate();
        let client_secret = EphemeralSecret::random(&mut OsRng);
        let client_public = PublicKey::from(&client_secret).to_encoded_point(false);
        let enclave_public = PublicKey::from_sec1_bytes(enclave.public_key()).unwrap();
        let shared = client_secret.diffie_hellman(&enclave_public);
        let session = "7ee71f25-9f59-43f6-8091-317a94074209";
        let mut key = [0u8; 32];
        Hkdf::<Sha256>::new(Some(session.as_bytes()), shared.raw_secret_bytes())
            .expand(CHANNEL_INFO, &mut key)
            .unwrap();
        let nonce = [7u8; 12];
        let plaintext = b"{\"credential\":\"never-visible-to-control-plane\"}";
        let ciphertext = Aes256Gcm::new_from_slice(&key)
            .unwrap()
            .encrypt(
                Nonce::from_slice(&nonce),
                Payload { msg: plaintext, aad: session.as_bytes() },
            )
            .unwrap();
        let opened = enclave
            .decrypt(client_public.as_bytes(), &nonce, &ciphertext, session)
            .unwrap();
        assert_eq!(opened.as_slice(), plaintext);
        assert!(enclave
            .decrypt(client_public.as_bytes(), &nonce, &ciphertext, "other-session")
            .is_err());
    }

    #[test]
    fn starknet_authorization_matches_fixed_width_cross_language_vector() {
        let private = parse_hex_32(
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        )
        .unwrap();
        let key = SigningKey::from_slice(&private).unwrap();
        let auth = ChainAuthorization::Starknet {
            chain_id_hex: "0x534e5f5345504f4c4941".into(),
            account_hex:
                "0x20b2c487975ce698d296bd8ee914da4cd462a0047219338d66ae366ec0b6504"
                    .into(),
            new_x_hex:
                "0x27dc812de9374f35b5ff02901dd3f0225bddad4dafed3f1dfcc068c9e0f5ab7b"
                    .into(),
            new_y_hex:
                "0x8ed95e95d913435e93e5ac18196c1eb88df7156b3ed0f3cc7f9095857eb0ffde"
                    .into(),
            recovery_nonce: "0".into(),
            expires_at: 2000,
        };
        let signed = sign_authorization(&key, &auth).unwrap();
        match signed {
            SignedAuthorization::Starknet {
                digest_hex,
                r_hex,
                s_hex,
                y_parity,
                ..
            } => {
                assert_eq!(
                    digest_hex,
                    "0xf143dedf17ecaf8b7ac2d1ca9d6e1a8440863b4f0f78b53734c300659a1ada55"
                );
                assert_eq!(
                    r_hex,
                    "0xd90a82fe2a587d02cc21d356dd8bcd2c320cdf56de77ec46dcbda39da6a210c8"
                );
                assert_eq!(
                    s_hex,
                    "0x1d003c64db86133d3bbb38fa1a1ea6df7aee41b60a2d6a28eedf74488d4f47e9"
                );
                assert!(y_parity);
            }
            _ => panic!("wrong authorization kind"),
        }
    }

    #[test]
    fn solana_authorization_binds_nonce_and_expiry_and_verifies() {
        let key = generate_recovery_key();
        let auth = ChainAuthorization::Solana {
            account_b58_bytes_b64: b64([3u8; 32]),
            new_pubkey_b64: b64(recovery_public_parts(&generate_recovery_key()).0),
            recovery_nonce: u64::MAX.to_string(),
            expires_at: 2_000_000_000,
        };
        let signed = sign_authorization(&key, &auth).unwrap();
        match signed {
            SignedAuthorization::Solana {
                message_b64,
                signature_b64,
                recovery_nonce,
                ..
            } => {
                let message = unb64(&message_b64).unwrap();
                assert!(message.starts_with(SOLANA_DOMAIN));
                assert_eq!(
                    &message[message.len() - 16..message.len() - 8],
                    &u64::MAX.to_le_bytes(),
                );
                let signature = Signature::from_slice(&unb64(&signature_b64).unwrap()).unwrap();
                key.verifying_key()
                    .verify_prehash(&sha256(&message), &signature)
                    .unwrap();
                assert_eq!(recovery_nonce, u64::MAX.to_string());
            }
            _ => panic!("wrong authorization kind"),
        }
    }

    #[test]
    fn stellar_wrap_is_decryptable_only_by_recipient() {
        let recipient = SecretKey::random(&mut OsRng);
        let dek = [0x5au8; 32];
        let wrapped = stellar_wrap(
            &dek,
            recipient.public_key().to_encoded_point(false).as_bytes(),
        )
        .unwrap();
        assert_eq!(wrapped.len(), 33 + 12 + 32 + 16);
        let ephemeral = PublicKey::from_sec1_bytes(&wrapped[..33]).unwrap();
        let shared = diffie_hellman(recipient.to_nonzero_scalar(), ephemeral.as_affine());
        let mut key = [0u8; 32];
        Hkdf::<Sha256>::new(Some(&wrapped[..33]), shared.raw_secret_bytes())
            .expand(STELLAR_ECIES_INFO, &mut key)
            .unwrap();
        let opened = Aes256Gcm::new_from_slice(&key)
            .unwrap()
            .decrypt(Nonce::from_slice(&wrapped[33..45]), &wrapped[45..])
            .unwrap();
        assert_eq!(opened, dek);
    }
}

pub fn hex(bytes: &[u8]) -> String {
    let mut value = String::with_capacity(2 + bytes.len() * 2);
    value.push_str("0x");
    for byte in bytes {
        use std::fmt::Write;
        write!(&mut value, "{byte:02x}").expect("String write");
    }
    value
}
