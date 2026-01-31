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

/// Find the index of a byte in a span, starting from a given offset.
pub fn find_byte(data: Span<u8>, byte: u8, from: usize) -> Option<usize> {
    let len = data.len();
    let mut i = from;
    loop {
        if i >= len {
            break Option::None;
        }
        if *data[i] == byte {
            break Option::Some(i);
        }
        i += 1;
    }
}

/// Split JWT into header, payload, and signature parts by finding '.' delimiters.
/// Returns (header_end, payload_start, payload_end, sig_start) indices.
pub fn split_jwt(jwt_bytes: Span<u8>) -> (usize, usize, usize, usize) {
    let dot1 = find_byte(jwt_bytes, '.', 0).expect('JWT missing first dot');
    let dot2 = find_byte(jwt_bytes, '.', dot1 + 1).expect('JWT missing second dot');
    (dot1, dot1 + 1, dot2, dot2 + 1)
}

/// Extract the signed portion of a JWT (header.payload) for RSA verification.
pub fn get_signed_data(jwt_bytes: Span<u8>) -> Span<u8> {
    let (_, _, payload_end, _) = split_jwt(jwt_bytes);
    jwt_bytes.slice(0, payload_end)
}
