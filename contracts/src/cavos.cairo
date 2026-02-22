/// Cavos OAuth Account Contract
/// A Starknet account (SRC-6) that authenticates via JWT RSA signatures.
/// Users log in with Google/Apple, and the contract verifies the JWT's
/// RSA-256 signature against on-chain JWKS keys.

use starknet::{ContractAddress, account::Call};

#[starknet::interface]
pub trait ICavos<TContractState> {
    /// Get the address seed (identifies the owner).
    fn get_address_seed(self: @TContractState) -> felt252;
    /// Get the JWKS registry address.
    fn get_jwks_registry(self: @TContractState) -> ContractAddress;
    /// Renew session using an existing session in grace period.
    /// Self-custodial: within renewal window.
    fn renew_session(
        ref self: TContractState,
        old_session_key: felt252,
        old_signature_r: felt252,
        old_signature_s: felt252,
        new_session_key: felt252,
        new_nonce: felt252,
        new_valid_after: u64,
        new_valid_until: u64,
        new_renewal_deadline: u64,
        new_allowed_contracts_root: felt252,
        new_max_calls_per_tx: u32,
        new_spending_policies_len: u32,
        new_spending_policies: Span<felt252>,
    );
    /// Get session data for a session key.
    fn get_session(
        self: @TContractState, session_key: felt252,
    ) -> (felt252, u64, u64, u64, u64, felt252, u32);
    /// Get amount spent by a session for a given token.
    fn get_session_spending(
        self: @TContractState, session_key: felt252, token: ContractAddress,
    ) -> u256;
    /// Revoke a specific session key. Authentication handled by tx validation layer.
    fn revoke_session(ref self: TContractState, session_key: felt252);
    fn emergency_revoke(ref self: TContractState);

    fn get_version(self: @TContractState) -> u8;

    /// SRC6 standard signature validation
    fn is_valid_signature(
        self: @TContractState, hash: felt252, signature: Array<felt252>,
    ) -> felt252;
}

#[starknet::interface]
pub trait ISRC5<TContractState> {
    fn supports_interface(self: @TContractState, interface_id: felt252) -> bool;
}

/// SNIP-9: Outside Execution
#[derive(Copy, Drop, Serde)]
pub struct OutsideExecution {
    pub caller: ContractAddress,
    pub nonce: felt252,
    pub execute_after: u64,
    pub execute_before: u64,
    pub calls: Span<Call>,
}

#[starknet::interface]
pub trait IOutsideExecution<TContractState> {
    /// Execute from outside using SNIP-12 Rev 1 (SNIP-9 V2)
    fn execute_from_outside_v2(
        ref self: TContractState, outside_execution: OutsideExecution, signature: Span<felt252>,
    ) -> Array<Span<felt252>>;

    /// Check if a nonce is available for use
    fn is_valid_outside_execution_nonce(self: @TContractState, nonce: felt252) -> bool;
}

#[starknet::contract(account)]
pub mod Cavos {
    use core::ecdsa::check_ecdsa_signature;
    use core::hash::HashStateTrait;
    use core::num::traits::Zero;
    use core::poseidon::{PoseidonTrait, hades_permutation};
    use starknet::account::Call;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::syscalls::{call_contract_syscall, replace_class_syscall};
    use starknet::{
        ClassHash, ContractAddress, SyscallResultTrait, VALIDATED, get_block_number,
        get_block_timestamp, get_caller_address, get_contract_address, get_tx_info,
    };
    use crate::jwks_registry::{IJWKSRegistryDispatcher, IJWKSRegistryDispatcherTrait};
    use crate::jwt::base64::base64url_decode_window;
    use crate::jwt::jwt_parser::{parse_decimal, parse_hex, split_signed_data};
    use crate::rsa::bignum::{BigUint2048, biguint_from_limbs};

    /// Magic number to identify full OAuth JWT signatures (used during deployment/session
    /// registration).
    const OAUTH_SIG_MAGIC: felt252 = 'OAUTH_JWT_V1';

    const SESSION_SIG_MAGIC: felt252 = 'SESSION_V1';

    const EXPECTED_ISS_GOOGLE: felt252 = 0x68747470733a2f2f6163636f756e74732e676f6f676c652e636f6d;
    const EXPECTED_ISS_APPLE: felt252 = 0x68747470733a2f2f6170706c6569642e6170706c652e636f6d;
    const EXPECTED_ISS_FIREBASE: felt252 =
        0x68747470733a2f2f6361766f732e6170702f6669726562617365; // "https://cavos.app/firebase"

    const EXPECTED_AUD: felt252 = 0x0;

    /// SRC-5 Interface ID
    const ISRC5_ID: felt252 = 0x3f918d17e5ee77373b56385708f855659a07f75997f365cf87748628532a055;
    /// SRC-6 Account Interface ID
    const ISRC6_ID: felt252 = 0x2ceccef7f994940b3962a6c67e0ba4fcd37df7d131417c604f91e03caecc1cd;
    /// SNIP-9 Outside Execution V2 Interface ID (Rev 1)
    const SNIP9_OUTSIDE_EXECUTION_V2_ID: felt252 =
        0x1d1144bb2138366ff28d8e9ab57456b1d332ac42196230c3a602003c89872;

    /// Session data for registered session keys
    #[derive(Copy, Drop, Serde, starknet::Store)]
    pub struct SessionData {
        pub nonce: felt252, // JWT nonce that authorized this session
        pub valid_after: u64, // Timestamp - session not valid before this
        pub valid_until: u64, // Timestamp - session expires at this
        pub renewal_deadline: u64, // Timestamp - can renew until this
        pub registered_at: u64, // Block number when registered
        pub allowed_contracts_root: felt252, // Merkle root of allowed contracts
        pub max_calls_per_tx: u32, // Max calls per transaction
        pub revocation_epoch: u64 // Epoch when session was created
    }

    /// Spending policy for a session key
    #[derive(Copy, Drop, Serde, starknet::Store)]
    pub struct SpendingPolicy {
        pub token: ContractAddress,
        pub limit: u256,
    }

    #[storage]
    struct Storage {
        /// Poseidon(sub, salt) — identifies the owner
        address_seed: felt252,
        /// Address of the JWKS registry contract
        jwks_registry: ContractAddress,
        /// Outside execution nonces (SNIP-9)
        outside_nonces: Map<felt252, bool>,
        /// Registered sessions: session_key → SessionData
        sessions: Map<felt252, SessionData>,
        /// Global revocation epoch — incremented on emergency_revoke
        revocation_epoch: u64,
        /// Spending policies per session: (session_key, index) → SpendingPolicy
        session_spending_policies: Map<(felt252, u32), SpendingPolicy>,
        /// Number of spending policies per session
        session_spending_policy_count: Map<felt252, u32>,
        /// Amount spent per session per token (low 128 bits)
        session_amount_spent_low: Map<(felt252, ContractAddress), u128>,
        /// Amount spent per session per token (high 128 bits)
        session_amount_spent_high: Map<(felt252, ContractAddress), u128>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TransactionExecuted: TransactionExecuted,
        SessionRegistered: SessionRegistered,
        SessionRevoked: SessionRevoked,
        AllSessionsRevoked: AllSessionsRevoked,
        Upgraded: Upgraded,
    }

    #[derive(Drop, starknet::Event)]
    struct TransactionExecuted {
        caller: ContractAddress,
        num_calls: usize,
    }

    #[derive(Drop, starknet::Event)]
    struct SessionRegistered {
        session_key: felt252,
        nonce: felt252,
        valid_until: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct SessionRevoked {
        session_key: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct AllSessionsRevoked {
        new_epoch: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct Upgraded {
        new_class_hash: ClassHash,
    }

    #[constructor]
    fn constructor(ref self: ContractState, address_seed: felt252, jwks_registry: ContractAddress) {
        self.address_seed.write(address_seed);
        self.jwks_registry.write(jwks_registry);
    }

    // SRC-6 Account Interface
    #[abi(embed_v0)]
    impl AccountImpl of starknet::account::AccountContract<ContractState> {
        fn __validate__(ref self: ContractState, calls: Array<Call>) -> felt252 {
            let tx_info = get_tx_info().unbox();
            let signature = tx_info.signature;
            let sig_type = *signature[0];
            let calls_span = calls.span();

            if (sig_type == SESSION_SIG_MAGIC) && (calls_span.len() == 1) {
                let call = *calls_span[0];
                let is_renew = (call.to == get_contract_address())
                    && (call.selector == selector!("renew_session"));
                let is_outside_exec = (call.to == get_contract_address())
                    && (call.selector == selector!("execute_from_outside_v2"));

                if is_renew || is_outside_exec {
                    return self
                        .validate_session_signature_skip_expiry(
                            tx_info.transaction_hash, signature,
                        );
                }
            }

            self.validate_signature_and_maybe_register(calls_span)
        }

        fn __execute__(ref self: ContractState, calls: Array<Call>) -> Array<Span<felt252>> {
            // Only callable by the protocol (after __validate__)
            let caller = get_caller_address();
            assert!(caller.is_zero(), "Only protocol can call __execute__");

            // Enforce spending limits for session key transactions
            let tx_info = get_tx_info().unbox();
            let signature = tx_info.signature;
            let sig_type = *signature[0];

            if sig_type == SESSION_SIG_MAGIC || sig_type == OAUTH_SIG_MAGIC {
                let session_key = *signature[3];
                self.enforce_spending_limits(session_key, calls.span());
            }

            // Execute calls
            let mut results: Array<Span<felt252>> = array![];
            let calls_span = calls.span();
            let num_calls = calls_span.len();
            let mut i: usize = 0;
            while i != num_calls {
                let call = calls_span[i];
                let result = call_contract_syscall(*call.to, *call.selector, *call.calldata)
                    .unwrap_syscall();
                results.append(result);
                i += 1;
            }

            self.emit(TransactionExecuted { caller: get_contract_address(), num_calls: num_calls });

            results
        }

        fn __validate_declare__(self: @ContractState, class_hash: felt252) -> felt252 {
            // For declare, we can't mutate state, so session registration isn't allowed
            // This means declare must use an already-registered session
            self.validate_signature_readonly()
        }
    }

    #[abi(embed_v0)]
    fn __validate_deploy__(
        ref self: ContractState,
        class_hash: felt252,
        contract_address_salt: felt252,
        address_seed: felt252,
        jwks_registry: ContractAddress,
    ) -> felt252 {
        let empty_calls: Array<Call> = array![];
        self.validate_signature_and_maybe_register(empty_calls.span())
    }

    #[abi(embed_v0)]
    impl SignatureValidation of super::ICavos<ContractState> {
        fn get_address_seed(self: @ContractState) -> felt252 {
            self.address_seed.read()
        }

        fn get_jwks_registry(self: @ContractState) -> ContractAddress {
            self.jwks_registry.read()
        }

        fn is_valid_signature(
            self: @ContractState, hash: felt252, signature: Array<felt252>,
        ) -> felt252 {
            let sig_span = signature.span();
            if sig_span.is_empty() {
                return 0;
            }
            let sig_type = *sig_span[0];
            if sig_type == SESSION_SIG_MAGIC {
                self.validate_session_signature_readonly(hash, sig_span)
            } else {
                0
            }
        }

        /// Renew a session using an existing session that is in its grace period.
        /// The old session must be expired (now >= valid_until) but within
        /// the renewal window (now < renewal_deadline).
        fn renew_session(
            ref self: ContractState,
            old_session_key: felt252,
            old_signature_r: felt252,
            old_signature_s: felt252,
            new_session_key: felt252,
            new_nonce: felt252,
            new_valid_after: u64,
            new_valid_until: u64,
            new_renewal_deadline: u64,
            new_allowed_contracts_root: felt252,
            new_max_calls_per_tx: u32,
            new_spending_policies_len: u32,
            new_spending_policies: Span<felt252>,
        ) {
            let now = get_block_timestamp();

            // 1. Verify old session exists
            let old_session = self.sessions.read(old_session_key);
            assert!(old_session.nonce != 0, "Old session not registered");

            // 2. Verify old session is in grace period (expired but can still renew)
            assert!(now >= old_session.valid_until, "Old session not yet expired");
            assert!(now < old_session.renewal_deadline, "Renewal period expired");

            // 3. Verify signature: old key signs the new session params
            let message = PoseidonTrait::new()
                .update(new_session_key)
                .update(new_nonce)
                .update(new_valid_after.into())
                .update(new_valid_until.into())
                .update(new_renewal_deadline.into())
                .update(new_allowed_contracts_root)
                .update(new_max_calls_per_tx.into())
                .finalize();

            assert!(
                check_ecdsa_signature(message, old_session_key, old_signature_r, old_signature_s),
                "Invalid renewal signature",
            );

            // 4. Don't allow overwriting existing sessions
            let existing = self.sessions.read(new_session_key);
            assert!(existing.nonce == 0, "New session already registered");

            // 5. Validate new renewal_deadline >= new valid_until
            assert!(
                new_renewal_deadline >= new_valid_until, "Renewal deadline must be >= valid_until",
            );

            // 6. Register the new session
            let session_data = SessionData {
                nonce: new_nonce,
                valid_after: new_valid_after,
                valid_until: new_valid_until,
                renewal_deadline: new_renewal_deadline,
                registered_at: get_block_number(),
                allowed_contracts_root: new_allowed_contracts_root,
                max_calls_per_tx: new_max_calls_per_tx,
                revocation_epoch: self.revocation_epoch.read(),
            };
            self.sessions.write(new_session_key, session_data);

            // 7. Store spending policies
            self
                .store_spending_policies(
                    new_session_key, new_spending_policies_len, new_spending_policies,
                );

            // 8. Emit event
            self
                .emit(
                    SessionRegistered {
                        session_key: new_session_key,
                        nonce: new_nonce,
                        valid_until: new_valid_until,
                    },
                );
        }

        /// Get session data for a session key
        fn get_session(
            self: @ContractState, session_key: felt252,
        ) -> (felt252, u64, u64, u64, u64, felt252, u32) {
            let session = self.sessions.read(session_key);
            (
                session.nonce,
                session.valid_after,
                session.valid_until,
                session.renewal_deadline,
                session.registered_at,
                session.allowed_contracts_root,
                session.max_calls_per_tx,
            )
        }

        /// Get amount spent by a session for a given token
        fn get_session_spending(
            self: @ContractState, session_key: felt252, token: ContractAddress,
        ) -> u256 {
            let low: u128 = self.session_amount_spent_low.read((session_key, token));
            let high: u128 = self.session_amount_spent_high.read((session_key, token));
            u256 { low, high }
        }

        /// Revoke a specific session key. Requires JWT signature for identity verification.
        fn revoke_session(ref self: ContractState, session_key: felt252) {
            // Zero out the session
            let zero_session = SessionData {
                nonce: 0,
                valid_after: 0,
                valid_until: 0,
                renewal_deadline: 0,
                registered_at: 0,
                allowed_contracts_root: 0,
                max_calls_per_tx: 0,
                revocation_epoch: 0,
            };
            self.sessions.write(session_key, zero_session);

            self.emit(SessionRevoked { session_key });
        }

        /// Emergency revoke all session keys. Authentication handled by tx validation layer.
        fn emergency_revoke(ref self: ContractState) {
            // Increment revocation epoch — all sessions with older epoch become invalid
            let new_epoch = self.revocation_epoch.read() + 1;
            self.revocation_epoch.write(new_epoch);

            self.emit(AllSessionsRevoked { new_epoch });
        }

        fn get_version(self: @ContractState) -> u8 {
            2
        }
    }

    // SRC-5 Introspection
    #[abi(embed_v0)]
    impl SRC5Impl of super::ISRC5<ContractState> {
        fn supports_interface(self: @ContractState, interface_id: felt252) -> bool {
            interface_id == ISRC5_ID
                || interface_id == ISRC6_ID
                || interface_id == SNIP9_OUTSIDE_EXECUTION_V2_ID
        }
    }

    // Upgradability
    #[abi(embed_v0)]
    fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
        let caller = get_caller_address();
        assert!(caller.is_zero(), "Only self can upgrade");

        replace_class_syscall(new_class_hash).unwrap_syscall();
        self.emit(Upgraded { new_class_hash });
    }

    // SNIP-9 Outside Execution
    #[abi(embed_v0)]
    impl OutsideExecutionImpl of super::IOutsideExecution<ContractState> {
        fn execute_from_outside_v2(
            ref self: ContractState,
            outside_execution: super::OutsideExecution,
            signature: Span<felt252>,
        ) -> Array<Span<felt252>> {
            // 1. Validate caller
            if outside_execution.caller.into() != 'ANY_CALLER' {
                assert!(get_caller_address() == outside_execution.caller, "Invalid caller");
            }

            // 2. Validate timestamp
            let block_timestamp = get_block_timestamp();
            assert!(
                outside_execution.execute_after < block_timestamp
                    && block_timestamp < outside_execution.execute_before,
                "Invalid timestamp",
            );

            // 3. Validate and mark nonce as used
            let nonce = outside_execution.nonce;
            assert!(!self.outside_nonces.read(nonce), "Duplicated nonce");
            self.outside_nonces.write(nonce, true);

            // 4. Compute and verify the SNIP-12 message hash
            let message_hash = self.get_outside_execution_message_hash_v2(@outside_execution);

            // 5. Validate the signature against the message hash
            // Detect if it's a self-renewal call to allow execution even if session block-expiry
            // reached
            let mut skip_expiry = false;
            let calls_span = outside_execution.calls;
            if calls_span.len() == 1 {
                let call = *calls_span[0];
                if (call.to == get_contract_address())
                    && (call.selector == selector!("renew_session")) {
                    skip_expiry = true;
                }
            }

            if skip_expiry {
                self.validate_outside_execution_signature_skip_expiry(message_hash, signature);
            } else {
                // Check if this is a JWT signature — if so, validate AND register session
                let sig_type = *signature[0];
                if sig_type == OAUTH_SIG_MAGIC {
                    self.validate_outside_oauth_and_register_session(message_hash, signature);
                } else {
                    // SESSION_V1: validate signature + enforce policy (allowed contracts, max
                    // calls, spending)
                    self
                        .validate_outside_execution_signature_with_policy(
                            message_hash, signature, outside_execution.calls,
                        );
                }
            }

            // 6. Execute the calls
            let mut results: Array<Span<felt252>> = array![];
            let calls_span = outside_execution.calls;
            let num_calls = calls_span.len();
            let mut i: usize = 0;
            while i != num_calls {
                let call = calls_span[i];
                let result = call_contract_syscall(*call.to, *call.selector, *call.calldata)
                    .unwrap_syscall();
                results.append(result);
                i += 1;
            }

            self.emit(TransactionExecuted { caller: get_caller_address(), num_calls: num_calls });

            results
        }

        fn is_valid_outside_execution_nonce(self: @ContractState, nonce: felt252) -> bool {
            !self.outside_nonces.read(nonce)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Verify a claim (sub/nonce/kid) from the Base64-encoded JWT.
        /// It splits the JWT, decodes the relevant segment (header or payload),
        /// and verifies the claim bytes at the given offset.
        fn assert_decoded_claim_match(
            self: @ContractState,
            jwt_ba: @ByteArray,
            segment_start: usize,
            segment_len: usize,
            offset: usize,
            len: usize,
            expected: felt252,
        ) {
            // Decode the Base64 segment window on-chain
            let decoded: Array<u8> = base64url_decode_window(
                jwt_ba, segment_start, segment_len, offset, len,
            );
            let decoded_span = decoded.span();

            // Extract bytes and convert to felt252
            let mut extracted = 0_felt252;
            let mut i: usize = 0;
            while i < decoded_span.len() && i < 31 { // felt252 max 31 bytes
                let byte: u8 = *decoded_span[i];
                extracted = extracted * 256 + byte.into();
                i += 1;
            }
            assert!(extracted == expected, "Claim mismatch after decoding");
        }

        fn assert_claim_decimal_match(
            self: @ContractState,
            jwt_ba: @ByteArray,
            segment_start: usize,
            segment_len: usize,
            offset: usize,
            len: usize,
            expected: felt252,
        ) {
            // Decode segment window
            let decoded: Array<u8> = base64url_decode_window(
                jwt_ba, segment_start, segment_len, offset, len,
            );

            // Use jwt::jwt_parser::parse_decimal on the relevant segment
            let val: felt252 = parse_decimal(decoded.span());
            assert!(val == expected, "Claim mismatch (decimal)");
        }

        fn assert_claim_hex_match(
            self: @ContractState,
            jwt_ba: @ByteArray,
            segment_start: usize,
            segment_len: usize,
            offset: usize,
            len: usize,
            expected: felt252,
        ) {
            // Decode segment window
            let decoded: Array<u8> = base64url_decode_window(
                jwt_ba, segment_start, segment_len, offset, len,
            );

            // Use jwt::jwt_parser::parse_hex on the relevant segment
            let val: felt252 = parse_hex(decoded.span());
            assert!(val == expected, "Claim mismatch (hex)");
        }

        /// Internal helper that performs JWT verification and session registration.
        /// Called from validate_full_oauth_and_register_session.
        fn verify_jwt_and_register_session_internal(
            ref self: ContractState,
            session_key: felt252,
            expected_nonce: felt252,
            valid_after: u64,
            valid_until: u64,
            renewal_deadline: u64,
            allowed_contracts_root: felt252,
            max_calls_per_tx: u32,
            spending_policies_len: u32,
            spending_policies: Span<felt252>,
            signature: Span<felt252>,
        ) {
            // Verify magic number
            assert!(*signature[0] == OAUTH_SIG_MAGIC, "Invalid signature type");

            // Extract session key data (r, s not verified here - only pubkey matters)
            let _sig_r = *signature[1];
            let _sig_s = *signature[2];
            let sig_pubkey = *signature[3];
            let sig_valid_until: felt252 = *signature[4];
            let randomness = *signature[5];

            // Extract JWT claims
            let jwt_sub = *signature[6];
            let jwt_nonce = *signature[7];
            let jwt_exp_felt = *signature[8];
            let jwt_kid = *signature[9];
            let jwt_iss = *signature[10];
            let _jwt_aud = *signature[11];
            let salt = *signature[12];
            let wallet_name = *signature[13];

            // Extract claim offsets for verification
            let _sub_offset: usize = (*signature[14]).try_into().unwrap();
            let _sub_len: usize = (*signature[15]).try_into().unwrap();
            let _nonce_offset: usize = (*signature[16]).try_into().unwrap();
            let _nonce_len: usize = (*signature[17]).try_into().unwrap();
            let _kid_offset: usize = (*signature[18]).try_into().unwrap();
            let _kid_len: usize = (*signature[19]).try_into().unwrap();

            // RSA signature starts at index 20
            let rsa_sig_start: usize = 20;
            let rsa_sig_len: usize = (*signature[rsa_sig_start]).try_into().unwrap();
            assert!(rsa_sig_len == 16, "RSA signature must be 16 limbs");

            let mut rsa_limbs: Array<u128> = array![];
            let mut li: usize = 0;
            while li != 16 {
                let limb: u128 = (*signature[rsa_sig_start + 1 + li]).try_into().unwrap();
                rsa_limbs.append(limb);
                li += 1;
            }
            let rsa_sig = biguint_from_limbs(rsa_limbs.span());

            // Extract JWT signed data (header.payload bytes)
            let jwt_data_start: usize = 36;

            // The value at jwt_data_start is the TOTAL BYTE LENGTH of the JWT data
            let jwt_bytes_len: usize = (*signature[jwt_data_start]).try_into().unwrap();

            let mut jwt_bytes = "";
            let mut current_byte = 0;
            let mut chunk_idx = 0;

            while current_byte != jwt_bytes_len {
                let packed_chunk = *signature[jwt_data_start + 1 + chunk_idx];
                let remaining = jwt_bytes_len - current_byte;
                let chunk_len = if remaining >= 31 {
                    31
                } else {
                    remaining
                };

                jwt_bytes.append_word(packed_chunk, chunk_len);

                current_byte += chunk_len;
                chunk_idx += 1;
            }

            // 1. Verify session key matches what was provided
            assert!(sig_pubkey == session_key, "Session key mismatch");

            // 2. Verify nonce = Poseidon(session_key, valid_until, randomness)
            let computed_nonce = PoseidonTrait::new()
                .update(sig_pubkey)
                .update(sig_valid_until)
                .update(randomness)
                .finalize();
            assert!(jwt_nonce == computed_nonce, "Nonce mismatch");
            assert!(jwt_nonce == expected_nonce, "Nonce does not match expected");

            // 3. Verify valid_until matches
            let sig_valid_until_u64: u64 = sig_valid_until
                .try_into()
                .expect('valid_until overflow');
            assert!(sig_valid_until_u64 == valid_until, "valid_until mismatch");

            // 4. Verify session not expired (timestamp-based)
            let now = get_block_timestamp();
            assert!(now < valid_until, "Session expired");

            // 5. Verify JWT not expired (timestamp-based)
            let jwt_exp: u64 = jwt_exp_felt.try_into().expect('jwt_exp overflow');
            assert!(now < jwt_exp, "JWT expired");

            // 6. Verify address_seed = Poseidon(sub, salt, wallet_name?)
            let computed_seed = if wallet_name != 0 {
                PoseidonTrait::new().update(jwt_sub).update(salt).update(wallet_name).finalize()
            } else {
                let (h, _, _) = hades_permutation(jwt_sub, salt, 2);
                h
            };
            assert!(computed_seed == self.address_seed.read(), "Address seed mismatch");

            // 7. Verify JWKS key is valid
            let registry = IJWKSRegistryDispatcher { contract_address: self.jwks_registry.read() };
            assert!(registry.is_key_valid(jwt_kid), "JWKS key invalid or expired");

            // 8. Verify RSA signature with Montgomery Reduction
            let jwks_key = registry.get_key(jwt_kid);
            let modulus = BigUint2048 {
                limbs: [
                    jwks_key.n0, jwks_key.n1, jwks_key.n2, jwks_key.n3, jwks_key.n4, jwks_key.n5,
                    jwks_key.n6, jwks_key.n7, jwks_key.n8, jwks_key.n9, jwks_key.n10, jwks_key.n11,
                    jwks_key.n12, jwks_key.n13, jwks_key.n14, jwks_key.n15,
                ],
            };
            let n_prime = BigUint2048 {
                limbs: [
                    jwks_key.n_prime0, jwks_key.n_prime1, jwks_key.n_prime2, jwks_key.n_prime3,
                    jwks_key.n_prime4, jwks_key.n_prime5, jwks_key.n_prime6, jwks_key.n_prime7,
                    jwks_key.n_prime8, jwks_key.n_prime9, jwks_key.n_prime10, jwks_key.n_prime11,
                    jwks_key.n_prime12, jwks_key.n_prime13, jwks_key.n_prime14, jwks_key.n_prime15,
                ],
            };
            let r_sq = BigUint2048 {
                limbs: [
                    jwks_key.r_sq0, jwks_key.r_sq1, jwks_key.r_sq2, jwks_key.r_sq3, jwks_key.r_sq4,
                    jwks_key.r_sq5, jwks_key.r_sq6, jwks_key.r_sq7, jwks_key.r_sq8, jwks_key.r_sq9,
                    jwks_key.r_sq10, jwks_key.r_sq11, jwks_key.r_sq12, jwks_key.r_sq13,
                    jwks_key.r_sq14, jwks_key.r_sq15,
                ],
            };
            assert!(
                crate::rsa::rsa_verify::verify_rsa_sha256_mont(
                    @jwt_bytes, @rsa_sig, @modulus, @n_prime, @r_sq,
                ),
                "RSA verification failed (Montgomery)",
            );

            // Verify issuer is Google, Apple, or Firebase
            assert!(
                jwt_iss == EXPECTED_ISS_GOOGLE
                    || jwt_iss == EXPECTED_ISS_APPLE
                    || jwt_iss == EXPECTED_ISS_FIREBASE,
                "Invalid JWT issuer",
            );

            // SECURITY: Verify claims in JWT bytes match the provided parameters
            let sub_offset: usize = (*signature[13]).try_into().unwrap();
            let sub_len: usize = (*signature[14]).try_into().unwrap();
            let nonce_offset: usize = (*signature[15]).try_into().unwrap();
            let nonce_len: usize = (*signature[16]).try_into().unwrap();
            let kid_offset: usize = (*signature[17]).try_into().unwrap();
            let kid_len: usize = (*signature[18]).try_into().unwrap();

            let (header_end, payload_start, payload_end) = split_signed_data(@jwt_bytes);
            let payload_len = payload_end - payload_start;

            if jwt_iss == EXPECTED_ISS_GOOGLE {
                self
                    .assert_claim_decimal_match(
                        @jwt_bytes, payload_start, payload_len, sub_offset, sub_len, jwt_sub,
                    );
            } else {
                self
                    .assert_decoded_claim_match(
                        @jwt_bytes, payload_start, payload_len, sub_offset, sub_len, jwt_sub,
                    );
            }
            self
                .assert_claim_hex_match(
                    @jwt_bytes, payload_start, payload_len, nonce_offset, nonce_len, jwt_nonce,
                );
            self
                .assert_decoded_claim_match(
                    @jwt_bytes, 0, header_end, kid_offset, kid_len, jwt_kid,
                );

            // Register the session
            let session_data = SessionData {
                nonce: jwt_nonce,
                valid_after: valid_after,
                valid_until: valid_until,
                renewal_deadline: renewal_deadline,
                registered_at: get_block_number(),
                allowed_contracts_root: allowed_contracts_root,
                max_calls_per_tx: max_calls_per_tx,
                revocation_epoch: self.revocation_epoch.read(),
            };
            self.sessions.write(session_key, session_data);

            // Store spending policies
            self.store_spending_policies(session_key, spending_policies_len, spending_policies);

            // Emit event
            self
                .emit(
                    SessionRegistered {
                        session_key: session_key, nonce: jwt_nonce, valid_until: valid_until,
                    },
                );
        }

        /// Validates signature and registers session if using full OAuth signature.
        /// Used by __validate__, __validate_deploy__ (can mutate state).
        fn validate_signature_and_maybe_register(
            ref self: ContractState, calls: Span<Call>,
        ) -> felt252 {
            let tx_info = get_tx_info().unbox();
            let tx_hash = tx_info.transaction_hash;
            let signature = tx_info.signature;

            let sig_type = *signature[0];

            if sig_type == SESSION_SIG_MAGIC {
                self.validate_session_signature(tx_hash, signature, calls)
            } else if sig_type == OAUTH_SIG_MAGIC {
                self.validate_full_oauth_and_register_session(tx_hash, signature)
            } else {
                panic!("Invalid signature type");
            }
        }

        /// Read-only validation for __validate_declare__ (cannot register new sessions).
        /// Only supports SESSION_SIG_MAGIC.
        fn validate_signature_readonly(self: @ContractState) -> felt252 {
            let tx_info = get_tx_info().unbox();
            let tx_hash = tx_info.transaction_hash;
            let signature = tx_info.signature;

            let sig_type = *signature[0];
            assert!(sig_type == SESSION_SIG_MAGIC, "Only session signatures allowed for declare");

            self.validate_session_signature_readonly(tx_hash, signature)
        }

        /// Validates a lightweight session signature (SESSION_V1) - read-only version.
        fn validate_session_signature_readonly(
            self: @ContractState, tx_hash: felt252, signature: Span<felt252>,
        ) -> felt252 {
            assert!(signature.len() >= 4, "Invalid session signature length");

            let sig_r = *signature[1];
            let sig_s = *signature[2];
            let session_key = *signature[3];

            assert!(
                check_ecdsa_signature(tx_hash, session_key, sig_r, sig_s),
                "Invalid session key signature",
            );

            let session = self.sessions.read(session_key);
            assert!(session.nonce != 0, "Session not registered");

            // Check revocation epoch
            assert!(session.revocation_epoch == self.revocation_epoch.read(), "Session revoked");

            // Timestamp-based expiry
            let now = get_block_timestamp();
            assert!(now >= session.valid_after, "Session not yet active");
            assert!(now < session.valid_until, "Session expired");

            VALIDATED
        }

        /// Computes the SNIP-12 Rev 1 message hash for outside execution (SNIP-9 V2)
        fn get_outside_execution_message_hash_v2(
            self: @ContractState, outside_execution: @super::OutsideExecution,
        ) -> felt252 {
            // SNIP-12 Rev 1 type hashes
            const OUTSIDE_EXECUTION_TYPE_HASH: felt252 =
                0x312b56c05a7965066ddbda31c016d8d05afc305071c0ca3cdc2192c3c2f1f0f;
            const CALL_TYPE_HASH: felt252 =
                0x3635c7f2a7ba93844c0d064e18e487f35ab90f7c39d00f186a781fc3f0c2ca9;

            // Hash each call
            let calls = *outside_execution.calls;
            let mut hashed_calls: Array<felt252> = array![];
            let mut i: usize = 0;
            while i != calls.len() {
                let call = calls[i];
                // Hash call: poseidon_hash_span([CALL_TYPE_HASH, to, selector,
                // poseidon_hash_span(calldata)])
                let calldata_hash = core::poseidon::poseidon_hash_span(*call.calldata);
                let call_hash = core::poseidon::poseidon_hash_span(
                    array![CALL_TYPE_HASH, (*call.to).into(), *call.selector, calldata_hash].span(),
                );
                hashed_calls.append(call_hash);
                i += 1;
            }
            let calls_hash = core::poseidon::poseidon_hash_span(hashed_calls.span());

            // Hash OutsideExecution struct
            let struct_hash = core::poseidon::poseidon_hash_span(
                array![
                    OUTSIDE_EXECUTION_TYPE_HASH, (*outside_execution.caller).into(),
                    *outside_execution.nonce, (*outside_execution.execute_after).into(),
                    (*outside_execution.execute_before).into(), calls_hash,
                ]
                    .span(),
            );

            // Domain separator for SNIP-12 Rev 1
            // StarknetDomain { name: 'Account.execute_from_outside', version: 2, chainId, revision:
            // 1 }
            const STARKNET_DOMAIN_TYPE_HASH: felt252 =
                0x1ff2f602e42168014d405a94f75e8a93d640751d71d16311266e140d8b0a210;
            let chain_id = get_tx_info().unbox().chain_id;
            let domain_hash = core::poseidon::poseidon_hash_span(
                array![
                    STARKNET_DOMAIN_TYPE_HASH, 'Account.execute_from_outside', 2, // version
                    chain_id, 1 // revision
                ]
                    .span(),
            );

            // Final message hash
            core::poseidon::poseidon_hash_span(
                array!['StarkNet Message', domain_hash, get_contract_address().into(), struct_hash]
                    .span(),
            )
        }

        /// Validates signature for outside execution.
        /// Supports both SESSION_V1 (lightweight) and OAUTH_JWT_V1 (full verification).
        /// For paymaster transactions, SESSION_V1 should be used to stay within step limits.
        fn validate_outside_execution_signature(
            self: @ContractState, message_hash: felt252, signature: Span<felt252>,
        ) {
            let sig_type = *signature[0];

            if sig_type == SESSION_SIG_MAGIC {
                // Lightweight session validation - suitable for paymaster
                self.validate_outside_session_signature(message_hash, signature);
            } else if sig_type == OAUTH_SIG_MAGIC {
                // Full OAuth JWT validation - expensive, not recommended for paymaster
                self.validate_outside_full_oauth_signature(message_hash, signature);
            } else {
                panic!("Invalid signature type");
            }
        }

        /// Validates signature for outside execution WITH full policy enforcement.
        /// For SESSION_V1: checks allowed contracts, max_calls_per_tx, and spending limits.
        /// Mutable because enforce_spending_limits writes to storage.
        fn validate_outside_execution_signature_with_policy(
            ref self: ContractState,
            message_hash: felt252,
            signature: Span<felt252>,
            calls: Span<Call>,
        ) {
            let sig_type = *signature[0];

            if sig_type == SESSION_SIG_MAGIC {
                assert!(signature.len() >= 4, "Invalid session signature length");

                let sig_r = *signature[1];
                let sig_s = *signature[2];
                let session_key = *signature[3];

                // 1. Verify ECDSA
                assert!(
                    check_ecdsa_signature(message_hash, session_key, sig_r, sig_s),
                    "Invalid session key signature",
                );

                // 2. Check session exists
                let session = self.sessions.read(session_key);
                assert!(session.nonce != 0, "Session not registered");

                // 3. Check revocation epoch
                assert!(
                    session.revocation_epoch == self.revocation_epoch.read(), "Session revoked",
                );

                // 4. Check time validity
                let now = get_block_timestamp();
                assert!(now >= session.valid_after, "Session not yet active");
                assert!(now < session.valid_until, "Session expired");

                // 5. Check max_calls_per_tx
                assert!(
                    calls.len() <= session.max_calls_per_tx.into(), "Too many calls in transaction",
                );

                // 6. Verify allowed contracts via Merkle proofs
                self.verify_allowed_contracts(session.allowed_contracts_root, calls, signature);

                // 7. Enforce spending limits
                self.enforce_spending_limits(session_key, calls);
            } else if sig_type == OAUTH_SIG_MAGIC {
                self.validate_outside_full_oauth_signature(message_hash, signature);
            } else {
                panic!("Invalid signature type");
            }
        }

        /// Validates signature for outside execution, skipping block expiry for session keys.
        fn validate_outside_execution_signature_skip_expiry(
            self: @ContractState, message_hash: felt252, signature: Span<felt252>,
        ) {
            let sig_type = *signature[0];

            if sig_type == SESSION_SIG_MAGIC {
                // Lightweight session validation - suitable for paymaster
                self.validate_outside_session_signature_skip_expiry(message_hash, signature);
            } else {
                // OAUTH_SIG_MAGIC doesn't need skip_expiry (it's the authority)
                self.validate_outside_execution_signature(message_hash, signature);
            }
        }

        /// Validates lightweight session signature for outside execution
        fn validate_outside_session_signature(
            self: @ContractState, message_hash: felt252, signature: Span<felt252>,
        ) {
            assert!(signature.len() >= 4, "Invalid session signature length");

            let sig_r = *signature[1];
            let sig_s = *signature[2];
            let session_key = *signature[3];

            assert!(
                check_ecdsa_signature(message_hash, session_key, sig_r, sig_s),
                "Invalid session key signature",
            );

            let session = self.sessions.read(session_key);
            assert!(session.nonce != 0, "Session not registered");
            assert!(session.revocation_epoch == self.revocation_epoch.read(), "Session revoked");

            let now = get_block_timestamp();
            assert!(now >= session.valid_after, "Session not yet active");
            assert!(now < session.valid_until, "Session expired");
        }

        /// Validates lightweight session signature for outside execution, skipping expiry.
        fn validate_outside_session_signature_skip_expiry(
            self: @ContractState, message_hash: felt252, signature: Span<felt252>,
        ) {
            assert!(signature.len() >= 4, "Invalid session signature length");

            let sig_r = *signature[1];
            let sig_s = *signature[2];
            let session_key = *signature[3];

            assert!(
                check_ecdsa_signature(message_hash, session_key, sig_r, sig_s),
                "Invalid session key signature",
            );

            let session = self.sessions.read(session_key);
            assert!(session.nonce != 0, "Session not registered");
            assert!(session.revocation_epoch == self.revocation_epoch.read(), "Session revoked");

            let now = get_block_timestamp();
            assert!(now < session.renewal_deadline, "Renewal period expired");
        }

        /// Validates full OAuth JWT signature for outside execution
        fn validate_outside_full_oauth_signature(
            self: @ContractState, message_hash: felt252, signature: Span<felt252>,
        ) {
            assert!(*signature[0] == OAUTH_SIG_MAGIC, "Invalid signature type");

            let sig_r = *signature[1];
            let sig_s = *signature[2];
            let session_key = *signature[3];
            let valid_until_felt: felt252 = *signature[4];
            let randomness = *signature[5];

            let jwt_sub = *signature[6];
            let jwt_nonce = *signature[7];
            let jwt_exp_felt = *signature[8];
            let jwt_kid = *signature[9];
            let jwt_iss = *signature[10];
            let _jwt_aud = *signature[11];
            let salt = *signature[12];
            let wallet_name = *signature[13];

            // 1. Verify session key signed the message hash
            assert!(
                check_ecdsa_signature(message_hash, session_key, sig_r, sig_s),
                "Invalid session key signature",
            );

            // 2. Verify nonce = Poseidon(session_key, valid_until, randomness)
            let expected_nonce = PoseidonTrait::new()
                .update(session_key)
                .update(valid_until_felt)
                .update(randomness)
                .finalize();
            assert!(jwt_nonce == expected_nonce, "Nonce mismatch");

            // 3. Verify session not expired (timestamp-based)
            let valid_until: u64 = valid_until_felt.try_into().expect('valid_until overflow');
            let now = get_block_timestamp();
            assert!(now < valid_until, "Session expired");

            // 4. Verify JWT not expired
            let jwt_exp: u64 = jwt_exp_felt.try_into().expect('jwt_exp overflow');
            assert!(now < jwt_exp, "JWT expired");

            // 5. Verify address_seed = Poseidon(sub, salt, wallet_name?)
            let computed_seed = if wallet_name != 0 {
                PoseidonTrait::new().update(jwt_sub).update(salt).update(wallet_name).finalize()
            } else {
                let (h, _, _) = hades_permutation(jwt_sub, salt, 2);
                h
            };
            assert!(computed_seed == self.address_seed.read(), "Address seed mismatch");

            // 6. Verify JWKS key is valid
            let registry = IJWKSRegistryDispatcher { contract_address: self.jwks_registry.read() };
            assert!(registry.is_key_valid(jwt_kid), "JWKS key invalid or expired");

            // 7. Extract and verify RSA signature
            // wallet_name at [13], claim offsets [14-19], RSA sig starts at [20]
            let rsa_sig_start: usize = 20;
            let rsa_sig_len: usize = (*signature[rsa_sig_start]).try_into().unwrap();
            assert!(rsa_sig_len == 16, "RSA signature must be 16 limbs");

            let mut rsa_limbs: Array<u128> = array![];
            let mut li: usize = 0;
            while li != 16 {
                let limb: u128 = (*signature[rsa_sig_start + 1 + li]).try_into().unwrap();
                rsa_limbs.append(limb);
                li += 1;
            }
            let rsa_sig = biguint_from_limbs(rsa_limbs.span());

            let jwks_key = registry.get_key(jwt_kid);
            let modulus = BigUint2048 {
                limbs: [
                    jwks_key.n0, jwks_key.n1, jwks_key.n2, jwks_key.n3, jwks_key.n4, jwks_key.n5,
                    jwks_key.n6, jwks_key.n7, jwks_key.n8, jwks_key.n9, jwks_key.n10, jwks_key.n11,
                    jwks_key.n12, jwks_key.n13, jwks_key.n14, jwks_key.n15,
                ],
            };
            let n_prime = BigUint2048 {
                limbs: [
                    jwks_key.n_prime0, jwks_key.n_prime1, jwks_key.n_prime2, jwks_key.n_prime3,
                    jwks_key.n_prime4, jwks_key.n_prime5, jwks_key.n_prime6, jwks_key.n_prime7,
                    jwks_key.n_prime8, jwks_key.n_prime9, jwks_key.n_prime10, jwks_key.n_prime11,
                    jwks_key.n_prime12, jwks_key.n_prime13, jwks_key.n_prime14, jwks_key.n_prime15,
                ],
            };
            let r_sq = BigUint2048 {
                limbs: [
                    jwks_key.r_sq0, jwks_key.r_sq1, jwks_key.r_sq2, jwks_key.r_sq3, jwks_key.r_sq4,
                    jwks_key.r_sq5, jwks_key.r_sq6, jwks_key.r_sq7, jwks_key.r_sq8, jwks_key.r_sq9,
                    jwks_key.r_sq10, jwks_key.r_sq11, jwks_key.r_sq12, jwks_key.r_sq13,
                    jwks_key.r_sq14, jwks_key.r_sq15,
                ],
            };

            let jwt_data_start: usize = 37;
            let jwt_bytes_len: usize = (*signature[jwt_data_start]).try_into().unwrap();

            let mut jwt_bytes = "";
            let mut current_byte = 0;
            let mut chunk_idx = 0;

            while current_byte != jwt_bytes_len {
                let packed_chunk = *signature[jwt_data_start + 1 + chunk_idx];
                let remaining = jwt_bytes_len - current_byte;
                let chunk_len = if remaining >= 31 {
                    31
                } else {
                    remaining
                };
                jwt_bytes.append_word(packed_chunk, chunk_len);
                current_byte += chunk_len;
                chunk_idx += 1;
            }

            assert!(
                crate::rsa::rsa_verify::verify_rsa_sha256_mont(
                    @jwt_bytes, @rsa_sig, @modulus, @n_prime, @r_sq,
                ),
                "RSA verification failed (Montgomery)",
            );

            // Verify claims - indices account for wallet_name at [13]
            let sub_offset: usize = (*signature[14]).try_into().unwrap();
            let sub_len: usize = (*signature[15]).try_into().unwrap();
            let nonce_offset: usize = (*signature[16]).try_into().unwrap();
            let nonce_len: usize = (*signature[17]).try_into().unwrap();
            let kid_offset: usize = (*signature[18]).try_into().unwrap();
            let kid_len: usize = (*signature[19]).try_into().unwrap();

            let (header_end, payload_start, payload_end) = split_signed_data(@jwt_bytes);
            let payload_len = payload_end - payload_start;

            if jwt_iss == EXPECTED_ISS_GOOGLE {
                self
                    .assert_claim_decimal_match(
                        @jwt_bytes, payload_start, payload_len, sub_offset, sub_len, jwt_sub,
                    );
            } else {
                self
                    .assert_decoded_claim_match(
                        @jwt_bytes, payload_start, payload_len, sub_offset, sub_len, jwt_sub,
                    );
            }
            self
                .assert_claim_hex_match(
                    @jwt_bytes, payload_start, payload_len, nonce_offset, nonce_len, jwt_nonce,
                );
            self
                .assert_decoded_claim_match(
                    @jwt_bytes, 0, header_end, kid_offset, kid_len, jwt_kid,
                );

            assert!(
                jwt_iss == EXPECTED_ISS_GOOGLE
                    || jwt_iss == EXPECTED_ISS_APPLE
                    || jwt_iss == EXPECTED_ISS_FIREBASE,
                "Invalid JWT issuer",
            );
        }

        /// Validates full OAuth JWT signature for outside execution AND registers the session.
        /// This is the mutable version used by execute_from_outside_v2 when receiving a JWT sig.
        /// It validates the JWT (same as validate_outside_full_oauth_signature) and then
        /// extracts policy fields and registers the session on-chain.
        fn validate_outside_oauth_and_register_session(
            ref self: ContractState, message_hash: felt252, signature: Span<felt252>,
        ) {
            // First, do the full OAuth validation (verify ECDSA, nonce, JWT, RSA, claims)
            self.validate_outside_full_oauth_signature(message_hash, signature);

            // Now extract session params and register the session
            let session_key = *signature[3];
            let valid_until_felt = *signature[4];
            let valid_until: u64 = valid_until_felt.try_into().expect('valid_until overflow');
            let jwt_nonce = *signature[7];

            // Compute policy fields position (after JWT bytes)
            // wallet_name at [13] shifts jwt_data_start from 36 to 37
            let jwt_data_start: usize = 37;
            let jwt_bytes_len: usize = (*signature[jwt_data_start]).try_into().unwrap();
            let jwt_chunks = (jwt_bytes_len + 30) / 31;
            let policy_start: usize = jwt_data_start + 1 + jwt_chunks;

            // Extract policy fields
            let valid_after: u64 = (*signature[policy_start])
                .try_into()
                .expect('valid_after overflow');
            let renewal_deadline: u64 = valid_until + 172800; // 48h default grace period
            let allowed_contracts_root: felt252 = *signature[policy_start + 1];
            let max_calls_per_tx: u32 = (*signature[policy_start + 2])
                .try_into()
                .expect('max_calls overflow');
            let spending_policies_len: u32 = (*signature[policy_start + 3])
                .try_into()
                .expect('policies_len overflow');

            // Extract spending policies
            let sp_start = policy_start + 4;
            let sp_felt_count: usize = spending_policies_len * 3;
            let mut spending_data: Array<felt252> = array![];
            let mut si: usize = 0;
            while si != sp_felt_count {
                spending_data.append(*signature[sp_start + si]);
                si += 1;
            }

            // Don't overwrite if session already registered
            let existing = self.sessions.read(session_key);
            if existing.nonce != 0 {
                return;
            }

            // Register the session
            let session_data = SessionData {
                nonce: jwt_nonce,
                valid_after: valid_after,
                valid_until: valid_until,
                renewal_deadline: renewal_deadline,
                registered_at: get_block_number(),
                allowed_contracts_root: allowed_contracts_root,
                max_calls_per_tx: max_calls_per_tx,
                revocation_epoch: self.revocation_epoch.read(),
            };
            self.sessions.write(session_key, session_data);

            // Store spending policies
            self.store_spending_policies(session_key, spending_policies_len, spending_data.span());

            // Emit event
            self
                .emit(
                    SessionRegistered {
                        session_key: session_key, nonce: jwt_nonce, valid_until: valid_until,
                    },
                );
        }

        /// Validates a lightweight session signature (SESSION_V1) - mutable version.
        /// Checks session key signature, session expiry, epoch, max_calls, and allowed contracts.
        fn validate_session_signature(
            ref self: ContractState, tx_hash: felt252, signature: Span<felt252>, calls: Span<Call>,
        ) -> felt252 {
            assert!(signature.len() >= 4, "Invalid session signature length");

            let sig_r = *signature[1];
            let sig_s = *signature[2];
            let session_key = *signature[3];

            // 1. Verify session key signed the transaction hash
            assert!(
                check_ecdsa_signature(tx_hash, session_key, sig_r, sig_s),
                "Invalid session key signature",
            );

            // 2. Check if session exists and is valid
            let session = self.sessions.read(session_key);
            assert!(session.nonce != 0, "Session not registered");

            // 3. Check revocation epoch
            assert!(session.revocation_epoch == self.revocation_epoch.read(), "Session revoked");

            // 4. Verify session time validity (timestamp-based)
            let now = get_block_timestamp();
            assert!(now >= session.valid_after, "Session not yet active");
            assert!(now < session.valid_until, "Session expired");

            // 5. Check max_calls_per_tx
            assert!(
                calls.len() <= session.max_calls_per_tx.into(), "Too many calls in transaction",
            );

            // 6. Verify allowed contracts via Merkle proofs (appended after sig[3])
            self.verify_allowed_contracts(session.allowed_contracts_root, calls, signature);

            VALIDATED
        }

        /// Validates a lightweight session signature (SESSION_V1) for renewal.
        /// Skips the valid_until check but ensures we are within renewal_deadline.
        fn validate_session_signature_skip_expiry(
            self: @ContractState, tx_hash: felt252, signature: Span<felt252>,
        ) -> felt252 {
            assert!(signature.len() >= 4, "Invalid session signature length");

            let sig_r = *signature[1];
            let sig_s = *signature[2];
            let session_key = *signature[3];

            assert!(
                check_ecdsa_signature(tx_hash, session_key, sig_r, sig_s),
                "Invalid session key signature",
            );

            let session = self.sessions.read(session_key);
            assert!(session.nonce != 0, "Session not registered");
            assert!(session.revocation_epoch == self.revocation_epoch.read(), "Session revoked");

            let now = get_block_timestamp();
            assert!(now < session.renewal_deadline, "Renewal period expired");

            VALIDATED
        }

        /// Validates a full OAuth JWT signature (OAUTH_JWT_V1).
        /// Performs complete RSA verification and registers the session.
        /// Expensive - only used during deployment or explicit session registration.
        ///
        /// Signature format:
        /// [0]  = OAUTH_JWT_V1 magic
        /// [1-3] = session key (r, s, pubkey)
        /// [4-5] = valid_until, randomness
        /// [6-12] = jwt_sub, jwt_nonce, jwt_exp, jwt_kid, jwt_iss, jwt_aud, salt
        /// [13-18] = claim offsets (sub_offset, sub_len, nonce_offset, nonce_len, kid_offset,
        /// kid_len)
        /// [19] = RSA sig length (16)
        /// [20-35] = RSA signature (16 u128 limbs)
        /// [36] = n_prime length (16)
        /// [37-52] = n_prime (16 u128 limbs)
        /// [53] = R^2 length (16)
        /// [54-69] = R^2 (16 u128 limbs)
        /// [70] = JWT data length
        /// [71+] = JWT bytes
        /// After JWT bytes:
        /// [jwt_end] = valid_after
        /// [jwt_end+1] = allowed_contracts_root
        /// [jwt_end+2] = max_calls_per_tx
        /// [jwt_end+3] = spending_policies_count
        /// [jwt_end+4..] = spending_policies: [token, limit_low, limit_high, ...]
        fn validate_full_oauth_and_register_session(
            ref self: ContractState, tx_hash: felt252, signature: Span<felt252>,
        ) -> felt252 {
            assert!(*signature[0] == OAUTH_SIG_MAGIC, "Invalid signature type");

            let session_key = *signature[3];
            let sig_r = *signature[1];
            let sig_s = *signature[2];

            // 1. Verify session key signed the transaction hash
            assert!(
                check_ecdsa_signature(tx_hash, session_key, sig_r, sig_s),
                "Invalid session key signature",
            );

            // 2. Extract session params
            let valid_until_felt = *signature[4];
            let valid_until: u64 = valid_until_felt.try_into().expect('valid_until overflow');
            let jwt_nonce = *signature[7];

            // 3. Compute policy fields position (after JWT bytes)
            let jwt_data_idx: usize = 71; // Shifted due to wallet_name at index 13
            let jwt_bytes_len: usize = (*signature[jwt_data_idx]).try_into().unwrap();
            let jwt_chunks = (jwt_bytes_len + 30) / 31; // ceil(len/31)
            let policy_start: usize = jwt_data_idx + 1 + jwt_chunks;

            // 4. Extract policy fields
            let valid_after: u64 = (*signature[policy_start])
                .try_into()
                .expect('valid_after overflow');
            let renewal_deadline: u64 = valid_until + 172800; // 48h default grace period
            let allowed_contracts_root: felt252 = *signature[policy_start + 1];
            let max_calls_per_tx: u32 = (*signature[policy_start + 2])
                .try_into()
                .expect('max_calls overflow');
            let spending_policies_len: u32 = (*signature[policy_start + 3])
                .try_into()
                .expect('policies_len overflow');

            // Extract spending policies as span
            let sp_start = policy_start + 4;
            let sp_felt_count: usize = spending_policies_len
                * 3; // token + limit_low + limit_high per policy
            let mut spending_data: Array<felt252> = array![];
            let mut si: usize = 0;
            while si != sp_felt_count {
                spending_data.append(*signature[sp_start + si]);
                si += 1;
            }

            // 5. Perform full JWT verification and register session
            self
                .verify_jwt_and_register_session_internal(
                    session_key,
                    jwt_nonce,
                    valid_after,
                    valid_until,
                    renewal_deadline,
                    allowed_contracts_root,
                    max_calls_per_tx,
                    spending_policies_len,
                    spending_data.span(),
                    signature,
                );

            VALIDATED
        }

        /// Verify JWT identity without registering a session.
        /// Used for revocation - confirms the caller owns the account.
        fn verify_jwt_identity(self: @ContractState, signature: Span<felt252>) {
            assert!(*signature[0] == OAUTH_SIG_MAGIC, "Invalid signature type");

            let session_key = *signature[3];
            let valid_until_felt: felt252 = *signature[4];
            let randomness = *signature[5];

            let jwt_sub = *signature[6];
            let jwt_nonce = *signature[7];
            let jwt_exp_felt = *signature[8];
            let jwt_kid = *signature[9];
            let jwt_iss = *signature[10];
            let salt = *signature[12];
            let wallet_name = *signature[13];

            // Verify nonce = Poseidon(session_key, valid_until, randomness)
            let expected_nonce = PoseidonTrait::new()
                .update(session_key)
                .update(valid_until_felt)
                .update(randomness)
                .finalize();
            assert!(jwt_nonce == expected_nonce, "Nonce mismatch");

            // Verify JWT not expired
            let jwt_exp: u64 = jwt_exp_felt.try_into().expect('jwt_exp overflow');
            let now = get_block_timestamp();
            assert!(now < jwt_exp, "JWT expired");

            // Verify address_seed = Poseidon(sub, salt, wallet_name?)
            let computed_seed = if wallet_name != 0 {
                PoseidonTrait::new().update(jwt_sub).update(salt).update(wallet_name).finalize()
            } else {
                let (h, _, _) = hades_permutation(jwt_sub, salt, 2);
                h
            };
            assert!(computed_seed == self.address_seed.read(), "Address seed mismatch");

            // Verify JWKS key
            let registry = IJWKSRegistryDispatcher { contract_address: self.jwks_registry.read() };
            assert!(registry.is_key_valid(jwt_kid), "JWKS key invalid or expired");

            // Extract and verify RSA signature
            // wallet_name at [13], claim offsets [14-19], RSA sig starts at [20]
            let rsa_sig_start: usize = 20;
            let rsa_sig_len: usize = (*signature[rsa_sig_start]).try_into().unwrap();
            assert!(rsa_sig_len == 16, "RSA signature must be 16 limbs");

            let mut rsa_limbs: Array<u128> = array![];
            let mut li: usize = 0;
            while li != 16 {
                let limb: u128 = (*signature[rsa_sig_start + 1 + li]).try_into().unwrap();
                rsa_limbs.append(limb);
                li += 1;
            }
            let rsa_sig = biguint_from_limbs(rsa_limbs.span());

            let n_prime_start: usize = 37;
            assert!(
                (*signature[n_prime_start]).try_into().unwrap() == 16_usize,
                "n_prime must be 16 limbs",
            );
            let mut n_prime_limbs: Array<u128> = array![];
            let mut ni: usize = 0;
            while ni != 16 {
                let limb: u128 = (*signature[n_prime_start + 1 + ni]).try_into().unwrap();
                n_prime_limbs.append(limb);
                ni += 1;
            }
            let n_prime = biguint_from_limbs(n_prime_limbs.span());

            let r_sq_start: usize = 54;
            assert!(
                (*signature[r_sq_start]).try_into().unwrap() == 16_usize, "R^2 must be 16 limbs",
            );
            let mut r_sq_limbs: Array<u128> = array![];
            let mut ri: usize = 0;
            while ri != 16 {
                let limb: u128 = (*signature[r_sq_start + 1 + ri]).try_into().unwrap();
                r_sq_limbs.append(limb);
                ri += 1;
            }
            let r_sq = biguint_from_limbs(r_sq_limbs.span());

            let jwks_key = registry.get_key(jwt_kid);
            let modulus = BigUint2048 {
                limbs: [
                    jwks_key.n0, jwks_key.n1, jwks_key.n2, jwks_key.n3, jwks_key.n4, jwks_key.n5,
                    jwks_key.n6, jwks_key.n7, jwks_key.n8, jwks_key.n9, jwks_key.n10, jwks_key.n11,
                    jwks_key.n12, jwks_key.n13, jwks_key.n14, jwks_key.n15,
                ],
            };

            let jwt_data_start: usize = 71;
            let jwt_bytes_len: usize = (*signature[jwt_data_start]).try_into().unwrap();
            let mut jwt_bytes = "";
            let mut current_byte = 0;
            let mut chunk_idx = 0;
            while current_byte != jwt_bytes_len {
                let packed_chunk = *signature[jwt_data_start + 1 + chunk_idx];
                let remaining = jwt_bytes_len - current_byte;
                let chunk_len = if remaining >= 31 {
                    31
                } else {
                    remaining
                };
                jwt_bytes.append_word(packed_chunk, chunk_len);
                current_byte += chunk_len;
                chunk_idx += 1;
            }

            assert!(
                crate::rsa::rsa_verify::verify_rsa_sha256_mont(
                    @jwt_bytes, @rsa_sig, @modulus, @n_prime, @r_sq,
                ),
                "RSA verification failed",
            );

            // Verify issuer
            assert!(
                jwt_iss == EXPECTED_ISS_GOOGLE
                    || jwt_iss == EXPECTED_ISS_APPLE
                    || jwt_iss == EXPECTED_ISS_FIREBASE,
                "Invalid JWT issuer",
            );

            // Verify claims match - indices account for wallet_name at [13]
            let sub_offset: usize = (*signature[14]).try_into().unwrap();
            let sub_len: usize = (*signature[15]).try_into().unwrap();
            let kid_offset: usize = (*signature[18]).try_into().unwrap();
            let kid_len: usize = (*signature[19]).try_into().unwrap();

            let (header_end, payload_start, payload_end) = split_signed_data(@jwt_bytes);
            let payload_len = payload_end - payload_start;

            if jwt_iss == EXPECTED_ISS_GOOGLE {
                self
                    .assert_claim_decimal_match(
                        @jwt_bytes, payload_start, payload_len, sub_offset, sub_len, jwt_sub,
                    );
            } else {
                self
                    .assert_decoded_claim_match(
                        @jwt_bytes, payload_start, payload_len, sub_offset, sub_len, jwt_sub,
                    );
            }
            self
                .assert_decoded_claim_match(
                    @jwt_bytes, 0, header_end, kid_offset, kid_len, jwt_kid,
                );
        }

        /// Store spending policies for a session key
        fn store_spending_policies(
            ref self: ContractState, session_key: felt252, count: u32, policies: Span<felt252>,
        ) {
            self.session_spending_policy_count.write(session_key, count);
            let mut i: u32 = 0;
            while i != count {
                let base: usize = (i * 3);
                let token_felt: felt252 = *policies[base];
                let limit_low: u128 = (*policies[base + 1]).try_into().unwrap();
                let limit_high: u128 = (*policies[base + 2]).try_into().unwrap();
                let token: ContractAddress = token_felt.try_into().unwrap();
                let policy = SpendingPolicy {
                    token: token, limit: u256 { low: limit_low, high: limit_high },
                };
                self.session_spending_policies.write((session_key, i), policy);
                i += 1;
            };
        }

        /// Verify that all called contracts are in the allowed contracts Merkle tree.
        /// Merkle proofs are appended to the signature starting at index 4.
        fn verify_allowed_contracts(
            self: @ContractState, root: felt252, calls: Span<Call>, signature: Span<felt252>,
        ) {
            // If root is 0, all contracts are allowed (no restriction)
            if root == 0 {
                return;
            }

            let mut sig_idx: usize = 4; // Start after [magic, r, s, session_key]
            let mut i: usize = 0;
            while i != calls.len() {
                let call = calls[i];
                let contract: ContractAddress = *call.to;
                let selector = *call.selector;

                // Read proof length for this call
                let proof_len: usize = (*signature[sig_idx]).try_into().unwrap();
                sig_idx += 1;

                // Build proof span
                let mut proof: Array<felt252> = array![];
                let mut j: usize = 0;
                while j != proof_len {
                    proof.append(*signature[sig_idx + j]);
                    j += 1;
                }
                sig_idx += proof_len;

                // SECURITY BYPASS: If call is to self, allow it regardless of Merkle tree
                // but EXPLICITLY block dangerous functions like 'upgrade'.
                if contract == get_contract_address() {
                    assert!(
                        selector != selector!("upgrade"), "Session keys cannot upgrade contract",
                    );
                    i += 1;
                    continue;
                }

                // Verify Merkle proof
                // Leaf = PoseidonTrait::new().update(contract).finalize()
                // Matches SDK's computePoseidonHashOnElements([contract])
                let mut current = PoseidonTrait::new().update(contract.into()).finalize();
                let proof_span = proof.span();
                let mut k: usize = 0;
                while k != proof_span.len() {
                    let sibling = *proof_span[k];
                    let current_u256: u256 = current.into();
                    let sibling_u256: u256 = sibling.into();
                    if current_u256 < sibling_u256 {
                        current = PoseidonTrait::new().update(current).update(sibling).finalize();
                    } else {
                        current = PoseidonTrait::new().update(sibling).update(current).finalize();
                    }
                    k += 1;
                }
                assert!(current == root, "Contract not in allowed list");

                i += 1;
            };
        }

        /// Enforce spending limits for a session key transaction.
        /// Checks ERC-20 transfer and approve calls against the session's spending policies.
        fn enforce_spending_limits(
            ref self: ContractState, session_key: felt252, calls: Span<Call>,
        ) {
            let policy_count = self.session_spending_policy_count.read(session_key);
            // If no spending policies, skip (no token restrictions)
            if policy_count == 0 {
                return;
            }

            let mut i: usize = 0;
            while i != calls.len() {
                let call = calls[i];
                let sel = *call.selector;

                // Check for ERC-20 transfer(recipient, amount_low, amount_high)
                // or approve(spender, amount_low, amount_high)
                let is_transfer = sel == selector!("transfer");
                let is_approve = sel == selector!("approve");

                if is_transfer || is_approve {
                    let token: ContractAddress = *call.to;
                    let calldata = *call.calldata;

                    // ERC-20 transfer/approve calldata: [recipient/spender, amount_low,
                    // amount_high]
                    assert!(calldata.len() >= 3, "Invalid ERC-20 calldata");
                    let amount_low: u128 = (*calldata[1]).try_into().unwrap();
                    let amount_high: u128 = (*calldata[2]).try_into().unwrap();
                    let amount = u256 { low: amount_low, high: amount_high };

                    // Find the spending policy for this token
                    let mut found = false;
                    let mut limit = u256 { low: 0, high: 0 };
                    let mut pi: u32 = 0;
                    while pi != policy_count {
                        let policy = self.session_spending_policies.read((session_key, pi));
                        if policy.token == token {
                            found = true;
                            limit = policy.limit;
                            break;
                        }
                        pi += 1;
                    }

                    assert!(found, "Token not in spending policy");

                    // Check accumulated spending
                    let spent_low = self.session_amount_spent_low.read((session_key, token));
                    let spent_high = self.session_amount_spent_high.read((session_key, token));
                    let spent = u256 { low: spent_low, high: spent_high };
                    let new_spent = spent + amount;
                    assert!(new_spent <= limit, "Spending limit exceeded");

                    // Update spent amount
                    self.session_amount_spent_low.write((session_key, token), new_spent.low);
                    self.session_amount_spent_high.write((session_key, token), new_spent.high);
                }

                i += 1;
            };
        }
    }
}
