/// Big number arithmetic for RSA-2048 verification.
/// Represents 2048-bit numbers as 16 x 128-bit limbs (little-endian).
/// Implements modular multiplication and exponentiation needed for RSA.

use core::num::traits::WideMul;

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
    let al = a.limbs.span();
    let bl = b.limbs.span();
    let s0: u256 = (*al[0]).into() + (*bl[0]).into();
    let l0 = s0.low;
    let mut c: u128 = s0.high.try_into().unwrap();
    let s1: u256 = (*al[1]).into() + (*bl[1]).into() + c.into();
    let l1 = s1.low;
    c = s1.high;
    let s2: u256 = (*al[2]).into() + (*bl[2]).into() + c.into();
    let l2 = s2.low;
    c = s2.high;
    let s3: u256 = (*al[3]).into() + (*bl[3]).into() + c.into();
    let l3 = s3.low;
    c = s3.high;
    let s4: u256 = (*al[4]).into() + (*bl[4]).into() + c.into();
    let l4 = s4.low;
    c = s4.high;
    let s5: u256 = (*al[5]).into() + (*bl[5]).into() + c.into();
    let l5 = s5.low;
    c = s5.high;
    let s6: u256 = (*al[6]).into() + (*bl[6]).into() + c.into();
    let l6 = s6.low;
    c = s6.high;
    let s7: u256 = (*al[7]).into() + (*bl[7]).into() + c.into();
    let l7 = s7.low;
    c = s7.high;
    let s8: u256 = (*al[8]).into() + (*bl[8]).into() + c.into();
    let l8 = s8.low;
    c = s8.high;
    let s9: u256 = (*al[9]).into() + (*bl[9]).into() + c.into();
    let l9 = s9.low;
    c = s9.high;
    let s10: u256 = (*al[10]).into() + (*bl[10]).into() + c.into();
    let l10 = s10.low;
    c = s10.high;
    let s11: u256 = (*al[11]).into() + (*bl[11]).into() + c.into();
    let l11 = s11.low;
    c = s11.high;
    let s12: u256 = (*al[12]).into() + (*bl[12]).into() + c.into();
    let l12 = s12.low;
    c = s12.high;
    let s13: u256 = (*al[13]).into() + (*bl[13]).into() + c.into();
    let l13 = s13.low;
    c = s13.high;
    let s14: u256 = (*al[14]).into() + (*bl[14]).into() + c.into();
    let l14 = s14.low;
    c = s14.high;
    let s15: u256 = (*al[15]).into() + (*bl[15]).into() + c.into();
    let l15 = s15.low;
    c = s15.high;
    (
        BigUint2048 {
            limbs: [l0, l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14, l15],
        },
        c,
    )
}

/// Subtracts b from a (assumes a >= b). Returns result.
fn biguint_sub(a: @BigUint2048, b: @BigUint2048) -> BigUint2048 {
    let al = a.limbs.span();
    let bl = b.limbs.span();

    let v0: u256 = (*al[0]).into();
    let k0: u256 = (*bl[0]).into();
    let (l0, mut bw) = if v0 >= k0 {
        ((v0 - k0).try_into().unwrap(), 0)
    } else {
        ((v0 + 0x100000000000000000000000000000000_u256 - k0).try_into().unwrap(), 1_u256)
    };
    let v1: u256 = (*al[1]).into();
    let k1: u256 = (*bl[1]).into() + bw;
    let (l1, bw) = if v1 >= k1 {
        ((v1 - k1).try_into().unwrap(), 0)
    } else {
        ((v1 + 0x100000000000000000000000000000000_u256 - k1).try_into().unwrap(), 1_u256)
    };
    let v2: u256 = (*al[2]).into();
    let k2: u256 = (*bl[2]).into() + bw;
    let (l2, bw) = if v2 >= k2 {
        ((v2 - k2).try_into().unwrap(), 0)
    } else {
        ((v2 + 0x100000000000000000000000000000000_u256 - k2).try_into().unwrap(), 1_u256)
    };
    let v3: u256 = (*al[3]).into();
    let k3: u256 = (*bl[3]).into() + bw;
    let (l3, bw) = if v3 >= k3 {
        ((v3 - k3).try_into().unwrap(), 0)
    } else {
        ((v3 + 0x100000000000000000000000000000000_u256 - k3).try_into().unwrap(), 1_u256)
    };
    let v4: u256 = (*al[4]).into();
    let k4: u256 = (*bl[4]).into() + bw;
    let (l4, bw) = if v4 >= k4 {
        ((v4 - k4).try_into().unwrap(), 0)
    } else {
        ((v4 + 0x100000000000000000000000000000000_u256 - k4).try_into().unwrap(), 1_u256)
    };
    let v5: u256 = (*al[5]).into();
    let k5: u256 = (*bl[5]).into() + bw;
    let (l5, bw) = if v5 >= k5 {
        ((v5 - k5).try_into().unwrap(), 0)
    } else {
        ((v5 + 0x100000000000000000000000000000000_u256 - k5).try_into().unwrap(), 1_u256)
    };
    let v6: u256 = (*al[6]).into();
    let k6: u256 = (*bl[6]).into() + bw;
    let (l6, bw) = if v6 >= k6 {
        ((v6 - k6).try_into().unwrap(), 0)
    } else {
        ((v6 + 0x100000000000000000000000000000000_u256 - k6).try_into().unwrap(), 1_u256)
    };
    let v7: u256 = (*al[7]).into();
    let k7: u256 = (*bl[7]).into() + bw;
    let (l7, bw) = if v7 >= k7 {
        ((v7 - k7).try_into().unwrap(), 0)
    } else {
        ((v7 + 0x100000000000000000000000000000000_u256 - k7).try_into().unwrap(), 1_u256)
    };
    let v8: u256 = (*al[8]).into();
    let k8: u256 = (*bl[8]).into() + bw;
    let (l8, bw) = if v8 >= k8 {
        ((v8 - k8).try_into().unwrap(), 0)
    } else {
        ((v8 + 0x100000000000000000000000000000000_u256 - k8).try_into().unwrap(), 1_u256)
    };
    let v9: u256 = (*al[9]).into();
    let k9: u256 = (*bl[9]).into() + bw;
    let (l9, bw) = if v9 >= k9 {
        ((v9 - k9).try_into().unwrap(), 0)
    } else {
        ((v9 + 0x100000000000000000000000000000000_u256 - k9).try_into().unwrap(), 1_u256)
    };
    let v10: u256 = (*al[10]).into();
    let k10: u256 = (*bl[10]).into() + bw;
    let (l10, bw) = if v10 >= k10 {
        ((v10 - k10).try_into().unwrap(), 0)
    } else {
        ((v10 + 0x100000000000000000000000000000000_u256 - k10).try_into().unwrap(), 1_u256)
    };
    let v11: u256 = (*al[11]).into();
    let k11: u256 = (*bl[11]).into() + bw;
    let (l11, bw) = if v11 >= k11 {
        ((v11 - k11).try_into().unwrap(), 0)
    } else {
        ((v11 + 0x100000000000000000000000000000000_u256 - k11).try_into().unwrap(), 1_u256)
    };
    let v12: u256 = (*al[12]).into();
    let k12: u256 = (*bl[12]).into() + bw;
    let (l12, bw) = if v12 >= k12 {
        ((v12 - k12).try_into().unwrap(), 0)
    } else {
        ((v12 + 0x100000000000000000000000000000000_u256 - k12).try_into().unwrap(), 1_u256)
    };
    let v13: u256 = (*al[13]).into();
    let k13: u256 = (*bl[13]).into() + bw;
    let (l13, bw) = if v13 >= k13 {
        ((v13 - k13).try_into().unwrap(), 0)
    } else {
        ((v13 + 0x100000000000000000000000000000000_u256 - k13).try_into().unwrap(), 1_u256)
    };
    let v14: u256 = (*al[14]).into();
    let k14: u256 = (*bl[14]).into() + bw;
    let (l14, bw) = if v14 >= k14 {
        ((v14 - k14).try_into().unwrap(), 0)
    } else {
        ((v14 + 0x100000000000000000000000000000000_u256 - k14).try_into().unwrap(), 1_u256)
    };
    let v15: u256 = (*al[15]).into();
    let k15: u256 = (*bl[15]).into() + bw;
    let (l15, _bw) = if v15 >= k15 {
        ((v15 - k15).try_into().unwrap(), 0)
    } else {
        ((v15 + 0x100000000000000000000000000000000_u256 - k15).try_into().unwrap(), 1_u256)
    };

    BigUint2048 { limbs: [l0, l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14, l15] }
}

/// Schoolbook multiplication of two 8-limb halves.
/// a_span and b_span must each have exactly 8 elements.
/// Returns 16 result limbs in an Array<u128>.
fn schoolbook_8x8(a_span: Span<u128>, b_span: Span<u128>) -> Array<u128> {
    let mut result_limbs: Array<u128> = array![];
    let mut carry: u256 = 0;

    let mut k: usize = 0;
    while k != 16 {
        let mut loop_sum_low: felt252 = 0;
        let mut loop_sum_high: felt252 = 0;

        let start_i = if k > 7 {
            k - 7
        } else {
            0
        };
        let end_i = if k < 7 {
            k
        } else {
            7
        };

        let mut i: usize = start_i;
        while i <= end_i {
            let j = k - i;
            let prod = (*a_span[i]).wide_mul(*b_span[j]);
            loop_sum_low += prod.low.into();
            loop_sum_high += prod.high.into();
            i += 1;
        }

        let lsl256: u256 = loop_sum_low.into();
        let lsh256: u256 = loop_sum_high.into();
        let total_flat = carry + lsl256;
        result_limbs.append(total_flat.low);
        carry = total_flat.high.into() + lsh256;
        k += 1;
    }

    result_limbs
}

/// Schoolbook multiplication of two 9-limb numbers (for Karatsuba cross-product).
/// a_span and b_span must each have exactly 9 elements.
/// Returns 18 result limbs in an Array<u128>.
fn schoolbook_9x9(a_span: Span<u128>, b_span: Span<u128>) -> Array<u128> {
    let mut result_limbs: Array<u128> = array![];
    let mut carry: u256 = 0;

    let mut k: usize = 0;
    while k != 18 {
        let mut loop_sum_low: felt252 = 0;
        let mut loop_sum_high: felt252 = 0;

        let start_i = if k > 8 {
            k - 8
        } else {
            0
        };
        let end_i = if k < 8 {
            k
        } else {
            8
        };

        let mut i: usize = start_i;
        while i <= end_i {
            let j = k - i;
            let prod = (*a_span[i]).wide_mul(*b_span[j]);
            loop_sum_low += prod.low.into();
            loop_sum_high += prod.high.into();
            i += 1;
        }

        let lsl256: u256 = loop_sum_low.into();
        let lsh256: u256 = loop_sum_high.into();
        let total_flat = carry + lsl256;
        result_limbs.append(total_flat.low);
        carry = total_flat.high.into() + lsh256;
        k += 1;
    }

    result_limbs
}

/// Karatsuba multiplication of two 2048-bit numbers.
/// Splits each 16-limb number into two 8-limb halves:
///   a = a_hi * B + a_lo, b = b_hi * B + b_lo (B = 2^1024)
/// Then: a * b = z2*B² + z1*B + z0
///   z0 = a_lo * b_lo (8×8 = 64 products)
///   z2 = a_hi * b_hi (8×8 = 64 products)
///   z1 = (a_lo + a_hi) * (b_lo + b_hi) - z0 - z2 (9×9 = 81 products)
/// Total: ~209 products vs 256 schoolbook.
fn biguint_mul_wide(a: @BigUint2048, b: @BigUint2048) -> BigUint4096 {
    let a_limbs = a.limbs.span();
    let b_limbs = b.limbs.span();

    // Split into halves
    let a_lo = a_limbs.slice(0, 8);
    let a_hi = a_limbs.slice(8, 8);
    let b_lo = b_limbs.slice(0, 8);
    let b_hi = b_limbs.slice(8, 8);

    // z0 = a_lo × b_lo (16 limbs)
    let z0 = schoolbook_8x8(a_lo, b_lo);
    let z0_span = z0.span();

    // z2 = a_hi × b_hi (16 limbs)
    let z2 = schoolbook_8x8(a_hi, b_hi);
    let z2_span = z2.span();

    // Compute (a_lo + a_hi) and (b_lo + b_hi) — each can be up to 9 limbs
    let mut sum_a: Array<u128> = array![];
    let mut c_a: u128 = 0;
    let mut i: usize = 0;
    while i != 8 {
        let s: u256 = (*a_lo[i]).into() + (*a_hi[i]).into() + c_a.into();
        sum_a.append(s.low);
        c_a = s.high;
        i += 1;
    }
    sum_a.append(c_a);

    let mut sum_b: Array<u128> = array![];
    let mut c_b: u128 = 0;
    let mut j: usize = 0;
    while j != 8 {
        let s: u256 = (*b_lo[j]).into() + (*b_hi[j]).into() + c_b.into();
        sum_b.append(s.low);
        c_b = s.high;
        j += 1;
    }
    sum_b.append(c_b);

    // z_mid = (a_lo + a_hi) × (b_lo + b_hi) (9×9 = 81 products, 18 limbs)
    let z_mid = schoolbook_9x9(sum_a.span(), sum_b.span());
    let z_mid_span = z_mid.span();

    // z1 = z_mid - z0 - z2 (can be up to 18 limbs, stored with borrow handling)
    // First pass: temp1 = z_mid - z0
    let mut temp1: Array<u128> = array![];
    let mut borrow: u256 = 0;
    let mut k: usize = 0;
    while k != 18 {
        let mid_val: u256 = (*z_mid_span[k]).into();
        let z0_val: u256 = if k < 16 {
            (*z0_span[k]).into()
        } else {
            0
        };
        let sub_total = z0_val + borrow;

        let (limb, new_borrow) = if mid_val >= sub_total {
            ((mid_val - sub_total).try_into().unwrap(), 0_u256)
        } else {
            (
                (mid_val + 0x100000000000000000000000000000000_u256 - sub_total)
                    .try_into()
                    .unwrap(),
                1_u256,
            )
        };
        temp1.append(limb);
        borrow = new_borrow;
        k += 1;
    }
    let temp1_span = temp1.span();

    // Second pass: z1_arr = temp1 - z2
    let mut z1_arr: Array<u128> = array![];
    let mut borrow2: u256 = 0;
    let mut k: usize = 0;
    while k != 18 {
        let temp1_val: u256 = (*temp1_span[k]).into();
        let z2_val: u256 = if k < 16 {
            (*z2_span[k]).into()
        } else {
            0
        };
        let sub_total = z2_val + borrow2;

        let (limb, new_borrow) = if temp1_val >= sub_total {
            ((temp1_val - sub_total).try_into().unwrap(), 0_u256)
        } else {
            (
                (temp1_val + 0x100000000000000000000000000000000_u256 - sub_total)
                    .try_into()
                    .unwrap(),
                1_u256,
            )
        };
        z1_arr.append(limb);
        borrow2 = new_borrow;
        k += 1;
    }
    let z1_span = z1_arr.span();

    // Assemble result: r[0..7] = z0[0..7]
    //                   r[8..15] = z0[8..15] + z1[0..7]
    //                   r[16..23] = z2[0..7] + z1[8..15]
    //                   r[24..31] = z2[8..15] + z1[16..17]
    let mut result: Array<u128> = array![];
    let mut carry: u256 = 0;

    // Limbs 0..7: just z0
    let mut p: usize = 0;
    while p != 8 {
        result.append(*z0_span[p]);
        p += 1;
    }

    // Limbs 8..15: z0[8..15] + z1[0..7]
    let mut p: usize = 0;
    while p != 8 {
        let s: u256 = (*z0_span[8 + p]).into() + (*z1_span[p]).into() + carry;
        result.append(s.low);
        carry = s.high.into();
        p += 1;
    }

    // Limbs 16..23: z2[0..7] + z1[8..15]
    let mut p: usize = 0;
    while p != 8 {
        let z1_val: u256 = if (8 + p) < 18 {
            (*z1_span[8 + p]).into()
        } else {
            0
        };
        let s: u256 = (*z2_span[p]).into() + z1_val + carry;
        result.append(s.low);
        carry = s.high.into();
        p += 1;
    }

    // Limbs 24..31: z2[8..15] + z1[16..17] (z1 only has 18 limbs, so 16,17 are the tail)
    let mut p: usize = 0;
    while p != 8 {
        let z1_val: u256 = if (16 + p) < 18 {
            (*z1_span[16 + p]).into()
        } else {
            0
        };
        let s: u256 = (*z2_span[8 + p]).into() + z1_val + carry;
        result.append(s.low);
        carry = s.high.into();
        p += 1;
    }

    BigUint4096 { limbs: array_to_fixed_32(ref result) }
}

/// Specialized multiplication that only returns the lower 2048 bits (16 limbs).
/// Used in Montgomery reduction for calculating 'm'.
/// Saves about 40% of multiplication work.
pub fn biguint_mul_low(a: @BigUint2048, b: @BigUint2048) -> BigUint2048 {
    let a_limbs = a.limbs.span();
    let b_limbs = b.limbs.span();

    let mut result_limbs: Array<u128> = array![];
    let mut carry: u256 = 0;

    let mut k: usize = 0;
    while k != 16 {
        let mut loop_sum_low: felt252 = 0;
        let mut loop_sum_high: felt252 = 0;

        let mut i: usize = 0;
        while i <= k {
            let j = k - i;
            let prod = (*a_limbs[i]).wide_mul(*b_limbs[j]);
            loop_sum_low += prod.low.into();
            loop_sum_high += prod.high.into();
            i += 1;
        }

        let lsl256: u256 = loop_sum_low.into();
        let lsh256: u256 = loop_sum_high.into();

        let total_flat = carry + lsl256;
        result_limbs.append(total_flat.low);
        carry = total_flat.high.into() + lsh256;
        k += 1;
    }

    BigUint2048 { limbs: array_to_fixed_16(ref result_limbs) }
}

/// Montgomery multiplication: (a * b * R^-1) mod n
/// R = 2^2048. n_prime = -n^-1 mod R.
/// Assumes a < n, b < n.
pub fn biguint_mul_mont(
    a: @BigUint2048, b: @BigUint2048, n: @BigUint2048, n_prime: @BigUint2048,
) -> BigUint2048 {
    // 1. T = a * b
    let T = biguint_mul_wide(a, b); // 4096 bits

    // 2. m = (T mod R) * n' mod R
    // T mod R is just the lower 16 limbs of T.
    let T_low_limbs = array_to_fixed_16_from_32(@T.limbs);
    let T_low = BigUint2048 { limbs: T_low_limbs };

    // We only need the lower 16 limbs of the product result for mod R
    let m = biguint_mul_low(@T_low, n_prime);

    // 3. t = (T + m * n) / R
    let mn_wide = biguint_mul_wide(@m, n);
    let (_sum_low, carry_low) = biguint_add(
        @T_low, @biguint_from_limbs(array_to_fixed_16_from_32(@mn_wide.limbs).span()),
    );

    // We need to add T + mn. Since we divide by R, we are interested in the upper 2048+ bits.
    // T + mn = (T_high * R + T_low) + (mn_high * R + mn_low)
    // We know T_low + mn_low should be 0 mod R, effectively just producing a carry to the high
    // part.
    // So (T + mn) / R = T_high + mn_high + carry_from_low_addition

    let T_high_limbs = array_to_fixed_16_high_from_32(@T.limbs);
    let T_high = BigUint2048 { limbs: T_high_limbs };

    let mn_high_limbs = array_to_fixed_16_high_from_32(@mn_wide.limbs);
    let mn_high = BigUint2048 { limbs: mn_high_limbs };

    // Add high parts and the carry from the low part addition
    let (res_partial, carry1) = biguint_add(@T_high, @mn_high);
    let (res, carry2) = biguint_add(@res_partial, @biguint_from_u128(carry_low));

    let total_carry = carry1 + carry2; // Can be at most 1 because a,b < n < R

    // 4. if t >= n then t - n else t
    // If we have a carry overflow (total_carry > 0), result is definitely >= n (actually >= R > n)
    if total_carry > 0 || biguint_gte(@res, n) {
        biguint_sub(@res, n)
    } else {
        res
    }
}

/// Helper to get lower 16 limbs from 32 limbs array
fn array_to_fixed_16_from_32(limbs: @[u128; 32]) -> [u128; 16] {
    let s = limbs.span();
    [
        *s[0], *s[1], *s[2], *s[3], *s[4], *s[5], *s[6], *s[7], *s[8], *s[9], *s[10], *s[11],
        *s[12], *s[13], *s[14], *s[15],
    ]
}

/// Helper to get upper 16 limbs from 32 limbs array
fn array_to_fixed_16_high_from_32(limbs: @[u128; 32]) -> [u128; 16] {
    let s = limbs.span();
    [
        *s[16], *s[17], *s[18], *s[19], *s[20], *s[21], *s[22], *s[23], *s[24], *s[25], *s[26],
        *s[27], *s[28], *s[29], *s[30], *s[31],
    ]
}

/// Montgomery exponentiation specifically for e=65537.
pub fn biguint_modexp_65537_mont(
    base_mont: @BigUint2048, n: @BigUint2048, n_prime: @BigUint2048,
) -> BigUint2048 {
    let mut result = *base_mont;
    let mut i: u32 = 0;
    // Square 16 times
    while i != 16 {
        result = biguint_mul_mont(@result, @result, n, n_prime);
        i += 1;
    }
    // Multiply by base once
    result = biguint_mul_mont(@result, base_mont, n, n_prime);
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
    BigUint2048 {
        limbs: [
            *limbs[0], *limbs[1], *limbs[2], *limbs[3], *limbs[4], *limbs[5], *limbs[6], *limbs[7],
            *limbs[8], *limbs[9], *limbs[10], *limbs[11], *limbs[12], *limbs[13], *limbs[14],
            *limbs[15],
        ],
    }
}

/// Construct BigUint2048 from a byte array (big-endian, 256 bytes for RSA-2048).
pub fn biguint_from_bytes(bytes: Span<u8>) -> BigUint2048 {
    assert!(bytes.len() <= 256, "Too many bytes for BigUint2048");
    let pad_len = 256 - bytes.len();
    let mut limbs: Array<u128> = array![];

    let mut limb_idx: usize = 0;
    while limb_idx != 16 {
        let mut limb: u128 = 0;
        let mut byte_idx: usize = 0;
        let mut multiplier: u128 = 1;

        while byte_idx != 16 {
            let be_pos: usize = 255 - (limb_idx * 16 + byte_idx);
            let byte_val: u128 = if be_pos < pad_len {
                0
            } else {
                (*bytes[be_pos - pad_len]).into()
            };
            limb = limb + byte_val * multiplier;

            if byte_idx != 15 {
                multiplier *= 256;
            }
            byte_idx += 1;
        }
        limbs.append(limb);
        limb_idx += 1;
    }
    BigUint2048 { limbs: array_to_fixed_16(ref limbs) }
}
