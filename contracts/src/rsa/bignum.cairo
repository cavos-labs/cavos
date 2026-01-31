/// Big number arithmetic for RSA-2048 verification.
/// Represents 2048-bit numbers as 16 x 128-bit limbs (little-endian).
/// Implements modular multiplication and exponentiation needed for RSA.

/// A 2048-bit unsigned integer stored as 16 x u128 limbs in little-endian order.
/// limbs[0] is the least significant 128-bit word.
#[derive(Copy, Drop, Serde)]
pub struct BigUint2048 {
    pub limbs: [u128; 16],
}

/// A 4096-bit unsigned integer for intermediate multiplication results.
/// Stored as 32 x u128 limbs in little-endian order.
#[derive(Drop)]
struct BigUint4096 {
    limbs: [u128; 32],
}

/// Creates a BigUint2048 from a single u128 value (for small constants like the exponent).
pub fn biguint_from_u128(value: u128) -> BigUint2048 {
    BigUint2048 { limbs: [value, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
}

/// Creates a zero BigUint2048.
pub fn biguint_zero() -> BigUint2048 {
    biguint_from_u128(0)
}

/// Creates a one BigUint2048.
pub fn biguint_one() -> BigUint2048 {
    biguint_from_u128(1)
}

/// Checks if two BigUint2048 are equal.
pub fn biguint_eq(a: @BigUint2048, b: @BigUint2048) -> bool {
    let a_limbs = a.limbs.span();
    let b_limbs = b.limbs.span();
    let mut i: usize = 0;
    loop {
        if i == 16 {
            break true;
        }
        if *a_limbs[i] != *b_limbs[i] {
            break false;
        }
        i += 1;
    }
}

/// Compares a >= b for 2048-bit numbers.
fn biguint_gte(a: @BigUint2048, b: @BigUint2048) -> bool {
    let a_limbs = a.limbs.span();
    let b_limbs = b.limbs.span();
    let mut i: usize = 16;
    loop {
        if i == 0 {
            break true; // all equal
        }
        i -= 1;
        if *a_limbs[i] > *b_limbs[i] {
            break true;
        }
        if *a_limbs[i] < *b_limbs[i] {
            break false;
        }
    }
}

/// Adds two BigUint2048 values. Returns (result, carry).
/// Does NOT reduce modulo anything.
fn biguint_add(a: @BigUint2048, b: @BigUint2048) -> (BigUint2048, u128) {
    let a_limbs = a.limbs.span();
    let b_limbs = b.limbs.span();
    let mut result: Array<u128> = array![];
    let mut carry: u128 = 0;
    let mut i: usize = 0;
    while i != 16 {
        let a_val: u256 = (*a_limbs[i]).into();
        let b_val: u256 = (*b_limbs[i]).into();
        let sum: u256 = a_val + b_val + carry.into();
        let limb: u128 = (sum & 0xffffffffffffffffffffffffffffffff_u256).try_into().unwrap();
        carry = (sum / 0x100000000000000000000000000000000_u256).try_into().unwrap();
        result.append(limb);
        i += 1;
    }
    let res = BigUint2048 { limbs: array_to_fixed_16(ref result) };
    (res, carry)
}

/// Subtracts b from a (assumes a >= b). Returns result.
fn biguint_sub(a: @BigUint2048, b: @BigUint2048) -> BigUint2048 {
    let a_limbs = a.limbs.span();
    let b_limbs = b.limbs.span();
    let mut result: Array<u128> = array![];
    let mut borrow: u128 = 0;
    let mut i: usize = 0;
    while i != 16 {
        let a_val: u256 = (*a_limbs[i]).into();
        let b_val: u256 = (*b_limbs[i]).into() + borrow.into();
        if a_val >= b_val {
            let diff: u128 = (a_val - b_val).try_into().unwrap();
            result.append(diff);
            borrow = 0;
        } else {
            // Borrow from next limb
            let diff: u128 = (a_val + 0x100000000000000000000000000000000_u256 - b_val)
                .try_into()
                .unwrap();
            result.append(diff);
            borrow = 1;
        }
        i += 1;
    }
    BigUint2048 { limbs: array_to_fixed_16(ref result) }
}

/// Schoolbook multiplication of two 2048-bit numbers.
/// Returns a 4096-bit result.
fn biguint_mul_wide(a: @BigUint2048, b: @BigUint2048) -> BigUint4096 {
    let a_limbs = a.limbs.span();
    let b_limbs = b.limbs.span();

    // Initialize 32-limb result to zero
    let mut result: Array<u256> = array![];
    let mut k: usize = 0;
    while k != 32 {
        result.append(0_u256);
        k += 1;
    }

    // Schoolbook multiply: for each pair (i, j), add a[i] * b[j] to result[i+j]
    let mut i: usize = 0;
    while i != 16 {
        let mut carry: u256 = 0;
        let a_val: u256 = (*a_limbs[i]).into();
        let mut j: usize = 0;
        loop {
            if j == 16 {
                // Propagate remaining carry
                let idx = i + j;
                if idx < 32 {
                    let mut propagate_idx = idx;
                    while carry != 0 && propagate_idx < 32 {
                        let current = *result[propagate_idx];
                        let sum = current + carry;
                        result =
                            array_set_u256(
                                ref result,
                                propagate_idx,
                                sum & 0xffffffffffffffffffffffffffffffff_u256,
                            );
                        carry = sum / 0x100000000000000000000000000000000_u256;
                        propagate_idx += 1;
                    };
                }
                break;
            }
            let b_val: u256 = (*b_limbs[j]).into();
            let product: u256 = a_val * b_val;
            let idx = i + j;
            let current = *result[idx];
            let sum: u256 = current + product + carry;
            // Store low 128 bits, carry high 128 bits
            result = array_set_u256(ref result, idx, sum & 0xffffffffffffffffffffffffffffffff_u256);
            carry = sum / 0x100000000000000000000000000000000_u256;
            j += 1;
        }
        i += 1;
    }

    // Convert u256 array to u128 fixed array
    let mut limbs_arr: Array<u128> = array![];
    let mut m: usize = 0;
    while m != 32 {
        let val: u128 = (*result[m]).try_into().unwrap();
        limbs_arr.append(val);
        m += 1;
    }
    BigUint4096 { limbs: array_to_fixed_32(ref limbs_arr) }
}

/// Modular multiplication: (a * b) mod n
/// Uses schoolbook multiply then Barrett-like reduction.
pub fn biguint_mulmod(a: @BigUint2048, b: @BigUint2048, n: @BigUint2048) -> BigUint2048 {
    let product = biguint_mul_wide(a, b);
    biguint_mod_4096(@product, n)
}

/// Reduces a 4096-bit number modulo a 2048-bit modulus.
/// Uses repeated subtraction with shifting for simplicity.
/// For RSA-65537, this is called only ~17 times so performance is acceptable.
fn biguint_mod_4096(a: @BigUint4096, n: @BigUint2048) -> BigUint2048 {
    // We use a simple bit-by-bit reduction approach:
    // Process from MSB to LSB, shift left and subtract modulus when >= n.
    let a_limbs = a.limbs.span();
    let mut result = biguint_zero();

    // Find highest non-zero bit in a (4096-bit)
    let total_bits: usize = 4096;
    let mut bit_idx: usize = total_bits;

    while bit_idx != 0 {
        bit_idx -= 1;

        // Shift result left by 1
        result = biguint_shift_left_1(@result);

        // Add current bit of a
        let limb_idx = bit_idx / 128;

        let bit_pos: u32 = (bit_idx % 128);

        let limb_val = *a_limbs[limb_idx];

        let bit: u128 = (limb_val / pow2_u128(bit_pos)) % 2;

        if bit == 1 {
            // Add 1 to result
            let one = biguint_one();
            let (sum, _) = biguint_add(@result, @one);
            result = sum;
        }

        // If result >= n, subtract n
        if biguint_gte(@result, n) {
            result = biguint_sub(@result, n);
        }
    }
    result
}

/// Shift a BigUint2048 left by 1 bit.
fn biguint_shift_left_1(a: @BigUint2048) -> BigUint2048 {
    let a_limbs = a.limbs.span();
    let mut result: Array<u128> = array![];
    let mut carry: u128 = 0;
    let mut i: usize = 0;
    while i != 16 {
        let val = *a_limbs[i];
        let val256: u256 = val.into();
        let shifted256 = val256 * 2;
        let low: u128 = (shifted256 & 0xffffffffffffffffffffffffffffffff_u256).try_into().unwrap();
        let new_carry: u128 = (shifted256 / 0x100000000000000000000000000000000_u256)
            .try_into()
            .unwrap();
        result.append(low + carry);
        carry = new_carry;
        i += 1;
    }
    // Discard top carry (we only have 2048 bits)
    BigUint2048 { limbs: array_to_fixed_16(ref result) }
}

/// Modular exponentiation: base^exp mod n
/// Optimized for exp = 65537 (RSA public exponent).
/// Uses square-and-multiply (right-to-left binary method).
pub fn biguint_modexp(base: @BigUint2048, exp: @BigUint2048, n: @BigUint2048) -> BigUint2048 {
    let mut result = biguint_one();
    let mut b = *base;
    let exp_limbs = exp.limbs.span();

    // Process each bit of the exponent
    let mut limb_idx: usize = 0;
    while limb_idx != 16 {
        let limb = *exp_limbs[limb_idx];
        if limb == 0 && limb_idx > 0 {
            // Still need to square base 128 times for this limb
            let mut bit: u32 = 0;
            while bit != 128 {
                b = biguint_mulmod(@b, @b, n);
                bit += 1;
            }
            limb_idx += 1;
            continue;
        }
        let mut bit: u32 = 0;
        while bit != 128 {
            // Check if current bit is set
            let bit_val = (limb / pow2_u128(bit)) % 2;
            if bit_val == 1 {
                result = biguint_mulmod(@result, @b, n);
            }
            b = biguint_mulmod(@b, @b, n);
            bit += 1;
        }
        limb_idx += 1;
    }
    result
}

/// Modular exponentiation specifically for e=65537.
/// 65537 = 2^16 + 1, so we need only 16 squarings and 2 multiplications.
pub fn biguint_modexp_65537(base: @BigUint2048, n: @BigUint2048) -> BigUint2048 {
    let mut result = *base;
    let mut i: u32 = 0;
    while i != 16 {
        result = biguint_mulmod(@result, @result, n);
        i += 1;
    }
    // Now result = base^(2^16). Multiply by base to get base^(2^16 + 1) = base^65537
    result = biguint_mulmod(@result, base, n);
    result
}

/// Power of 2 for u128 (returns 2^exp for exp in 0..127).
fn pow2_u128(exp: u32) -> u128 {
    if exp == 0 {
        return 1;
    }
    let mut result: u128 = 1;
    let mut i: u32 = 0;
    while i != exp {
        result = result * 2;
        i += 1;
    }
    result
}

/// Helper: Convert a mutable Array<u128> of exactly 16 elements to a fixed array.
fn array_to_fixed_16(ref arr: Array<u128>) -> [u128; 16] {
    let s = arr.span();
    [
        *s[0], *s[1], *s[2], *s[3], *s[4], *s[5], *s[6], *s[7], *s[8], *s[9], *s[10], *s[11],
        *s[12], *s[13], *s[14], *s[15],
    ]
}

/// Helper: Convert a mutable Array<u128> of exactly 32 elements to a fixed array.
fn array_to_fixed_32(ref arr: Array<u128>) -> [u128; 32] {
    let s = arr.span();
    [
        *s[0], *s[1], *s[2], *s[3], *s[4], *s[5], *s[6], *s[7], *s[8], *s[9], *s[10], *s[11],
        *s[12], *s[13], *s[14], *s[15], *s[16], *s[17], *s[18], *s[19], *s[20], *s[21], *s[22],
        *s[23], *s[24], *s[25], *s[26], *s[27], *s[28], *s[29], *s[30], *s[31],
    ]
}

/// Helper: Set value at index in a u256 array (returns new array since Cairo arrays are immutable).
fn array_set_u256(ref arr: Array<u256>, idx: usize, value: u256) -> Array<u256> {
    let span = arr.span();
    let len = span.len();
    let mut new_arr: Array<u256> = array![];
    let mut i: usize = 0;
    while i != len {
        if i == idx {
            new_arr.append(value);
        } else {
            new_arr.append(*span[i]);
        }
        i += 1;
    }
    new_arr
}

/// Construct BigUint2048 from an Array<u128> of exactly 16 limbs (little-endian).
pub fn biguint_from_limbs(limbs: Span<u128>) -> BigUint2048 {
    assert!(limbs.len() == 16, "Expected 16 limbs for BigUint2048");
    let mut arr: Array<u128> = array![];
    let mut i: usize = 0;
    while i != 16 {
        arr.append(*limbs[i]);
        i += 1;
    }
    BigUint2048 { limbs: array_to_fixed_16(ref arr) }
}

/// Construct BigUint2048 from a byte array (big-endian, 256 bytes for RSA-2048).
pub fn biguint_from_bytes(bytes: Span<u8>) -> BigUint2048 {
    assert!(bytes.len() <= 256, "Too many bytes for BigUint2048");
    // Pad to 256 bytes (big-endian, left-pad with zeros)
    let pad_len = 256 - bytes.len();
    let mut limbs: Array<u128> = array![];

    // Process 16 bytes at a time (128 bits), from least significant (end) to most significant
    let mut limb_idx: usize = 0;
    while limb_idx != 16 {
        let mut limb: u128 = 0;
        let mut byte_idx: usize = 0;
        while byte_idx != 16 {
            // The byte position in big-endian order
            // limb_idx=0 is least significant, so byte positions 240..255
            let be_pos: usize = 255 - (limb_idx * 16 + byte_idx);
            let byte_val: u128 = if be_pos < pad_len {
                0
            } else {
                (*bytes[be_pos - pad_len]).into()
            };
            // byte_idx=0 is least significant byte in this limb
            limb = limb + byte_val * pow2_u128(byte_idx * 8);
            byte_idx += 1;
        }
        limbs.append(limb);
        limb_idx += 1;
    }
    BigUint2048 { limbs: array_to_fixed_16(ref limbs) }
}
