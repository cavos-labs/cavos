/// Base64URL decoder for JWT parsing.
/// Decodes Base64URL-encoded strings (RFC 4648 §5) used in JWTs.

/// Decode a single Base64URL character to its 6-bit value.
/// Returns Option::None for invalid characters.
fn decode_char(c: u8) -> Option<u8> {
    if c >= 'A' && c <= 'Z' {
        Option::Some(c - 'A')
    } else if c >= 'a' && c <= 'z' {
        Option::Some(c - 'a' + 26)
    } else if c >= '0' && c <= '9' {
        Option::Some(c - '0' + 52)
    } else if c == '-' {
        // Base64URL uses '-' instead of '+'
        Option::Some(62)
    } else if c == '_' {
        // Base64URL uses '_' instead of '/'
        Option::Some(63)
    } else if c == '=' {
        // Padding character
        Option::Some(0)
    } else {
        Option::None
    }
}

/// Decode a Base64URL-encoded byte array.
/// Returns the decoded bytes, or panics on invalid input.
pub fn base64url_decode(input: Span<u8>) -> Array<u8> {
    let len = input.len();
    let mut output: Array<u8> = array![];
    let mut i: usize = 0;

    while i + 3 < len {
        let a = decode_char(*input[i]).expect('invalid base64 char');
        let b = decode_char(*input[i + 1]).expect('invalid base64 char');
        let c = decode_char(*input[i + 2]).expect('invalid base64 char');
        let d = decode_char(*input[i + 3]).expect('invalid base64 char');

        // Combine 4 x 6-bit values into 3 bytes
        let combined: u32 = a.into() * 0x40000_u32
            + b.into() * 0x1000_u32
            + c.into() * 0x40_u32
            + d.into();

        output.append(((combined / 0x10000) & 0xff).try_into().unwrap());

        // Check for padding
        if *input[i + 2] != '=' {
            output.append(((combined / 0x100) & 0xff).try_into().unwrap());
        }
        if *input[i + 3] != '=' {
            output.append((combined & 0xff).try_into().unwrap());
        }

        i += 4;
    };

    // Handle remaining bytes (Base64URL may omit padding)
    let remaining = len - i;
    if remaining == 2 {
        let a = decode_char(*input[i]).expect('invalid base64 char');
        let b = decode_char(*input[i + 1]).expect('invalid base64 char');
        let combined: u32 = a.into() * 0x40_u32 + b.into();
        output.append(((combined / 0x10) & 0xff).try_into().unwrap());
    } else if remaining == 3 {
        let a = decode_char(*input[i]).expect('invalid base64 char');
        let b = decode_char(*input[i + 1]).expect('invalid base64 char');
        let c = decode_char(*input[i + 2]).expect('invalid base64 char');
        let combined: u32 = a.into() * 0x1000_u32 + b.into() * 0x40_u32 + c.into();
        output.append(((combined / 0x400) & 0xff).try_into().unwrap());
        output.append(((combined / 0x4) & 0xff).try_into().unwrap());
    }

    output
}
