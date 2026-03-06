/// RSA-SHA256 (PKCS#1 v1.5) signature verification.
/// Verifies JWT RS256 signatures from Google/Apple OAuth providers.
/// Two modes:
///   - Montgomery (Tier 4): verify_rsa_sha256_mont — uses precomputed n_prime/r_sq.
///   - Schwartz-Zippel (Tier 5): verify_rsa_schwartz_zippel_v2 — witnesses read
///     directly from calldata as felt252, streaming Poseidon (zero allocation).

use core::hash::HashStateTrait;
use core::poseidon::PoseidonTrait;
use core::sha256::compute_sha256_byte_array;
use super::bignum::BigUint2048;


// ── Schwartz-Zippel RSA verification
// ─────────────────────────────────
//
// Integer identity: a² = q·n + r
// Polynomial form:  A(X)² ≠ Q(X)·N(X) + R(X) — carries between limbs break this!
// Correct form:     A(X)² - Q(X)·N(X) - R(X) = (X - B) · T(X)   where B = 2^128
//
// T(X) is called the "carry polynomial". The prover computes it off-chain;
// the verifier checks the identity at a random point z (Schwartz-Zippel).
//
// We batch all 17 steps using a random α (Garaga-style):
//   Σ αⁱ · [Aᵢ(z)² - Qᵢ(z)·N(z) - Rᵢ(z)] = (z - B) · BigT(z)
// where BigT = Σ αⁱ · Tᵢ  (30 coefficients, degree 29).

/// The base used for the limb representation: B = 2^128.
const LIMB_BASE: felt252 = 0x100000000000000000000000000000000;

/// Evaluate the polynomial P(z) = sum_{i=0}^{15} limbs[i] * z^i using Horner's method.
/// All arithmetic is in felt252 (mod p). Limbs are 128-bit values cast to felt252.
/// Uses pop_front for gas-efficient pointer-based iteration (Rule 4).
fn eval_poly(limbs: Span<u128>, z: felt252) -> felt252 {
    // Horner in reverse: start from limbs[15], multiply by z, add limbs[14], etc.
    let s = limbs;
    let mut result: felt252 = (*s[15]).into();
    let mut i: usize = 15;
    while i != 0 {
        i -= 1;
        result = (*s[i]).into() + z * result;
    }
    result
}

/// Evaluate a polynomial from felt252 span using slice + pop_front (Rule 4 + Rule 6).
/// Slices 16 elements from data at offset, then iterates with pop_front.
/// Eliminates range checks against the full span length.
fn eval_poly_felt(data: Span<felt252>, offset: usize, z: felt252) -> felt252 {
    let mut chunk = data.slice(offset, 16);
    // Read in forward order, accumulate coefficients for Horner (reverse)
    let c0 = *chunk.pop_front().unwrap();
    let c1 = *chunk.pop_front().unwrap();
    let c2 = *chunk.pop_front().unwrap();
    let c3 = *chunk.pop_front().unwrap();
    let c4 = *chunk.pop_front().unwrap();
    let c5 = *chunk.pop_front().unwrap();
    let c6 = *chunk.pop_front().unwrap();
    let c7 = *chunk.pop_front().unwrap();
    let c8 = *chunk.pop_front().unwrap();
    let c9 = *chunk.pop_front().unwrap();
    let c10 = *chunk.pop_front().unwrap();
    let c11 = *chunk.pop_front().unwrap();
    let c12 = *chunk.pop_front().unwrap();
    let c13 = *chunk.pop_front().unwrap();
    let c14 = *chunk.pop_front().unwrap();
    let c15 = *chunk.pop_front().unwrap();
    // Horner from c15 down to c0
    let mut r = c15;
    r = c14 + z * r;
    r = c13 + z * r;
    r = c12 + z * r;
    r = c11 + z * r;
    r = c10 + z * r;
    r = c9 + z * r;
    r = c8 + z * r;
    r = c7 + z * r;
    r = c6 + z * r;
    r = c5 + z * r;
    r = c4 + z * r;
    r = c3 + z * r;
    r = c2 + z * r;
    r = c1 + z * r;
    c0 + z * r
}

/// Evaluate carry polynomial using slice + pop_front (Rule 4 + Rule 6).
fn eval_carry_poly(coeffs: Span<felt252>, offset: usize, n: usize, z: felt252) -> felt252 {
    let mut chunk = coeffs.slice(offset, n);
    // Accumulate all coefficients first, then Horner in reverse
    let mut arr: Array<felt252> = array![];
    while let Option::Some(val) = chunk.pop_front() {
        arr.append(*val);
    }
    let s = arr.span();
    let last = s.len() - 1;
    let mut result: felt252 = *s[last];
    let mut i: usize = last;
    while i != 0 {
        i -= 1;
        result = *s[i] + z * result;
    }
    result
}

/// Absorb 16 u128 limbs of a BigUint2048 into a streaming Poseidon state.
/// Uses pop_front for efficient iteration (Rule 4).
fn absorb_biguint(ref state: core::poseidon::HashState, b: @BigUint2048) {
    let mut limbs = b.limbs.span();
    while let Option::Some(val) = limbs.pop_front() {
        state = state.update((*val).into());
    };
}

/// Absorb 16 felt252 values from a span at offset using slice + pop_front (Rule 4 + Rule 6).
fn absorb_felt_limbs(ref state: core::poseidon::HashState, data: Span<felt252>, offset: usize) {
    let mut chunk = data.slice(offset, 16);
    while let Option::Some(val) = chunk.pop_front() {
        state = state.update(*val);
    };
}

/// Derive the Fiat-Shamir challenges (α, z) via two-phase streaming Poseidon.
fn derive_challenge_streaming(
    sig: @BigUint2048, n: @BigUint2048, witness_data: Span<felt252>, witness_offset: usize,
) -> (felt252, felt252) {
    // Phase I: stream all primary witnesses → α
    let mut state = PoseidonTrait::new();
    absorb_biguint(ref state, sig);
    absorb_biguint(ref state, n);
    // Intermediates + result + quotients: 544 felts total
    // Use slice to get the block, then pop_front through it
    let mut wit_span = witness_data.slice(witness_offset, 544);
    while let Option::Some(val) = wit_span.pop_front() {
        state = state.update(*val);
    }
    let alpha = state.finalize();

    // Phase II: stream α + carry polynomial (30 felts at offset 544) → z
    let mut state2 = PoseidonTrait::new();
    state2 = state2.update(alpha);
    let mut carry_span = witness_data.slice(witness_offset + 544, 30);
    while let Option::Some(val) = carry_span.pop_front() {
        state2 = state2.update(*val);
    }
    let z = state2.finalize();

    (alpha, z)
}

/// Verify RSA-SHA256 using Schwartz-Zippel polynomial identity testing.
/// Gas-optimized: uses slice + pop_front for all witness access.
pub fn verify_rsa_schwartz_zippel_v2(
    message: @ByteArray,
    signature: @BigUint2048,
    modulus: @BigUint2048,
    witness_data: Span<felt252>,
    witness_offset: usize,
) -> bool {
    let (alpha, z) = derive_challenge_streaming(signature, modulus, witness_data, witness_offset);
    let n_z = eval_poly(modulus.limbs.span(), z);
    let sig_z = eval_poly(signature.limbs.span(), z);

    // Batched check: Σ αⁱ · (Aᵢ(z)² - Qᵢ(z)·N(z) - Rᵢ(z)) == (z - B) · BigT(z)
    let mut lhs: felt252 = 0;
    let mut alpha_pow: felt252 = 1;
    let mut prev_z = sig_z;

    // 16 squaring steps
    let mut i: usize = 0;
    while i != 16 {
        let xi_z = eval_poly_felt(witness_data, witness_offset + i * 16, z);
        let qi_z = eval_poly_felt(witness_data, witness_offset + 272 + i * 16, z);
        lhs = lhs + alpha_pow * (prev_z * prev_z - qi_z * n_z - xi_z);
        alpha_pow = alpha_pow * alpha;
        prev_z = xi_z;
        i += 1;
    }

    // Final multiplication step
    let result_z = eval_poly_felt(witness_data, witness_offset + 256, z);
    let q17_z = eval_poly_felt(witness_data, witness_offset + 272 + 16 * 16, z);
    lhs = lhs + alpha_pow * (prev_z * sig_z - q17_z * n_z - result_z);

    // RHS: (z - B) · BigT(z)
    let big_t_z = eval_carry_poly(witness_data, witness_offset + 544, 30, z);
    let rhs = (z - LIMB_BASE) * big_t_z;

    assert!(lhs == rhs, "Schwartz-Zippel carry polynomial check failed");

    // Compare result polynomial evaluation with expected PKCS#1 v1.5 encoding
    let hash = compute_sha256_byte_array(message);
    let expected = pkcs1_v15_encode(@hash);
    result_z == eval_poly(expected.limbs.span(), z)
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
