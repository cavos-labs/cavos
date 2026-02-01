/// JWT parser for extracting claims from Google/Apple JWTs.
/// Parses the payload to extract `sub`, `nonce`, `exp`, and `kid` from header.
///
/// Note: Full JSON parsing in Cairo is expensive. Instead, we use a simplified
/// approach where the SDK pre-parses the JWT and passes structured data.
/// The contract verifies the RSA signature on the raw JWT bytes, ensuring
/// the pre-parsed data matches.

/// Parsed JWT data passed from the SDK.
/// The SDK pre-parses the JWT and provides structured fields.
/// The contract verifies the RSA signature on the original JWT to ensure integrity.
#[derive(Copy, Drop, Serde)]
pub struct JWTData {
    /// The `sub` claim (Google/Apple user ID) as felt252
    pub sub: felt252,
    /// The `nonce` claim as felt252
    pub nonce: felt252,
    /// The `exp` claim (expiration timestamp)
    pub exp: u64,
    /// The `kid` (key ID) from the JWT header
    pub kid: felt252,
    /// The `iss` (issuer) claim as felt252 hash
    pub iss: felt252,
    /// The `aud` (audience / app_id) claim as felt252 hash
    pub aud: felt252,
}

/// Find the index of a byte in a ByteArray, starting from a given offset.
pub fn find_byte(data: @ByteArray, byte: u8, from: usize) -> Option<usize> {
    let len = data.len();
    let mut i = from;
    loop {
        if i >= len {
            break Option::None;
        }
        if data.at(i).unwrap() == byte {
            break Option::Some(i);
        }
        i += 1;
    }
}

/// Split JWT into header, payload, and signature parts by finding '.' delimiters.
/// Returns (header_end, payload_start, payload_end, sig_start) indices.
pub fn split_jwt(jwt_bytes: @ByteArray) -> (usize, usize, usize, usize) {
    let dot1 = find_byte(jwt_bytes, '.', 0).expect('JWT missing first dot');
    let dot2 = find_byte(jwt_bytes, '.', dot1 + 1).expect('JWT missing second dot');
    (dot1, dot1 + 1, dot2, dot2 + 1)
}

/// Split just the signed portion of a JWT (header.payload) into header and payload parts.
/// Returns (header_end, payload_start, payload_end) indices.
pub fn split_signed_data(signed_bytes: @ByteArray) -> (usize, usize, usize) {
    let dot1 = find_byte(signed_bytes, '.', 0).expect('Signed data missing dot');
    (dot1, dot1 + 1, signed_bytes.len())
}


/// Parse a decimal string (ASCII bytes) to a felt252.
pub fn parse_decimal(data: Span<u8>) -> felt252 {
    let mut result: felt252 = 0;
    let mut i = 0;
    let len = data.len();
    while i < len {
        let byte = *data[i];
        assert!(byte >= 48 && byte <= 57, "Not a decimal digit");
        result = result * 10 + (byte - 48).into();
        i += 1;
    }
    result
}

/// Parse a hex string (ASCII bytes, optionally starting with 0x) to a felt252.
pub fn parse_hex(data: Span<u8>) -> felt252 {
    let mut result: felt252 = 0;
    let mut i = 0;
    let len = data.len();

    // Skip 0x prefix if present
    if len >= 2 && *data[0] == 48 && *data[1] == 120 {
        i = 2;
    }

    while i < len {
        let byte = *data[i];
        let val: u8 = if byte >= 48 && byte <= 57 { // 0-9
            byte - 48
        } else if byte >= 97 && byte <= 102 { // a-f
            byte - 87
        } else if byte >= 65 && byte <= 70 { // A-F
            byte - 55
        } else {
            panic!("Not a hex digit")
        };
        result = result * 16 + val.into();
        i += 1;
    }
    result
}
