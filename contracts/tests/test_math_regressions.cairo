#[cfg(test)]
mod tests {
    use cavos::cavos::Cavos::{
        SessionTimeLimits, SessionTimeLimitsStorePacking, SessionUsageLimits,
        SessionUsageLimitsStorePacking, oauth_policy_start,
    };
    use cavos::jwt::base64::base64url_decode_window;
    use cavos::jwt::jwt_parser::{hash_utf8_bytes, parse_decimal, parse_hex};

    fn byte_array_to_bytes(data: @ByteArray) -> Array<u8> {
        let mut result: Array<u8> = array![];
        let mut i: usize = 0;
        while i < data.len() {
            result.append(data.at(i).unwrap());
            i += 1;
        }
        result
    }

    fn build_oauth_signature_prefix(jwt_bytes_len: usize) -> Array<felt252> {
        let mut signature: Array<felt252> = array![];

        let mut i: usize = 0;
        while i < 37 {
            signature.append(0);
            i += 1;
        }

        signature.append(610);

        i = 0;
        while i < 610 {
            signature.append(0);
            i += 1;
        }

        signature.append(jwt_bytes_len.into());

        let jwt_chunks = (jwt_bytes_len + 30) / 31;
        i = 0;
        while i < jwt_chunks {
            signature.append(0);
            i += 1;
        }

        signature
    }

    #[test]
    fn test_base64url_decode_window_handles_two_char_tail() {
        let input = "QQ";
        let decoded = base64url_decode_window(@input, 0, 2, 0, 1);
        let span = decoded.span();
        assert!(span.len() == 1, "wrong decoded length");
        assert!(*span[0] == 65_u8, "wrong decoded byte");
    }

    #[test]
    fn test_base64url_decode_window_handles_three_char_tail() {
        let input = "SGk";
        let decoded = base64url_decode_window(@input, 0, 3, 1, 1);
        let span = decoded.span();
        assert!(span.len() == 1, "wrong decoded length");
        assert!(*span[0] == 105_u8, "wrong decoded byte");
    }

    #[test]
    fn test_base64url_decode_window_handles_cross_chunk_tail_window() {
        let input = "SGVsbG8";
        let decoded = base64url_decode_window(@input, 0, 7, 4, 1);
        let span = decoded.span();
        assert!(span.len() == 1, "wrong decoded length");
        assert!(*span[0] == 111_u8, "wrong decoded byte");
    }

    #[test]
    fn test_session_time_limits_pack_unpack_roundtrip() {
        let original = SessionTimeLimits {
            valid_after: 0x1122334455667788_u64,
            valid_until: 0x99aabbccddeeff00_u64,
            registered_at: 0x0123456789abcdef_u64,
        };
        let packed = SessionTimeLimitsStorePacking::pack(original);
        let unpacked = SessionTimeLimitsStorePacking::unpack(packed);

        assert!(unpacked.valid_after == original.valid_after, "valid_after mismatch");
        assert!(unpacked.valid_until == original.valid_until, "valid_until mismatch");
        assert!(unpacked.registered_at == original.registered_at, "registered_at mismatch");
    }

    #[test]
    fn test_session_usage_limits_pack_unpack_roundtrip_high_epoch() {
        let original = SessionUsageLimits {
            renewal_deadline: 0x0123456789abcdef_u64,
            max_calls_per_tx: 0x89abcdef_u32,
            revocation_epoch: 0x1122334455667788_u64,
        };
        let packed = SessionUsageLimitsStorePacking::pack(original);
        let unpacked = SessionUsageLimitsStorePacking::unpack(packed);

        assert!(
            unpacked.renewal_deadline == original.renewal_deadline, "renewal_deadline mismatch",
        );
        assert!(unpacked.max_calls_per_tx == original.max_calls_per_tx, "max_calls mismatch");
        assert!(
            unpacked.revocation_epoch == original.revocation_epoch, "revocation_epoch mismatch",
        );
    }

    #[test]
    fn test_parse_decimal_accepts_max_felt() {
        let value = "3618502788666131213697322783095070105623107215331596699973092056135872020480";
        let parsed = parse_decimal(byte_array_to_bytes(@value).span());
        assert!(
            parsed == 0x800000000000011000000000000000000000000000000000000000000000000,
            "unexpected decimal parse result",
        );
    }

    #[test]
    #[should_panic]
    fn test_parse_decimal_rejects_field_modulus() {
        let value = "3618502788666131213697322783095070105623107215331596699973092056135872020481";
        let _ = parse_decimal(byte_array_to_bytes(@value).span());
    }

    #[test]
    fn test_parse_hex_accepts_max_felt() {
        let value = "0x800000000000011000000000000000000000000000000000000000000000000";
        let parsed = parse_hex(byte_array_to_bytes(@value).span());
        assert!(
            parsed == 0x800000000000011000000000000000000000000000000000000000000000000,
            "unexpected hex parse result",
        );
    }

    #[test]
    #[should_panic]
    fn test_parse_hex_rejects_field_modulus() {
        let value = "0x800000000000011000000000000000000000000000000000000000000000001";
        let _ = parse_hex(byte_array_to_bytes(@value).span());
    }

    #[test]
    fn test_hash_utf8_bytes_uses_full_input_not_prefix() {
        let left = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaX";
        let right = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaY";
        let left_hash = hash_utf8_bytes(byte_array_to_bytes(@left).span());
        let right_hash = hash_utf8_bytes(byte_array_to_bytes(@right).span());
        assert!(left_hash != right_hash, "hash should not truncate to 31-byte prefix");
    }

    #[test]
    fn test_oauth_policy_start_skips_witnesses_before_jwt_chunks() {
        let signature = build_oauth_signature_prefix(62);
        let policy_start = oauth_policy_start(signature.span());

        assert!(policy_start == 651, "policy_start should skip witnesses and JWT chunks");
    }
}
