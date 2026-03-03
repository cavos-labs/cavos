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
    let mut c: u128 = s0.high;
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

/// Schoolbook multiplication of two 8-limb halves — FULLY UNROLLED (Tier 1+2 optimization).
/// Eliminates all loop overhead and range_check-heavy <= comparisons.
/// Each coefficient k accumulates products a[i]*b[k-i] for i in [max(0,k-7), min(k,7)].
/// Products are summed into felt252 (handles up to 8 × 2^128 without overflow since felt252 ~
/// 2^252).
/// Carry propagates as u256 between coefficients.
/// a_span and b_span must each have exactly 8 elements. Returns 16 result limbs.
fn schoolbook_8x8(a_span: Span<u128>, b_span: Span<u128>) -> Array<u128> {
    let mut result: Array<u128> = array![];

    // k=0: a[0]*b[0]
    let p00 = (*a_span[0]).wide_mul(*b_span[0]);
    let sl: felt252 = p00.low.into();
    let sh: felt252 = p00.high.into();
    let t: u256 = sl.into();
    let mut carry: u256 = t.high.into() + sh.into();
    result.append(t.low);

    // k=1: a[0]*b[1] + a[1]*b[0]
    let p01 = (*a_span[0]).wide_mul(*b_span[1]);
    let p10 = (*a_span[1]).wide_mul(*b_span[0]);
    let sl: felt252 = p01.low.into() + p10.low.into();
    let sh: felt252 = p01.high.into() + p10.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=2: a[0]*b[2] + a[1]*b[1] + a[2]*b[0]
    let p02 = (*a_span[0]).wide_mul(*b_span[2]);
    let p11 = (*a_span[1]).wide_mul(*b_span[1]);
    let p20 = (*a_span[2]).wide_mul(*b_span[0]);
    let sl: felt252 = p02.low.into() + p11.low.into() + p20.low.into();
    let sh: felt252 = p02.high.into() + p11.high.into() + p20.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=3
    let p03 = (*a_span[0]).wide_mul(*b_span[3]);
    let p12 = (*a_span[1]).wide_mul(*b_span[2]);
    let p21 = (*a_span[2]).wide_mul(*b_span[1]);
    let p30 = (*a_span[3]).wide_mul(*b_span[0]);
    let sl: felt252 = p03.low.into() + p12.low.into() + p21.low.into() + p30.low.into();
    let sh: felt252 = p03.high.into() + p12.high.into() + p21.high.into() + p30.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=4
    let p04 = (*a_span[0]).wide_mul(*b_span[4]);
    let p13 = (*a_span[1]).wide_mul(*b_span[3]);
    let p22 = (*a_span[2]).wide_mul(*b_span[2]);
    let p31 = (*a_span[3]).wide_mul(*b_span[1]);
    let p40 = (*a_span[4]).wide_mul(*b_span[0]);
    let sl: felt252 = p04.low.into()
        + p13.low.into()
        + p22.low.into()
        + p31.low.into()
        + p40.low.into();
    let sh: felt252 = p04.high.into()
        + p13.high.into()
        + p22.high.into()
        + p31.high.into()
        + p40.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=5
    let p05 = (*a_span[0]).wide_mul(*b_span[5]);
    let p14 = (*a_span[1]).wide_mul(*b_span[4]);
    let p23 = (*a_span[2]).wide_mul(*b_span[3]);
    let p32 = (*a_span[3]).wide_mul(*b_span[2]);
    let p41 = (*a_span[4]).wide_mul(*b_span[1]);
    let p50 = (*a_span[5]).wide_mul(*b_span[0]);
    let sl: felt252 = p05.low.into()
        + p14.low.into()
        + p23.low.into()
        + p32.low.into()
        + p41.low.into()
        + p50.low.into();
    let sh: felt252 = p05.high.into()
        + p14.high.into()
        + p23.high.into()
        + p32.high.into()
        + p41.high.into()
        + p50.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=6
    let p06 = (*a_span[0]).wide_mul(*b_span[6]);
    let p15 = (*a_span[1]).wide_mul(*b_span[5]);
    let p24 = (*a_span[2]).wide_mul(*b_span[4]);
    let p33 = (*a_span[3]).wide_mul(*b_span[3]);
    let p42 = (*a_span[4]).wide_mul(*b_span[2]);
    let p51 = (*a_span[5]).wide_mul(*b_span[1]);
    let p60 = (*a_span[6]).wide_mul(*b_span[0]);
    let sl: felt252 = p06.low.into()
        + p15.low.into()
        + p24.low.into()
        + p33.low.into()
        + p42.low.into()
        + p51.low.into()
        + p60.low.into();
    let sh: felt252 = p06.high.into()
        + p15.high.into()
        + p24.high.into()
        + p33.high.into()
        + p42.high.into()
        + p51.high.into()
        + p60.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=7 (peak: 8 products)
    let p07 = (*a_span[0]).wide_mul(*b_span[7]);
    let p16 = (*a_span[1]).wide_mul(*b_span[6]);
    let p25 = (*a_span[2]).wide_mul(*b_span[5]);
    let p34 = (*a_span[3]).wide_mul(*b_span[4]);
    let p43 = (*a_span[4]).wide_mul(*b_span[3]);
    let p52 = (*a_span[5]).wide_mul(*b_span[2]);
    let p61 = (*a_span[6]).wide_mul(*b_span[1]);
    let p70 = (*a_span[7]).wide_mul(*b_span[0]);
    let sl: felt252 = p07.low.into()
        + p16.low.into()
        + p25.low.into()
        + p34.low.into()
        + p43.low.into()
        + p52.low.into()
        + p61.low.into()
        + p70.low.into();
    let sh: felt252 = p07.high.into()
        + p16.high.into()
        + p25.high.into()
        + p34.high.into()
        + p43.high.into()
        + p52.high.into()
        + p61.high.into()
        + p70.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=8: a[1]*b[7] + ... + a[7]*b[1]
    let p17 = (*a_span[1]).wide_mul(*b_span[7]);
    let p26 = (*a_span[2]).wide_mul(*b_span[6]);
    let p35 = (*a_span[3]).wide_mul(*b_span[5]);
    let p44 = (*a_span[4]).wide_mul(*b_span[4]);
    let p53 = (*a_span[5]).wide_mul(*b_span[3]);
    let p62 = (*a_span[6]).wide_mul(*b_span[2]);
    let p71 = (*a_span[7]).wide_mul(*b_span[1]);
    let sl: felt252 = p17.low.into()
        + p26.low.into()
        + p35.low.into()
        + p44.low.into()
        + p53.low.into()
        + p62.low.into()
        + p71.low.into();
    let sh: felt252 = p17.high.into()
        + p26.high.into()
        + p35.high.into()
        + p44.high.into()
        + p53.high.into()
        + p62.high.into()
        + p71.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=9: a[2]*b[7] + ... + a[7]*b[2]
    let p27 = (*a_span[2]).wide_mul(*b_span[7]);
    let p36 = (*a_span[3]).wide_mul(*b_span[6]);
    let p45 = (*a_span[4]).wide_mul(*b_span[5]);
    let p54 = (*a_span[5]).wide_mul(*b_span[4]);
    let p63 = (*a_span[6]).wide_mul(*b_span[3]);
    let p72 = (*a_span[7]).wide_mul(*b_span[2]);
    let sl: felt252 = p27.low.into()
        + p36.low.into()
        + p45.low.into()
        + p54.low.into()
        + p63.low.into()
        + p72.low.into();
    let sh: felt252 = p27.high.into()
        + p36.high.into()
        + p45.high.into()
        + p54.high.into()
        + p63.high.into()
        + p72.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=10: a[3]*b[7] + ... + a[7]*b[3]
    let p37 = (*a_span[3]).wide_mul(*b_span[7]);
    let p46 = (*a_span[4]).wide_mul(*b_span[6]);
    let p55 = (*a_span[5]).wide_mul(*b_span[5]);
    let p64 = (*a_span[6]).wide_mul(*b_span[4]);
    let p73 = (*a_span[7]).wide_mul(*b_span[3]);
    let sl: felt252 = p37.low.into()
        + p46.low.into()
        + p55.low.into()
        + p64.low.into()
        + p73.low.into();
    let sh: felt252 = p37.high.into()
        + p46.high.into()
        + p55.high.into()
        + p64.high.into()
        + p73.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=11: a[4]*b[7] + ... + a[7]*b[4]
    let p47 = (*a_span[4]).wide_mul(*b_span[7]);
    let p56 = (*a_span[5]).wide_mul(*b_span[6]);
    let p65 = (*a_span[6]).wide_mul(*b_span[5]);
    let p74 = (*a_span[7]).wide_mul(*b_span[4]);
    let sl: felt252 = p47.low.into() + p56.low.into() + p65.low.into() + p74.low.into();
    let sh: felt252 = p47.high.into() + p56.high.into() + p65.high.into() + p74.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=12: a[5]*b[7] + a[6]*b[6] + a[7]*b[5]
    let p57 = (*a_span[5]).wide_mul(*b_span[7]);
    let p66 = (*a_span[6]).wide_mul(*b_span[6]);
    let p75 = (*a_span[7]).wide_mul(*b_span[5]);
    let sl: felt252 = p57.low.into() + p66.low.into() + p75.low.into();
    let sh: felt252 = p57.high.into() + p66.high.into() + p75.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=13: a[6]*b[7] + a[7]*b[6]
    let p67 = (*a_span[6]).wide_mul(*b_span[7]);
    let p76 = (*a_span[7]).wide_mul(*b_span[6]);
    let sl: felt252 = p67.low.into() + p76.low.into();
    let sh: felt252 = p67.high.into() + p76.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=14: a[7]*b[7]
    let p77 = (*a_span[7]).wide_mul(*b_span[7]);
    let sl: felt252 = p77.low.into();
    let sh: felt252 = p77.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=15: no new products — flush carry
    let t: u256 = carry;
    result.append(t.low); // t.high == 0 for valid 8-limb inputs

    result
}

/// Schoolbook multiplication of two 9-limb numbers — FULLY UNROLLED (Tier 1+2 optimization).
/// Eliminates all loop overhead and range_check-heavy <= comparisons.
/// a_span and b_span must each have exactly 9 elements (indices 0..8). Returns 18 result limbs.
fn schoolbook_9x9(a_span: Span<u128>, b_span: Span<u128>) -> Array<u128> {
    let mut result: Array<u128> = array![];

    // k=0: a[0]*b[0]
    let p00 = (*a_span[0]).wide_mul(*b_span[0]);
    let sl: felt252 = p00.low.into();
    let sh: felt252 = p00.high.into();
    let t: u256 = sl.into();
    let mut carry: u256 = t.high.into() + sh.into();
    result.append(t.low);

    // k=1
    let p01 = (*a_span[0]).wide_mul(*b_span[1]);
    let p10 = (*a_span[1]).wide_mul(*b_span[0]);
    let sl: felt252 = p01.low.into() + p10.low.into();
    let sh: felt252 = p01.high.into() + p10.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=2
    let p02 = (*a_span[0]).wide_mul(*b_span[2]);
    let p11 = (*a_span[1]).wide_mul(*b_span[1]);
    let p20 = (*a_span[2]).wide_mul(*b_span[0]);
    let sl: felt252 = p02.low.into() + p11.low.into() + p20.low.into();
    let sh: felt252 = p02.high.into() + p11.high.into() + p20.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=3
    let p03 = (*a_span[0]).wide_mul(*b_span[3]);
    let p12 = (*a_span[1]).wide_mul(*b_span[2]);
    let p21 = (*a_span[2]).wide_mul(*b_span[1]);
    let p30 = (*a_span[3]).wide_mul(*b_span[0]);
    let sl: felt252 = p03.low.into() + p12.low.into() + p21.low.into() + p30.low.into();
    let sh: felt252 = p03.high.into() + p12.high.into() + p21.high.into() + p30.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=4
    let p04 = (*a_span[0]).wide_mul(*b_span[4]);
    let p13 = (*a_span[1]).wide_mul(*b_span[3]);
    let p22 = (*a_span[2]).wide_mul(*b_span[2]);
    let p31 = (*a_span[3]).wide_mul(*b_span[1]);
    let p40 = (*a_span[4]).wide_mul(*b_span[0]);
    let sl: felt252 = p04.low.into()
        + p13.low.into()
        + p22.low.into()
        + p31.low.into()
        + p40.low.into();
    let sh: felt252 = p04.high.into()
        + p13.high.into()
        + p22.high.into()
        + p31.high.into()
        + p40.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=5
    let p05 = (*a_span[0]).wide_mul(*b_span[5]);
    let p14 = (*a_span[1]).wide_mul(*b_span[4]);
    let p23 = (*a_span[2]).wide_mul(*b_span[3]);
    let p32 = (*a_span[3]).wide_mul(*b_span[2]);
    let p41 = (*a_span[4]).wide_mul(*b_span[1]);
    let p50 = (*a_span[5]).wide_mul(*b_span[0]);
    let sl: felt252 = p05.low.into()
        + p14.low.into()
        + p23.low.into()
        + p32.low.into()
        + p41.low.into()
        + p50.low.into();
    let sh: felt252 = p05.high.into()
        + p14.high.into()
        + p23.high.into()
        + p32.high.into()
        + p41.high.into()
        + p50.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=6
    let p06 = (*a_span[0]).wide_mul(*b_span[6]);
    let p15 = (*a_span[1]).wide_mul(*b_span[5]);
    let p24 = (*a_span[2]).wide_mul(*b_span[4]);
    let p33 = (*a_span[3]).wide_mul(*b_span[3]);
    let p42 = (*a_span[4]).wide_mul(*b_span[2]);
    let p51 = (*a_span[5]).wide_mul(*b_span[1]);
    let p60 = (*a_span[6]).wide_mul(*b_span[0]);
    let sl: felt252 = p06.low.into()
        + p15.low.into()
        + p24.low.into()
        + p33.low.into()
        + p42.low.into()
        + p51.low.into()
        + p60.low.into();
    let sh: felt252 = p06.high.into()
        + p15.high.into()
        + p24.high.into()
        + p33.high.into()
        + p42.high.into()
        + p51.high.into()
        + p60.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=7
    let p07 = (*a_span[0]).wide_mul(*b_span[7]);
    let p16 = (*a_span[1]).wide_mul(*b_span[6]);
    let p25 = (*a_span[2]).wide_mul(*b_span[5]);
    let p34 = (*a_span[3]).wide_mul(*b_span[4]);
    let p43 = (*a_span[4]).wide_mul(*b_span[3]);
    let p52 = (*a_span[5]).wide_mul(*b_span[2]);
    let p61 = (*a_span[6]).wide_mul(*b_span[1]);
    let p70 = (*a_span[7]).wide_mul(*b_span[0]);
    let sl: felt252 = p07.low.into()
        + p16.low.into()
        + p25.low.into()
        + p34.low.into()
        + p43.low.into()
        + p52.low.into()
        + p61.low.into()
        + p70.low.into();
    let sh: felt252 = p07.high.into()
        + p16.high.into()
        + p25.high.into()
        + p34.high.into()
        + p43.high.into()
        + p52.high.into()
        + p61.high.into()
        + p70.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=8: peak — 9 products (i=0..8)
    let p08 = (*a_span[0]).wide_mul(*b_span[8]);
    let p17 = (*a_span[1]).wide_mul(*b_span[7]);
    let p26 = (*a_span[2]).wide_mul(*b_span[6]);
    let p35 = (*a_span[3]).wide_mul(*b_span[5]);
    let p44 = (*a_span[4]).wide_mul(*b_span[4]);
    let p53 = (*a_span[5]).wide_mul(*b_span[3]);
    let p62 = (*a_span[6]).wide_mul(*b_span[2]);
    let p71 = (*a_span[7]).wide_mul(*b_span[1]);
    let p80 = (*a_span[8]).wide_mul(*b_span[0]);
    let sl: felt252 = p08.low.into()
        + p17.low.into()
        + p26.low.into()
        + p35.low.into()
        + p44.low.into()
        + p53.low.into()
        + p62.low.into()
        + p71.low.into()
        + p80.low.into();
    let sh: felt252 = p08.high.into()
        + p17.high.into()
        + p26.high.into()
        + p35.high.into()
        + p44.high.into()
        + p53.high.into()
        + p62.high.into()
        + p71.high.into()
        + p80.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=9: i=1..8
    let p18 = (*a_span[1]).wide_mul(*b_span[8]);
    let p27 = (*a_span[2]).wide_mul(*b_span[7]);
    let p36 = (*a_span[3]).wide_mul(*b_span[6]);
    let p45 = (*a_span[4]).wide_mul(*b_span[5]);
    let p54 = (*a_span[5]).wide_mul(*b_span[4]);
    let p63 = (*a_span[6]).wide_mul(*b_span[3]);
    let p72 = (*a_span[7]).wide_mul(*b_span[2]);
    let p81 = (*a_span[8]).wide_mul(*b_span[1]);
    let sl: felt252 = p18.low.into()
        + p27.low.into()
        + p36.low.into()
        + p45.low.into()
        + p54.low.into()
        + p63.low.into()
        + p72.low.into()
        + p81.low.into();
    let sh: felt252 = p18.high.into()
        + p27.high.into()
        + p36.high.into()
        + p45.high.into()
        + p54.high.into()
        + p63.high.into()
        + p72.high.into()
        + p81.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=10: i=2..8
    let p28 = (*a_span[2]).wide_mul(*b_span[8]);
    let p37 = (*a_span[3]).wide_mul(*b_span[7]);
    let p46 = (*a_span[4]).wide_mul(*b_span[6]);
    let p55 = (*a_span[5]).wide_mul(*b_span[5]);
    let p64 = (*a_span[6]).wide_mul(*b_span[4]);
    let p73 = (*a_span[7]).wide_mul(*b_span[3]);
    let p82 = (*a_span[8]).wide_mul(*b_span[2]);
    let sl: felt252 = p28.low.into()
        + p37.low.into()
        + p46.low.into()
        + p55.low.into()
        + p64.low.into()
        + p73.low.into()
        + p82.low.into();
    let sh: felt252 = p28.high.into()
        + p37.high.into()
        + p46.high.into()
        + p55.high.into()
        + p64.high.into()
        + p73.high.into()
        + p82.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=11: i=3..8
    let p38 = (*a_span[3]).wide_mul(*b_span[8]);
    let p47 = (*a_span[4]).wide_mul(*b_span[7]);
    let p56 = (*a_span[5]).wide_mul(*b_span[6]);
    let p65 = (*a_span[6]).wide_mul(*b_span[5]);
    let p74 = (*a_span[7]).wide_mul(*b_span[4]);
    let p83 = (*a_span[8]).wide_mul(*b_span[3]);
    let sl: felt252 = p38.low.into()
        + p47.low.into()
        + p56.low.into()
        + p65.low.into()
        + p74.low.into()
        + p83.low.into();
    let sh: felt252 = p38.high.into()
        + p47.high.into()
        + p56.high.into()
        + p65.high.into()
        + p74.high.into()
        + p83.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=12: i=4..8
    let p48 = (*a_span[4]).wide_mul(*b_span[8]);
    let p57 = (*a_span[5]).wide_mul(*b_span[7]);
    let p66 = (*a_span[6]).wide_mul(*b_span[6]);
    let p75 = (*a_span[7]).wide_mul(*b_span[5]);
    let p84 = (*a_span[8]).wide_mul(*b_span[4]);
    let sl: felt252 = p48.low.into()
        + p57.low.into()
        + p66.low.into()
        + p75.low.into()
        + p84.low.into();
    let sh: felt252 = p48.high.into()
        + p57.high.into()
        + p66.high.into()
        + p75.high.into()
        + p84.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=13: i=5..8
    let p58 = (*a_span[5]).wide_mul(*b_span[8]);
    let p67 = (*a_span[6]).wide_mul(*b_span[7]);
    let p76 = (*a_span[7]).wide_mul(*b_span[6]);
    let p85 = (*a_span[8]).wide_mul(*b_span[5]);
    let sl: felt252 = p58.low.into() + p67.low.into() + p76.low.into() + p85.low.into();
    let sh: felt252 = p58.high.into() + p67.high.into() + p76.high.into() + p85.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=14: i=6..8
    let p68 = (*a_span[6]).wide_mul(*b_span[8]);
    let p77 = (*a_span[7]).wide_mul(*b_span[7]);
    let p86 = (*a_span[8]).wide_mul(*b_span[6]);
    let sl: felt252 = p68.low.into() + p77.low.into() + p86.low.into();
    let sh: felt252 = p68.high.into() + p77.high.into() + p86.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=15: i=7..8
    let p78 = (*a_span[7]).wide_mul(*b_span[8]);
    let p87 = (*a_span[8]).wide_mul(*b_span[7]);
    let sl: felt252 = p78.low.into() + p87.low.into();
    let sh: felt252 = p78.high.into() + p87.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=16: i=8 only
    let p88 = (*a_span[8]).wide_mul(*b_span[8]);
    let sl: felt252 = p88.low.into();
    let sh: felt252 = p88.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    result.append(t.low);

    // k=17: no products — flush carry
    let t: u256 = carry;
    result.append(t.low); // t.high == 0 for valid 9-limb inputs

    result
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

/// Lower-16-limb multiplication — FULLY UNROLLED (Tier 1+2 optimization).
/// Computes only the lower 2048 bits (16 limbs) of a × b.
/// For coefficient k (0..15): sums a[i]*b[k-i] for i in [0, k].
/// Total: 1+2+...+16 = 136 wide_mul operations.
/// Used in Montgomery reduction for computing m = T_low * n_prime mod R.
pub fn biguint_mul_low(a: @BigUint2048, b: @BigUint2048) -> BigUint2048 {
    let al = a.limbs.span();
    let bl = b.limbs.span();

    // k=0: a[0]*b[0]
    let p = (*al[0]).wide_mul(*bl[0]);
    let sl: felt252 = p.low.into();
    let sh: felt252 = p.high.into();
    let t: u256 = sl.into();
    let mut carry: u256 = t.high.into() + sh.into();
    let l0 = t.low;

    // k=1
    let p01 = (*al[0]).wide_mul(*bl[1]);
    let p10 = (*al[1]).wide_mul(*bl[0]);
    let sl: felt252 = p01.low.into() + p10.low.into();
    let sh: felt252 = p01.high.into() + p10.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l1 = t.low;

    // k=2
    let p02 = (*al[0]).wide_mul(*bl[2]);
    let p11 = (*al[1]).wide_mul(*bl[1]);
    let p20 = (*al[2]).wide_mul(*bl[0]);
    let sl: felt252 = p02.low.into() + p11.low.into() + p20.low.into();
    let sh: felt252 = p02.high.into() + p11.high.into() + p20.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l2 = t.low;

    // k=3
    let p03 = (*al[0]).wide_mul(*bl[3]);
    let p12 = (*al[1]).wide_mul(*bl[2]);
    let p21 = (*al[2]).wide_mul(*bl[1]);
    let p30 = (*al[3]).wide_mul(*bl[0]);
    let sl: felt252 = p03.low.into() + p12.low.into() + p21.low.into() + p30.low.into();
    let sh: felt252 = p03.high.into() + p12.high.into() + p21.high.into() + p30.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l3 = t.low;

    // k=4
    let p04 = (*al[0]).wide_mul(*bl[4]);
    let p13 = (*al[1]).wide_mul(*bl[3]);
    let p22 = (*al[2]).wide_mul(*bl[2]);
    let p31 = (*al[3]).wide_mul(*bl[1]);
    let p40 = (*al[4]).wide_mul(*bl[0]);
    let sl: felt252 = p04.low.into()
        + p13.low.into()
        + p22.low.into()
        + p31.low.into()
        + p40.low.into();
    let sh: felt252 = p04.high.into()
        + p13.high.into()
        + p22.high.into()
        + p31.high.into()
        + p40.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l4 = t.low;

    // k=5
    let p05 = (*al[0]).wide_mul(*bl[5]);
    let p14 = (*al[1]).wide_mul(*bl[4]);
    let p23 = (*al[2]).wide_mul(*bl[3]);
    let p32 = (*al[3]).wide_mul(*bl[2]);
    let p41 = (*al[4]).wide_mul(*bl[1]);
    let p50 = (*al[5]).wide_mul(*bl[0]);
    let sl: felt252 = p05.low.into()
        + p14.low.into()
        + p23.low.into()
        + p32.low.into()
        + p41.low.into()
        + p50.low.into();
    let sh: felt252 = p05.high.into()
        + p14.high.into()
        + p23.high.into()
        + p32.high.into()
        + p41.high.into()
        + p50.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l5 = t.low;

    // k=6
    let p06 = (*al[0]).wide_mul(*bl[6]);
    let p15 = (*al[1]).wide_mul(*bl[5]);
    let p24 = (*al[2]).wide_mul(*bl[4]);
    let p33 = (*al[3]).wide_mul(*bl[3]);
    let p42 = (*al[4]).wide_mul(*bl[2]);
    let p51 = (*al[5]).wide_mul(*bl[1]);
    let p60 = (*al[6]).wide_mul(*bl[0]);
    let sl: felt252 = p06.low.into()
        + p15.low.into()
        + p24.low.into()
        + p33.low.into()
        + p42.low.into()
        + p51.low.into()
        + p60.low.into();
    let sh: felt252 = p06.high.into()
        + p15.high.into()
        + p24.high.into()
        + p33.high.into()
        + p42.high.into()
        + p51.high.into()
        + p60.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l6 = t.low;

    // k=7
    let p07 = (*al[0]).wide_mul(*bl[7]);
    let p16 = (*al[1]).wide_mul(*bl[6]);
    let p25 = (*al[2]).wide_mul(*bl[5]);
    let p34 = (*al[3]).wide_mul(*bl[4]);
    let p43 = (*al[4]).wide_mul(*bl[3]);
    let p52 = (*al[5]).wide_mul(*bl[2]);
    let p61 = (*al[6]).wide_mul(*bl[1]);
    let p70 = (*al[7]).wide_mul(*bl[0]);
    let sl: felt252 = p07.low.into()
        + p16.low.into()
        + p25.low.into()
        + p34.low.into()
        + p43.low.into()
        + p52.low.into()
        + p61.low.into()
        + p70.low.into();
    let sh: felt252 = p07.high.into()
        + p16.high.into()
        + p25.high.into()
        + p34.high.into()
        + p43.high.into()
        + p52.high.into()
        + p61.high.into()
        + p70.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l7 = t.low;

    // k=8
    let p08 = (*al[0]).wide_mul(*bl[8]);
    let p17 = (*al[1]).wide_mul(*bl[7]);
    let p26 = (*al[2]).wide_mul(*bl[6]);
    let p35 = (*al[3]).wide_mul(*bl[5]);
    let p44 = (*al[4]).wide_mul(*bl[4]);
    let p53 = (*al[5]).wide_mul(*bl[3]);
    let p62 = (*al[6]).wide_mul(*bl[2]);
    let p71 = (*al[7]).wide_mul(*bl[1]);
    let p80 = (*al[8]).wide_mul(*bl[0]);
    let sl: felt252 = p08.low.into()
        + p17.low.into()
        + p26.low.into()
        + p35.low.into()
        + p44.low.into()
        + p53.low.into()
        + p62.low.into()
        + p71.low.into()
        + p80.low.into();
    let sh: felt252 = p08.high.into()
        + p17.high.into()
        + p26.high.into()
        + p35.high.into()
        + p44.high.into()
        + p53.high.into()
        + p62.high.into()
        + p71.high.into()
        + p80.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l8 = t.low;

    // k=9
    let p09 = (*al[0]).wide_mul(*bl[9]);
    let p18 = (*al[1]).wide_mul(*bl[8]);
    let p27 = (*al[2]).wide_mul(*bl[7]);
    let p36 = (*al[3]).wide_mul(*bl[6]);
    let p45 = (*al[4]).wide_mul(*bl[5]);
    let p54 = (*al[5]).wide_mul(*bl[4]);
    let p63 = (*al[6]).wide_mul(*bl[3]);
    let p72 = (*al[7]).wide_mul(*bl[2]);
    let p81 = (*al[8]).wide_mul(*bl[1]);
    let p90 = (*al[9]).wide_mul(*bl[0]);
    let sl: felt252 = p09.low.into()
        + p18.low.into()
        + p27.low.into()
        + p36.low.into()
        + p45.low.into()
        + p54.low.into()
        + p63.low.into()
        + p72.low.into()
        + p81.low.into()
        + p90.low.into();
    let sh: felt252 = p09.high.into()
        + p18.high.into()
        + p27.high.into()
        + p36.high.into()
        + p45.high.into()
        + p54.high.into()
        + p63.high.into()
        + p72.high.into()
        + p81.high.into()
        + p90.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l9 = t.low;

    // k=10
    let p0a = (*al[0]).wide_mul(*bl[10]);
    let p19 = (*al[1]).wide_mul(*bl[9]);
    let p28 = (*al[2]).wide_mul(*bl[8]);
    let p37 = (*al[3]).wide_mul(*bl[7]);
    let p46 = (*al[4]).wide_mul(*bl[6]);
    let p55 = (*al[5]).wide_mul(*bl[5]);
    let p64 = (*al[6]).wide_mul(*bl[4]);
    let p73 = (*al[7]).wide_mul(*bl[3]);
    let p82 = (*al[8]).wide_mul(*bl[2]);
    let p91 = (*al[9]).wide_mul(*bl[1]);
    let pa0 = (*al[10]).wide_mul(*bl[0]);
    let sl: felt252 = p0a.low.into()
        + p19.low.into()
        + p28.low.into()
        + p37.low.into()
        + p46.low.into()
        + p55.low.into()
        + p64.low.into()
        + p73.low.into()
        + p82.low.into()
        + p91.low.into()
        + pa0.low.into();
    let sh: felt252 = p0a.high.into()
        + p19.high.into()
        + p28.high.into()
        + p37.high.into()
        + p46.high.into()
        + p55.high.into()
        + p64.high.into()
        + p73.high.into()
        + p82.high.into()
        + p91.high.into()
        + pa0.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l10 = t.low;

    // k=11
    let p0b = (*al[0]).wide_mul(*bl[11]);
    let p1a = (*al[1]).wide_mul(*bl[10]);
    let p29 = (*al[2]).wide_mul(*bl[9]);
    let p38 = (*al[3]).wide_mul(*bl[8]);
    let p47 = (*al[4]).wide_mul(*bl[7]);
    let p56 = (*al[5]).wide_mul(*bl[6]);
    let p65 = (*al[6]).wide_mul(*bl[5]);
    let p74 = (*al[7]).wide_mul(*bl[4]);
    let p83 = (*al[8]).wide_mul(*bl[3]);
    let p92 = (*al[9]).wide_mul(*bl[2]);
    let pa1 = (*al[10]).wide_mul(*bl[1]);
    let pb0 = (*al[11]).wide_mul(*bl[0]);
    let sl: felt252 = p0b.low.into()
        + p1a.low.into()
        + p29.low.into()
        + p38.low.into()
        + p47.low.into()
        + p56.low.into()
        + p65.low.into()
        + p74.low.into()
        + p83.low.into()
        + p92.low.into()
        + pa1.low.into()
        + pb0.low.into();
    let sh: felt252 = p0b.high.into()
        + p1a.high.into()
        + p29.high.into()
        + p38.high.into()
        + p47.high.into()
        + p56.high.into()
        + p65.high.into()
        + p74.high.into()
        + p83.high.into()
        + p92.high.into()
        + pa1.high.into()
        + pb0.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l11 = t.low;

    // k=12
    let p0c = (*al[0]).wide_mul(*bl[12]);
    let p1b = (*al[1]).wide_mul(*bl[11]);
    let p2a = (*al[2]).wide_mul(*bl[10]);
    let p39 = (*al[3]).wide_mul(*bl[9]);
    let p48 = (*al[4]).wide_mul(*bl[8]);
    let p57 = (*al[5]).wide_mul(*bl[7]);
    let p66 = (*al[6]).wide_mul(*bl[6]);
    let p75 = (*al[7]).wide_mul(*bl[5]);
    let p84 = (*al[8]).wide_mul(*bl[4]);
    let p93 = (*al[9]).wide_mul(*bl[3]);
    let pa2 = (*al[10]).wide_mul(*bl[2]);
    let pb1 = (*al[11]).wide_mul(*bl[1]);
    let pc0 = (*al[12]).wide_mul(*bl[0]);
    let sl: felt252 = p0c.low.into()
        + p1b.low.into()
        + p2a.low.into()
        + p39.low.into()
        + p48.low.into()
        + p57.low.into()
        + p66.low.into()
        + p75.low.into()
        + p84.low.into()
        + p93.low.into()
        + pa2.low.into()
        + pb1.low.into()
        + pc0.low.into();
    let sh: felt252 = p0c.high.into()
        + p1b.high.into()
        + p2a.high.into()
        + p39.high.into()
        + p48.high.into()
        + p57.high.into()
        + p66.high.into()
        + p75.high.into()
        + p84.high.into()
        + p93.high.into()
        + pa2.high.into()
        + pb1.high.into()
        + pc0.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l12 = t.low;

    // k=13
    let p0d = (*al[0]).wide_mul(*bl[13]);
    let p1c = (*al[1]).wide_mul(*bl[12]);
    let p2b = (*al[2]).wide_mul(*bl[11]);
    let p3a = (*al[3]).wide_mul(*bl[10]);
    let p49 = (*al[4]).wide_mul(*bl[9]);
    let p58 = (*al[5]).wide_mul(*bl[8]);
    let p67 = (*al[6]).wide_mul(*bl[7]);
    let p76 = (*al[7]).wide_mul(*bl[6]);
    let p85 = (*al[8]).wide_mul(*bl[5]);
    let p94 = (*al[9]).wide_mul(*bl[4]);
    let pa3 = (*al[10]).wide_mul(*bl[3]);
    let pb2 = (*al[11]).wide_mul(*bl[2]);
    let pc1 = (*al[12]).wide_mul(*bl[1]);
    let pd0 = (*al[13]).wide_mul(*bl[0]);
    let sl: felt252 = p0d.low.into()
        + p1c.low.into()
        + p2b.low.into()
        + p3a.low.into()
        + p49.low.into()
        + p58.low.into()
        + p67.low.into()
        + p76.low.into()
        + p85.low.into()
        + p94.low.into()
        + pa3.low.into()
        + pb2.low.into()
        + pc1.low.into()
        + pd0.low.into();
    let sh: felt252 = p0d.high.into()
        + p1c.high.into()
        + p2b.high.into()
        + p3a.high.into()
        + p49.high.into()
        + p58.high.into()
        + p67.high.into()
        + p76.high.into()
        + p85.high.into()
        + p94.high.into()
        + pa3.high.into()
        + pb2.high.into()
        + pc1.high.into()
        + pd0.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l13 = t.low;

    // k=14
    let p0e = (*al[0]).wide_mul(*bl[14]);
    let p1d = (*al[1]).wide_mul(*bl[13]);
    let p2c = (*al[2]).wide_mul(*bl[12]);
    let p3b = (*al[3]).wide_mul(*bl[11]);
    let p4a = (*al[4]).wide_mul(*bl[10]);
    let p59 = (*al[5]).wide_mul(*bl[9]);
    let p68 = (*al[6]).wide_mul(*bl[8]);
    let p77 = (*al[7]).wide_mul(*bl[7]);
    let p86 = (*al[8]).wide_mul(*bl[6]);
    let p95 = (*al[9]).wide_mul(*bl[5]);
    let pa4 = (*al[10]).wide_mul(*bl[4]);
    let pb3 = (*al[11]).wide_mul(*bl[3]);
    let pc2 = (*al[12]).wide_mul(*bl[2]);
    let pd1 = (*al[13]).wide_mul(*bl[1]);
    let pe0 = (*al[14]).wide_mul(*bl[0]);
    let sl: felt252 = p0e.low.into()
        + p1d.low.into()
        + p2c.low.into()
        + p3b.low.into()
        + p4a.low.into()
        + p59.low.into()
        + p68.low.into()
        + p77.low.into()
        + p86.low.into()
        + p95.low.into()
        + pa4.low.into()
        + pb3.low.into()
        + pc2.low.into()
        + pd1.low.into()
        + pe0.low.into();
    let sh: felt252 = p0e.high.into()
        + p1d.high.into()
        + p2c.high.into()
        + p3b.high.into()
        + p4a.high.into()
        + p59.high.into()
        + p68.high.into()
        + p77.high.into()
        + p86.high.into()
        + p95.high.into()
        + pa4.high.into()
        + pb3.high.into()
        + pc2.high.into()
        + pd1.high.into()
        + pe0.high.into();
    let t: u256 = carry + sl.into();
    carry = t.high.into() + sh.into();
    let l14 = t.low;

    // k=15 (peak: 16 products)
    let p0f = (*al[0]).wide_mul(*bl[15]);
    let p1e = (*al[1]).wide_mul(*bl[14]);
    let p2d = (*al[2]).wide_mul(*bl[13]);
    let p3c = (*al[3]).wide_mul(*bl[12]);
    let p4b = (*al[4]).wide_mul(*bl[11]);
    let p5a = (*al[5]).wide_mul(*bl[10]);
    let p69 = (*al[6]).wide_mul(*bl[9]);
    let p78 = (*al[7]).wide_mul(*bl[8]);
    let p87 = (*al[8]).wide_mul(*bl[7]);
    let p96 = (*al[9]).wide_mul(*bl[6]);
    let pa5 = (*al[10]).wide_mul(*bl[5]);
    let pb4 = (*al[11]).wide_mul(*bl[4]);
    let pc3 = (*al[12]).wide_mul(*bl[3]);
    let pd2 = (*al[13]).wide_mul(*bl[2]);
    let pe1 = (*al[14]).wide_mul(*bl[1]);
    let pf0 = (*al[15]).wide_mul(*bl[0]);
    let sl: felt252 = p0f.low.into()
        + p1e.low.into()
        + p2d.low.into()
        + p3c.low.into()
        + p4b.low.into()
        + p5a.low.into()
        + p69.low.into()
        + p78.low.into()
        + p87.low.into()
        + p96.low.into()
        + pa5.low.into()
        + pb4.low.into()
        + pc3.low.into()
        + pd2.low.into()
        + pe1.low.into()
        + pf0.low.into();
    // high parts at k=15 contribute only to carry-out beyond 2048 bits — discard
    let t: u256 = carry + sl.into();
    let l15 = t.low;

    BigUint2048 { limbs: [l0, l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14, l15] }
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

/// Montgomery reduction (Tier 3 optimization): converts x from Montgomery form to standard form.
/// Equivalent to biguint_mul_mont(x, one, n, n_prime) but skips the x*1 Karatsuba multiplication.
/// Since T = x * 1 = x (with implicit zero upper 2048 bits), x is used directly as T_low.
/// Saves one full Karatsuba call (~209 wide_mul operations) vs biguint_mul_mont(x, one, ...).
pub fn biguint_mont_reduce(x: @BigUint2048, n: @BigUint2048, n_prime: @BigUint2048) -> BigUint2048 {
    // T = x (T_low = x, T_high = 0 — no multiplication needed)
    let m = biguint_mul_low(x, n_prime);

    // mn = m * n (full width)
    let mn_wide = biguint_mul_wide(@m, n);

    // carry_from_low = carry bit from (T_low + mn_low) = (x + mn_low)
    let (_sum_low, carry_low) = biguint_add(
        x, @biguint_from_limbs(array_to_fixed_16_from_32(@mn_wide.limbs).span()),
    );

    // (T + mn) / R: T_high = 0, so result = mn_high + carry_low
    let mn_high = BigUint2048 { limbs: array_to_fixed_16_high_from_32(@mn_wide.limbs) };
    let (res, carry2) = biguint_add(@mn_high, @biguint_from_u128(carry_low));

    // carry1 = 0 (since T_high = 0, biguint_add(0, mn_high) never overflows)
    if carry2 > 0 || biguint_gte(@res, n) {
        biguint_sub(@res, n)
    } else {
        res
    }
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

/// Compute R mod n = 2^{2048} mod n for a standard RSA-2048 modulus n.
/// Requires 2^{2047} < n < 2^{2048} (MSB set), which holds for all 2048-bit RSA keys.
/// Under this condition floor(2^{2048} / n) == 1, so R mod n == 2^{2048} - n
/// == two's complement of n in 2048 bits == NOT(n) + 1.
pub fn compute_r_mod_n(n: @BigUint2048) -> BigUint2048 {
    let max: u128 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    let s = n.limbs.span();
    let mut result: Array<u128> = array![];
    let mut carry: u128 = 1;
    let mut i: usize = 0;
    // Tier 1 fix: use != instead of < (eliminates range_check builtin per iteration)
    while i != 16 {
        let not_limb: u128 = max - *s[i];
        let sum: u256 = not_limb.into() + carry.into();
        result.append(sum.low);
        carry = sum.high;
        i += 1;
    }
    // carry is 0 for all nonzero n (guaranteed for RSA moduli)
    biguint_from_limbs(result.span())
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
