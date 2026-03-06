/// RSA-SHA256 (PKCS#1 v1.5) signature verification.
/// Verifies JWT RS256 signatures from Google/Apple OAuth providers.
///
/// The Schwartz-Zippel proof now uses a safe field representation:
///   - public RSA values remain 16 x u128 limbs in `BigUint2048`
///   - proof polynomials use 17 limbs in base 2^123
///
/// This keeps registry/storage compatibility while preventing coefficient wrap in
/// Stark's field during polynomial checks.

use core::hash::HashStateTrait;
use core::poseidon::PoseidonTrait;
use core::sha256::compute_sha256_byte_array;
use super::bignum::BigUint2048;

// ── Schwartz-Zippel RSA verification
// ───────────────────────────────────
//
// Integer identity: a² = q·n + r
// Polynomial form:  A(X)² ≠ Q(X)·N(X) + R(X) — carries between limbs break this!
// Correct form:     A(X)² - Q(X)·N(X) - R(X) = (X - B) · T(X)   where B = 2^123
//
// Using 17 limbs in base 2^123 keeps the worst-case convolution coefficient
// below the Stark field modulus:
//   17 * (2^123 - 1)^2 < p
//
// We batch all 17 arithmetic steps using a random α:
//   Σ αⁱ · [Aᵢ(z)² - Qᵢ(z)·N(z) - Rᵢ(z)] = (z - B) · BigT(z)
// where BigT = Σ αⁱ · Tᵢ  (32 coefficients, degree 31).

const PROOF_LIMB_BASE: felt252 = 0x8000000000000000000000000000000;
const PROOF_LIMB_BASE_U128: u128 = 0x8000000000000000000000000000000;
const PROOF_LIMB_MASK: u128 = 0x7ffffffffffffffffffffffffffffff;

const PROOF_LIMBS: usize = 17;
const SQUARE_STEPS: usize = 16;
const PRIMARY_WITNESS_FELTS: usize = 578;
const RESULT_OFFSET: usize = 272;
const QUOTIENT_OFFSET: usize = 289;
const FINAL_QUOTIENT_OFFSET: usize = 561;
const CARRY_OFFSET: usize = 578;
const CARRY_COEFFS: usize = 32;

#[derive(Copy, Drop)]
pub struct ProofBigUint2048 {
    pub limbs: [felt252; 17],
}

fn array_to_fixed_17(ref limbs: Array<felt252>) -> [felt252; 17] {
    let mut span = limbs.span();
    [
        *span.pop_front().unwrap(), *span.pop_front().unwrap(), *span.pop_front().unwrap(),
        *span.pop_front().unwrap(), *span.pop_front().unwrap(), *span.pop_front().unwrap(),
        *span.pop_front().unwrap(), *span.pop_front().unwrap(), *span.pop_front().unwrap(),
        *span.pop_front().unwrap(), *span.pop_front().unwrap(), *span.pop_front().unwrap(),
        *span.pop_front().unwrap(), *span.pop_front().unwrap(), *span.pop_front().unwrap(),
        *span.pop_front().unwrap(), *span.pop_front().unwrap(),
    ]
}

fn biguint_shr_123(value: @BigUint2048) -> BigUint2048 {
    let s = value.limbs.span();
    BigUint2048 {
        limbs: [
            (*s[0] / PROOF_LIMB_BASE_U128) + ((*s[1] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[1] / PROOF_LIMB_BASE_U128) + ((*s[2] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[2] / PROOF_LIMB_BASE_U128) + ((*s[3] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[3] / PROOF_LIMB_BASE_U128) + ((*s[4] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[4] / PROOF_LIMB_BASE_U128) + ((*s[5] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[5] / PROOF_LIMB_BASE_U128) + ((*s[6] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[6] / PROOF_LIMB_BASE_U128) + ((*s[7] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[7] / PROOF_LIMB_BASE_U128) + ((*s[8] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[8] / PROOF_LIMB_BASE_U128) + ((*s[9] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[9] / PROOF_LIMB_BASE_U128) + ((*s[10] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[10] / PROOF_LIMB_BASE_U128) + ((*s[11] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[11] / PROOF_LIMB_BASE_U128) + ((*s[12] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[12] / PROOF_LIMB_BASE_U128) + ((*s[13] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[13] / PROOF_LIMB_BASE_U128) + ((*s[14] & PROOF_LIMB_MASK) * 0x20_u128),
            (*s[14] / PROOF_LIMB_BASE_U128) + ((*s[15] & PROOF_LIMB_MASK) * 0x20_u128),
            *s[15] / PROOF_LIMB_BASE_U128,
        ],
    }
}

pub fn biguint_to_proof_biguint(value: @BigUint2048) -> ProofBigUint2048 {
    let mut remaining = *value;
    let mut limbs: Array<felt252> = array![];

    let mut i: usize = 0;
    while i != 16 {
        let head = remaining.limbs.span();
        limbs.append(((*head[0]) & PROOF_LIMB_MASK).into());
        remaining = biguint_shr_123(@remaining);
        i += 1;
    }

    let tail = remaining.limbs.span();
    limbs.append((*tail[0]).into());

    ProofBigUint2048 { limbs: array_to_fixed_17(ref limbs) }
}

fn eval_poly(limbs: Span<felt252>, z: felt252) -> felt252 {
    let last = limbs.len() - 1;
    let mut result: felt252 = *limbs[last];
    let mut i: usize = last;
    while i != 0 {
        i -= 1;
        result = *limbs[i] + z * result;
    }
    result
}

fn eval_poly_felt(data: Span<felt252>, offset: usize, z: felt252) -> felt252 {
    let mut chunk = data.slice(offset, PROOF_LIMBS);
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
    let c16 = *chunk.pop_front().unwrap();

    let mut r = c16;
    r = c15 + z * r;
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

fn eval_carry_poly(coeffs: Span<felt252>, offset: usize, n: usize, z: felt252) -> felt252 {
    let mut chunk = coeffs.slice(offset, n);
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

fn absorb_proof_biguint(ref state: core::poseidon::HashState, b: @ProofBigUint2048) {
    let mut limbs = b.limbs.span();
    while let Option::Some(val) = limbs.pop_front() {
        state = state.update(*val);
    };
}

fn derive_challenge_streaming(
    sig: @ProofBigUint2048,
    n: @ProofBigUint2048,
    witness_data: Span<felt252>,
    witness_offset: usize,
) -> (felt252, felt252) {
    let mut state = PoseidonTrait::new();
    absorb_proof_biguint(ref state, sig);
    absorb_proof_biguint(ref state, n);

    let mut wit_span = witness_data.slice(witness_offset, PRIMARY_WITNESS_FELTS);
    while let Option::Some(val) = wit_span.pop_front() {
        state = state.update(*val);
    }
    let alpha = state.finalize();

    let mut state2 = PoseidonTrait::new();
    state2 = state2.update(alpha);
    let mut carry_span = witness_data.slice(witness_offset + CARRY_OFFSET, CARRY_COEFFS);
    while let Option::Some(val) = carry_span.pop_front() {
        state2 = state2.update(*val);
    }
    let z = state2.finalize();

    (alpha, z)
}

pub fn verify_rsa_schwartz_zippel_v2(
    message: @ByteArray,
    signature: @BigUint2048,
    modulus: @ProofBigUint2048,
    witness_data: Span<felt252>,
    witness_offset: usize,
) -> bool {
    let signature_proof = biguint_to_proof_biguint(signature);

    let (alpha, z) = derive_challenge_streaming(
        @signature_proof, modulus, witness_data, witness_offset,
    );
    let n_z = eval_poly(modulus.limbs.span(), z);
    let sig_z = eval_poly(signature_proof.limbs.span(), z);

    let mut lhs: felt252 = 0;
    let mut alpha_pow: felt252 = 1;
    let mut prev_z = sig_z;

    let mut i: usize = 0;
    while i != SQUARE_STEPS {
        let xi_z = eval_poly_felt(witness_data, witness_offset + i * PROOF_LIMBS, z);
        let qi_z = eval_poly_felt(
            witness_data, witness_offset + QUOTIENT_OFFSET + i * PROOF_LIMBS, z,
        );
        lhs = lhs + alpha_pow * (prev_z * prev_z - qi_z * n_z - xi_z);
        alpha_pow = alpha_pow * alpha;
        prev_z = xi_z;
        i += 1;
    }

    let result_z = eval_poly_felt(witness_data, witness_offset + RESULT_OFFSET, z);
    let q17_z = eval_poly_felt(witness_data, witness_offset + FINAL_QUOTIENT_OFFSET, z);
    lhs = lhs + alpha_pow * (prev_z * sig_z - q17_z * n_z - result_z);

    let big_t_z = eval_carry_poly(witness_data, witness_offset + CARRY_OFFSET, CARRY_COEFFS, z);
    let rhs = (z - PROOF_LIMB_BASE) * big_t_z;

    assert!(lhs == rhs, "Schwartz-Zippel carry polynomial check failed");

    let hash = compute_sha256_byte_array(message);
    let expected = pkcs1_v15_encode(@hash);
    let expected_proof = biguint_to_proof_biguint(@expected);

    result_z == eval_poly(expected_proof.limbs.span(), z)
}

fn pkcs1_v15_encode(hash: @[u32; 8]) -> BigUint2048 {
    let hash_span = hash.span();

    let w0: u128 = (*hash_span[0]).into();
    let w1: u128 = (*hash_span[1]).into();
    let w2: u128 = (*hash_span[2]).into();
    let w3: u128 = (*hash_span[3]).into();
    let limb_1 = (w0 * 0x1000000000000000000000000_u128)
        + (w1 * 0x10000000000000000_u128)
        + (w2 * 0x100000000_u128)
        + w3;

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
            limb_0, limb_1, 0x0d060960864801650304020105000420, 0xffffffffffffffffffffffff00303130,
            0xffffffffffffffffffffffffffffffff, 0xffffffffffffffffffffffffffffffff,
            0xffffffffffffffffffffffffffffffff, 0xffffffffffffffffffffffffffffffff,
            0xffffffffffffffffffffffffffffffff, 0xffffffffffffffffffffffffffffffff,
            0xffffffffffffffffffffffffffffffff, 0xffffffffffffffffffffffffffffffff,
            0xffffffffffffffffffffffffffffffff, 0xffffffffffffffffffffffffffffffff,
            0xffffffffffffffffffffffffffffffff, 0x0001ffffffffffffffffffffffffffff,
        ],
    }
}
