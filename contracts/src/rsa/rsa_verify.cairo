use core::sha256::compute_sha256_byte_array;
/// RSA-SHA256 (PKCS#1 v1.5) signature verification.
/// Verifies JWT RS256 signatures from Google/Apple OAuth providers.
/// Uses Montgomery reduction for efficient modular exponentiation.

use super::bignum::{BigUint2048, biguint_eq};


/// Verify RSA signature using Montgomery Reduction (Optimized).
/// Requires precomputed Montgomery constants n_prime and R^2.
pub fn verify_rsa_sha256_mont(
    message: @ByteArray,
    signature: @BigUint2048,
    modulus: @BigUint2048,
    n_prime: @BigUint2048,
    r_sq: @BigUint2048,
) -> bool {
    // Step 1: RSA verification (Montgomery)
    // 1.1 Convert signature to Montgomery form: sig_mont = sig * R^2 * R^-1 = sig * R
    let sig_mont = super::bignum::biguint_mul_mont(signature, r_sq, modulus, n_prime);

    // 1.2 Exponentiate: val_mont = sig_mont^65537
    let decrypted_mont = super::bignum::biguint_modexp_65537_mont(@sig_mont, modulus, n_prime);

    // 1.3 Convert back to standard form: val = val_mont * 1 * R^-1
    let one = super::bignum::biguint_one();
    let decrypted = super::bignum::biguint_mul_mont(@decrypted_mont, @one, modulus, n_prime);

    // Step 2: SHA-256 hash
    let hash = compute_sha256_byte_array(message);
    let expected = pkcs1_v15_encode(@hash);

    // Step 3: Compare
    biguint_eq(@decrypted, @expected)
}

/// Verify RSA signature (prehashed) using Montgomery Reduction.
pub fn verify_rsa_sha256_prehashed_mont(
    hash: @[u32; 8],
    signature: @BigUint2048,
    modulus: @BigUint2048,
    n_prime: @BigUint2048,
    r_sq: @BigUint2048,
) -> bool {
    // 1.1 Convert signature to Montgomery form
    let sig_mont = super::bignum::biguint_mul_mont(signature, r_sq, modulus, n_prime);

    // 1.2 Exponentiate
    let decrypted_mont = super::bignum::biguint_modexp_65537_mont(@sig_mont, modulus, n_prime);

    // 1.3 Convert back
    let one = super::bignum::biguint_one();
    let decrypted = super::bignum::biguint_mul_mont(@decrypted_mont, @one, modulus, n_prime);

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
    // A PKCS#1 v1.5 padding block for SHA-256 with a 2048-bit (256-byte) modulus
    // exactly maps to predefined 128-bit static limbs.
    // Bytes 0-1: 0x00 0x01
    // Bytes 2-203: 0xFF
    // Byte 204: 0x00
    // Bytes 205-223: ASN.1 DigestInfo prefix
    // Bytes 224-255: SHA-256 hash (32 bytes)

    let hash_span = hash.span();

    // Limb 1: first half of hash (words 0..3)
    let w0: u128 = (*hash_span[0]).into();
    let w1: u128 = (*hash_span[1]).into();
    let w2: u128 = (*hash_span[2]).into();
    let w3: u128 = (*hash_span[3]).into();
    let limb_1 = (w0 * 0x1000000000000000000000000_u128)
        + (w1 * 0x10000000000000000_u128)
        + (w2 * 0x100000000_u128)
        + w3;

    // Limb 0: second half of hash (words 4..7)
    let w4: u128 = (*hash_span[4]).into();
    let w5: u128 = (*hash_span[5]).into();
    let w6: u128 = (*hash_span[6]).into();
    let w7: u128 = (*hash_span[7]).into();
    let limb_0 = (w4 * 0x1000000000000000000000000_u128)
        + (w5 * 0x10000000000000000_u128)
        + (w6 * 0x100000000_u128)
        + w7;

    BigUint2048 {
        limbs: [
            limb_0, // limb 0 (bytes 240..255)
            limb_1, // limb 1 (bytes 224..239)
            0x0d060960864801650304020105000420, // limb 2 (bytes 208..223, ASN.1 lower)
            0xffffffffffffffffffffffff00303130, // limb 3 (bytes 192..207, PS + 0x00 + ASN.1 upper)
            0xffffffffffffffffffffffffffffffff, // limb 4
            0xffffffffffffffffffffffffffffffff, // limb 5
            0xffffffffffffffffffffffffffffffff, // limb 6
            0xffffffffffffffffffffffffffffffff, // limb 7
            0xffffffffffffffffffffffffffffffff, // limb 8
            0xffffffffffffffffffffffffffffffff, // limb 9
            0xffffffffffffffffffffffffffffffff, // limb 10
            0xffffffffffffffffffffffffffffffff, // limb 11
            0xffffffffffffffffffffffffffffffff, // limb 12
            0xffffffffffffffffffffffffffffffff, // limb 13
            0xffffffffffffffffffffffffffffffff, // limb 14
            0x0001ffffffffffffffffffffffffffff // limb 15 (bytes 0..15, 0x00 0x01 + PS)
        ],
    }
}
