/// RSA-SHA256 (PKCS#1 v1.5) signature verification.
/// Verifies JWT RS256 signatures from Google/Apple OAuth providers.

use super::bignum::{BigUint2048, biguint_eq, biguint_modexp_65537, biguint_from_bytes};
use core::sha256::compute_sha256_byte_array;

/// PKCS#1 v1.5 DigestInfo prefix for SHA-256.
/// DER encoding: 30 31 30 0d 06 09 60 86 48 01 65 03 04 02 01 05 00 04 20
/// This is the ASN.1 encoding that prepends the hash in PKCS#1 v1.5 signatures.
const PKCS1_SHA256_PREFIX_LEN: usize = 19;

/// Verify an RSA-SHA256 signature (PKCS#1 v1.5) with e=65537.
///
/// Arguments:
/// - message: The signed message bytes (typically "header.payload" of a JWT)
/// - signature: The RSA signature as 2048-bit number (16 x u128 limbs, little-endian)
/// - modulus: The RSA public key modulus n as 2048-bit number (16 x u128 limbs, little-endian)
///
/// Returns true if the signature is valid.
pub fn verify_rsa_sha256(
    message: @ByteArray, signature: @BigUint2048, modulus: @BigUint2048,
) -> bool {
    // Step 1: RSA verification - compute signature^65537 mod n
    let decrypted = biguint_modexp_65537(signature, modulus);

    // Step 2: SHA-256 hash the message
    let hash = compute_sha256_byte_array(message);

    // Step 3: Construct expected PKCS#1 v1.5 padded value
    let expected = pkcs1_v15_encode(@hash);

    // Step 4: Compare
    biguint_eq(@decrypted, @expected)
}

/// Verify RSA signature given pre-computed SHA-256 hash.
/// Useful when the hash is computed separately (e.g., for JWT header.payload).
pub fn verify_rsa_sha256_prehashed(
    hash: @[u32; 8], signature: @BigUint2048, modulus: @BigUint2048,
) -> bool {
    let decrypted = biguint_modexp_65537(signature, modulus);
    let expected = pkcs1_v15_encode(hash);
    biguint_eq(@decrypted, @expected)
}

/// Constructs the PKCS#1 v1.5 padded message for SHA-256.
/// Format: 0x00 || 0x01 || PS || 0x00 || DigestInfo
/// Where PS is (key_len - 3 - digestinfo_len) bytes of 0xFF.
/// DigestInfo = ASN.1 prefix || hash
///
/// For RSA-2048 (256 bytes): PS is 256 - 3 - 19 - 32 = 202 bytes of 0xFF.
fn pkcs1_v15_encode(hash: @[u32; 8]) -> BigUint2048 {
    // Build the 256-byte padded message in big-endian
    let mut padded: Array<u8> = array![];

    // 0x00 0x01
    padded.append(0x00);
    padded.append(0x01);

    // PS: 202 bytes of 0xFF
    let mut i: usize = 0;
    while i < 202 {
        padded.append(0xff);
        i += 1;
    };

    // 0x00 separator
    padded.append(0x00);

    // DigestInfo ASN.1 prefix for SHA-256
    padded.append(0x30);
    padded.append(0x31);
    padded.append(0x30);
    padded.append(0x0d);
    padded.append(0x06);
    padded.append(0x09);
    padded.append(0x60);
    padded.append(0x86);
    padded.append(0x48);
    padded.append(0x01);
    padded.append(0x65);
    padded.append(0x03);
    padded.append(0x04);
    padded.append(0x02);
    padded.append(0x01);
    padded.append(0x05);
    padded.append(0x00);
    padded.append(0x04);
    padded.append(0x20);

    // SHA-256 hash (32 bytes from 8 x u32)
    let hash_span = hash.span();
    let mut h_idx: usize = 0;
    while h_idx < 8 {
        let word: u32 = *hash_span[h_idx];
        // Big-endian: high byte first
        padded.append(((word / 0x1000000) & 0xff).try_into().unwrap());
        padded.append(((word / 0x10000) & 0xff).try_into().unwrap());
        padded.append(((word / 0x100) & 0xff).try_into().unwrap());
        padded.append((word & 0xff).try_into().unwrap());
        h_idx += 1;
    };

    assert!(padded.len() == 256, "PKCS#1 padding must be 256 bytes");

    // Convert big-endian bytes to BigUint2048
    biguint_from_bytes(padded.span())
}
