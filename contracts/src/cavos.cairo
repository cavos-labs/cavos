/// OAuth Account Contract
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
    /// Get the deployer address (can register initial session).
    fn get_deployer(self: @TContractState) -> ContractAddress;
    /// Register a session (deployer-only, used during deployment or as fallback).
    fn register_session_from_deployer(
        ref self: TContractState,
        ephemeral_pubkey: felt252,
        nonce: felt252,
        max_block: u64,
        renewal_deadline: u64,
    );
    /// Renew session using an existing session in grace period.
    /// Self-custodial: no deployer needed if within renewal window.
    fn renew_session(
        ref self: TContractState,
        old_ephemeral_pubkey: felt252,
        old_signature_r: felt252,
        old_signature_s: felt252,
        new_ephemeral_pubkey: felt252,
        new_nonce: felt252,
        new_max_block: u64,
        new_renewal_deadline: u64,
    );
    /// Get session data for an ephemeral pubkey.
    fn get_session(self: @TContractState, ephemeral_pubkey: felt252) -> (felt252, u64, u64, u64);

    fn get_version(self: @TContractState) -> u8;
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
    use core::poseidon::PoseidonTrait;
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
    use crate::rsa::bignum::{BigUint2048, biguint_from_limbs};
    use crate::rsa::rsa_verify::verify_rsa_sha256;

    /// Magic number to identify full OAuth JWT signatures (used during deployment/session
    /// registration).
    const OAUTH_SIG_MAGIC: felt252 = 'OAUTH_JWT_V1';

    /// Magic number to identify lightweight session signatures (used for transactions).
    const SESSION_SIG_MAGIC: felt252 = 'SESSION_V1';

    /// SRC-5 Interface ID
    const ISRC5_ID: felt252 = 0x3f918d17e5ee77373b56385708f855659a07f75997f365cf87748628532a055;
    /// SRC-6 Account Interface ID
    const ISRC6_ID: felt252 = 0x2ceccef7f994940b3962a6c67e0ba4fcd37df7d131417c604f91e03caecc1cd;
    /// SNIP-9 Outside Execution V2 Interface ID (Rev 1)
    const SNIP9_OUTSIDE_EXECUTION_V2_ID: felt252 =
        0x1d1144bb2138366ff28d8e9ab57456b1d332ac42196230c3a602003c89872;

    /// Session data for registered ephemeral keys
    #[derive(Copy, Drop, Serde, starknet::Store)]
    pub struct SessionData {
        pub nonce: felt252, // JWT nonce that authorized this session
        pub max_block: u64, // Session expiry block (can't transact after this)
        pub renewal_deadline: u64, // Grace period end (can renew until this block)
        pub registered_at: u64 // Block number when registered
    }

    #[storage]
    struct Storage {
        /// Poseidon(sub, salt) — identifies the owner
        address_seed: felt252,
        /// Address of the JWKS registry contract
        jwks_registry: ContractAddress,
        /// Address of the deployer contract (can register initial session)
        deployer: ContractAddress,
        /// Outside execution nonces (SNIP-9)
        outside_nonces: Map<felt252, bool>,
        /// Registered sessions: ephemeral_pubkey → SessionData
        sessions: Map<felt252, SessionData>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TransactionExecuted: TransactionExecuted,
        SessionRegistered: SessionRegistered,
        Upgraded: Upgraded,
    }

    #[derive(Drop, starknet::Event)]
    struct TransactionExecuted {
        caller: ContractAddress,
        num_calls: usize,
    }

    #[derive(Drop, starknet::Event)]
    struct SessionRegistered {
        ephemeral_pubkey: felt252,
        nonce: felt252,
        max_block: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct Upgraded {
        new_class_hash: ClassHash,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        address_seed: felt252,
        jwks_registry: ContractAddress,
        deployer: ContractAddress,
    ) {
        self.address_seed.write(address_seed);
        self.jwks_registry.write(jwks_registry);
        self.deployer.write(deployer);
    }

    // SRC-6 Account Interface
    #[abi(embed_v0)]
    impl AccountImpl of starknet::account::AccountContract<ContractState> {
        fn __validate__(ref self: ContractState, calls: Array<Call>) -> felt252 {
            let tx_info = get_tx_info().unbox();
            let signature = tx_info.signature;
            let sig_type = *signature[0];

            if (sig_type == SESSION_SIG_MAGIC) && (calls.len() == 1) {
                let call = *calls[0];
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

            self.validate_signature_and_maybe_register()
        }

        fn __execute__(ref self: ContractState, calls: Array<Call>) -> Array<Span<felt252>> {
            // Only callable by the protocol (after __validate__)
            let caller = get_caller_address();
            assert!(caller.is_zero(), "Only protocol can call __execute__");

            let mut results: Array<Span<felt252>> = array![];
            let calls_span = calls.span();
            let num_calls = calls_span.len();
            let mut i: usize = 0;
            while i < num_calls {
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
        deployer: ContractAddress,
    ) -> felt252 {
        self.validate_signature_and_maybe_register()
    }

    // SRC-6 is_valid_signature
    #[abi(embed_v0)]
    impl SignatureValidation of super::ICavos<ContractState> {
        fn get_address_seed(self: @ContractState) -> felt252 {
            self.address_seed.read()
        }

        fn get_jwks_registry(self: @ContractState) -> ContractAddress {
            self.jwks_registry.read()
        }

        fn get_deployer(self: @ContractState) -> ContractAddress {
            self.deployer.read()
        }

        /// Register a session. Can only be called by the deployer.
        /// This allows the deployer to register the initial session during deployment
        /// without requiring expensive on-chain RSA verification.
        fn register_session_from_deployer(
            ref self: ContractState,
            ephemeral_pubkey: felt252,
            nonce: felt252,
            max_block: u64,
            renewal_deadline: u64,
        ) {
            // Only the deployer can call this function
            let caller = get_caller_address();
            assert!(caller == self.deployer.read(), "Only deployer can register session");

            // Don't allow overwriting existing sessions
            let existing = self.sessions.read(ephemeral_pubkey);
            assert!(existing.nonce == 0, "Session already registered");

            // Validate renewal_deadline > max_block
            assert!(renewal_deadline >= max_block, "Renewal deadline must be >= max_block");

            // Register the session
            let current_block = get_block_number();
            let session_data = SessionData {
                nonce: nonce,
                max_block: max_block,
                renewal_deadline: renewal_deadline,
                registered_at: current_block,
            };
            self.sessions.write(ephemeral_pubkey, session_data);

            // Emit event
            self
                .emit(
                    SessionRegistered {
                        ephemeral_pubkey: ephemeral_pubkey, nonce: nonce, max_block: max_block,
                    },
                );
        }

        /// Renew a session using an existing session that is in its grace period.
        /// The old session must be expired (current_block >= max_block) but within
        /// the renewal window (current_block < renewal_deadline).
        /// This is fully self-custodial - no deployer needed.
        fn renew_session(
            ref self: ContractState,
            old_ephemeral_pubkey: felt252,
            old_signature_r: felt252,
            old_signature_s: felt252,
            new_ephemeral_pubkey: felt252,
            new_nonce: felt252,
            new_max_block: u64,
            new_renewal_deadline: u64,
        ) {
            let current_block = get_block_number();

            // 1. Verify old session exists
            let old_session = self.sessions.read(old_ephemeral_pubkey);
            assert!(old_session.nonce != 0, "Old session not registered");

            // 2. Verify old session is in grace period (expired but can still renew)
            assert!(current_block >= old_session.max_block, "Old session not yet expired");
            assert!(current_block < old_session.renewal_deadline, "Renewal period expired");

            // 3. Verify signature: old key signs the new session params
            // Message = poseidon(new_ephemeral_pubkey, new_nonce, new_max_block,
            // new_renewal_deadline)
            let message = PoseidonTrait::new()
                .update(new_ephemeral_pubkey)
                .update(new_nonce)
                .update(new_max_block.into())
                .update(new_renewal_deadline.into())
                .finalize();

            assert!(
                check_ecdsa_signature(
                    message, old_ephemeral_pubkey, old_signature_r, old_signature_s,
                ),
                "Invalid renewal signature",
            );

            // 4. Don't allow overwriting existing sessions
            let existing = self.sessions.read(new_ephemeral_pubkey);
            assert!(existing.nonce == 0, "New session already registered");

            // 5. Validate new renewal_deadline > new max_block
            assert!(new_renewal_deadline >= new_max_block, "Renewal deadline must be >= max_block");

            // 6. Register the new session
            let session_data = SessionData {
                nonce: new_nonce,
                max_block: new_max_block,
                renewal_deadline: new_renewal_deadline,
                registered_at: current_block,
            };
            self.sessions.write(new_ephemeral_pubkey, session_data);

            // 7. Emit event
            self
                .emit(
                    SessionRegistered {
                        ephemeral_pubkey: new_ephemeral_pubkey,
                        nonce: new_nonce,
                        max_block: new_max_block,
                    },
                );
        }

        /// Get session data for an ephemeral pubkey
        fn get_session(
            self: @ContractState, ephemeral_pubkey: felt252,
        ) -> (felt252, u64, u64, u64) {
            let session = self.sessions.read(ephemeral_pubkey);
            (session.nonce, session.max_block, session.renewal_deadline, session.registered_at)
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
                self.validate_outside_execution_signature(message_hash, signature);
            }

            // 6. Execute the calls
            let mut results: Array<Span<felt252>> = array![];
            let calls_span = outside_execution.calls;
            let num_calls = calls_span.len();
            let mut i: usize = 0;
            while i < num_calls {
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
        /// Validates signature and registers session if using full OAuth signature.
        /// Used by __validate__, __validate_deploy__ (can mutate state).
        fn validate_signature_and_maybe_register(ref self: ContractState) -> felt252 {
            let tx_info = get_tx_info().unbox();
            let tx_hash = tx_info.transaction_hash;
            let signature = tx_info.signature;

            let sig_type = *signature[0];

            if sig_type == SESSION_SIG_MAGIC {
                self.validate_session_signature(tx_hash, signature)
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

            let eph_r = *signature[1];
            let eph_s = *signature[2];
            let eph_pubkey = *signature[3];

            assert!(
                check_ecdsa_signature(tx_hash, eph_pubkey, eph_r, eph_s),
                "Invalid ephemeral signature",
            );

            let session = self.sessions.read(eph_pubkey);
            assert!(session.nonce != 0, "Session not registered");

            let current_block = get_block_number();
            assert!(current_block < session.max_block, "Session expired");

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
            while i < calls.len() {
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

            let eph_r = *signature[1];
            let eph_s = *signature[2];
            let eph_pubkey = *signature[3];

            // 1. Verify ephemeral key signed the message hash
            assert!(
                check_ecdsa_signature(message_hash, eph_pubkey, eph_r, eph_s),
                "Invalid ephemeral signature",
            );

            // 2. Check session exists and is valid
            let session = self.sessions.read(eph_pubkey);
            assert!(session.nonce != 0, "Session not registered");

            // 3. Verify session not expired
            let current_block = get_block_number();
            assert!(current_block < session.max_block, "Session expired");
        }

        /// Validates lightweight session signature for outside execution, skipping block expiry.
        fn validate_outside_session_signature_skip_expiry(
            self: @ContractState, message_hash: felt252, signature: Span<felt252>,
        ) {
            assert!(signature.len() >= 4, "Invalid session signature length");

            let eph_r = *signature[1];
            let eph_s = *signature[2];
            let eph_pubkey = *signature[3];

            // 1. Verify ephemeral key signed the message hash
            assert!(
                check_ecdsa_signature(message_hash, eph_pubkey, eph_r, eph_s),
                "Invalid ephemeral signature",
            );

            // 2. Check session exists and is valid
            let session = self.sessions.read(eph_pubkey);
            assert!(session.nonce != 0, "Session not registered");

            // 3. Verify session not in grace period (if it was fully expired, it would fail here)
            let current_block = get_block_number();
            assert!(current_block < session.renewal_deadline, "Renewal period expired");
        }

        /// Validates full OAuth JWT signature for outside execution
        fn validate_outside_full_oauth_signature(
            self: @ContractState, message_hash: felt252, signature: Span<felt252>,
        ) {
            // Verify magic number
            assert!(*signature[0] == OAUTH_SIG_MAGIC, "Invalid signature type");

            // Extract ephemeral key data
            let eph_r = *signature[1];
            let eph_s = *signature[2];
            let eph_pubkey = *signature[3];
            let max_block: felt252 = *signature[4];
            let randomness = *signature[5];

            // Extract JWT claims
            let jwt_sub = *signature[6];
            let jwt_nonce = *signature[7];
            let jwt_exp_felt = *signature[8];
            let jwt_kid = *signature[9];
            let _jwt_iss = *signature[10];
            let _jwt_aud = *signature[11];
            let salt = *signature[12];

            // 1. Verify ephemeral key signed the message hash (instead of tx_hash)
            assert!(
                check_ecdsa_signature(message_hash, eph_pubkey, eph_r, eph_s),
                "Invalid ephemeral signature",
            );

            // 2. Verify nonce = Poseidon(eph_pubkey, max_block, randomness)
            let expected_nonce = PoseidonTrait::new()
                .update(eph_pubkey)
                .update(max_block)
                .update(randomness)
                .finalize();
            assert!(jwt_nonce == expected_nonce, "Nonce mismatch");

            // 3. Verify session not expired (block-based)
            let current_block: u64 = get_block_number();
            let max_block_u64: u64 = max_block.try_into().expect('max_block overflow');
            assert!(current_block < max_block_u64, "Session expired");

            // 4. Verify JWT not expired (timestamp-based)
            let jwt_exp: u64 = jwt_exp_felt.try_into().expect('jwt_exp overflow');
            let now = get_block_timestamp();
            assert!(now < jwt_exp, "JWT expired");

            // 5. Verify address_seed = Poseidon(sub, salt)
            let computed_seed = PoseidonTrait::new().update(jwt_sub).update(salt).finalize();
            assert!(computed_seed == self.address_seed.read(), "Address seed mismatch");

            // 6. Verify JWKS key is valid
            let registry = IJWKSRegistryDispatcher { contract_address: self.jwks_registry.read() };
            assert!(registry.is_key_valid(jwt_kid), "JWKS key invalid or expired");

            // 7. Extract RSA signature and verify
            let rsa_sig_start: usize = 13;
            let rsa_sig_len: usize = (*signature[rsa_sig_start]).try_into().unwrap();
            assert!(rsa_sig_len == 16, "RSA signature must be 16 limbs");

            let mut rsa_limbs: Array<u128> = array![];
            let mut li: usize = 0;
            while li < 16 {
                let limb: u128 = (*signature[rsa_sig_start + 1 + li]).try_into().unwrap();
                rsa_limbs.append(limb);
                li += 1;
            }
            let rsa_sig = biguint_from_limbs(rsa_limbs.span());

            // Get RSA modulus from JWKS registry
            let jwks_key = registry.get_key(jwt_kid);
            let modulus = BigUint2048 {
                limbs: [
                    jwks_key.n0, jwks_key.n1, jwks_key.n2, jwks_key.n3, jwks_key.n4, jwks_key.n5,
                    jwks_key.n6, jwks_key.n7, jwks_key.n8, jwks_key.n9, jwks_key.n10, jwks_key.n11,
                    jwks_key.n12, jwks_key.n13, jwks_key.n14, jwks_key.n15,
                ],
            };

            // Extract JWT signed data (header.payload bytes)
            let jwt_data_start: usize = rsa_sig_start + 1 + 16;
            let jwt_data_len: usize = (*signature[jwt_data_start]).try_into().unwrap();

            let mut jwt_bytes = "";
            let mut ji: usize = 0;
            while ji < jwt_data_len {
                let felt_val = *signature[jwt_data_start + 1 + ji];
                let byte: u8 = felt_val.try_into().unwrap();
                jwt_bytes.append_byte(byte);
                ji += 1;
            }

            // Verify RSA signature on the JWT signed data
            assert!(
                verify_rsa_sha256(@jwt_bytes, @rsa_sig, @modulus),
                "RSA signature verification failed",
            );
        }

        /// Validates a lightweight session signature (SESSION_V1) - mutable version.
        /// Only checks ephemeral key signature + session expiry.
        /// Very cheap - suitable for paymaster transactions.
        fn validate_session_signature(
            ref self: ContractState, tx_hash: felt252, signature: Span<felt252>,
        ) -> felt252 {
            assert!(signature.len() >= 4, "Invalid session signature length");

            // Extract signature components
            let eph_r = *signature[1];
            let eph_s = *signature[2];
            let eph_pubkey = *signature[3];

            // 1. Verify ephemeral key signed the transaction hash
            assert!(
                check_ecdsa_signature(tx_hash, eph_pubkey, eph_r, eph_s),
                "Invalid ephemeral signature",
            );

            // 2. Check if session exists and is valid
            let session = self.sessions.read(eph_pubkey);
            assert!(session.nonce != 0, "Session not registered");

            // 3. Verify session not expired
            let current_block = get_block_number();
            assert!(current_block < session.max_block, "Session expired");

            VALIDATED
        }

        /// Validates a lightweight session signature (SESSION_V1) for renewal.
        /// Skips the max_block check but ensures we are within renewal_deadline.
        fn validate_session_signature_skip_expiry(
            self: @ContractState, tx_hash: felt252, signature: Span<felt252>,
        ) -> felt252 {
            assert!(signature.len() >= 4, "Invalid session signature length");

            let eph_r = *signature[1];
            let eph_s = *signature[2];
            let eph_pubkey = *signature[3];

            assert!(
                check_ecdsa_signature(tx_hash, eph_pubkey, eph_r, eph_s),
                "Invalid ephemeral signature",
            );

            let session = self.sessions.read(eph_pubkey);
            assert!(session.nonce != 0, "Session not registered");

            let current_block = get_block_number();
            assert!(current_block < session.renewal_deadline, "Renewal period expired");

            VALIDATED
        }

        /// Validates a full OAuth JWT signature (OAUTH_JWT_V1).
        /// Performs complete RSA verification and registers the session.
        /// Expensive - only used during deployment or explicit session registration.
        fn validate_full_oauth_and_register_session(
            ref self: ContractState, tx_hash: felt252, signature: Span<felt252>,
        ) -> felt252 {
            // Verify magic number (already checked by caller, but being explicit)
            assert!(*signature[0] == OAUTH_SIG_MAGIC, "Invalid signature type");

            // Extract ephemeral key data
            let eph_r = *signature[1];
            let eph_s = *signature[2];
            let eph_pubkey = *signature[3];
            let max_block: felt252 = *signature[4];
            let randomness = *signature[5];

            // Extract JWT claims
            let jwt_sub = *signature[6];
            let jwt_nonce = *signature[7];
            let jwt_exp_felt = *signature[8];
            let jwt_kid = *signature[9];
            let _jwt_iss = *signature[10];
            let _jwt_aud = *signature[11];
            let salt = *signature[12];

            // 1. Verify ephemeral key signed the transaction hash
            assert!(
                check_ecdsa_signature(tx_hash, eph_pubkey, eph_r, eph_s),
                "Invalid ephemeral signature",
            );

            // 2. Verify nonce = Poseidon(eph_pubkey, max_block, randomness)
            // Split eph_pubkey into lo/hi for nonce (simplified: use full felt252)
            let expected_nonce = PoseidonTrait::new()
                .update(eph_pubkey)
                .update(max_block)
                .update(randomness)
                .finalize();
            assert!(jwt_nonce == expected_nonce, "Nonce mismatch");

            // 3. Verify session not expired (block-based)
            let current_block: u64 = get_block_number();
            let max_block_u64: u64 = max_block.try_into().expect('max_block overflow');
            assert!(current_block < max_block_u64, "Session expired");

            // 4. Verify JWT not expired (timestamp-based)
            let jwt_exp: u64 = jwt_exp_felt.try_into().expect('jwt_exp overflow');
            let now = get_block_timestamp();
            assert!(now < jwt_exp, "JWT expired");

            // 5. Verify address_seed = Poseidon(sub, salt)
            let computed_seed = PoseidonTrait::new().update(jwt_sub).update(salt).finalize();
            assert!(computed_seed == self.address_seed.read(), "Address seed mismatch");

            // 6. Verify JWKS key is valid
            let registry = IJWKSRegistryDispatcher { contract_address: self.jwks_registry.read() };
            assert!(registry.is_key_valid(jwt_kid), "JWKS key invalid or expired");

            // 7. Extract RSA signature and verify
            let rsa_sig_start: usize = 13;
            let rsa_sig_len: usize = (*signature[rsa_sig_start]).try_into().unwrap();
            assert!(rsa_sig_len == 16, "RSA signature must be 16 limbs");

            let mut rsa_limbs: Array<u128> = array![];
            let mut li: usize = 0;
            while li < 16 {
                let limb: u128 = (*signature[rsa_sig_start + 1 + li]).try_into().unwrap();
                rsa_limbs.append(limb);
                li += 1;
            }
            let rsa_sig = biguint_from_limbs(rsa_limbs.span());

            // Get RSA modulus from JWKS registry
            let jwks_key = registry.get_key(jwt_kid);
            let modulus = BigUint2048 {
                limbs: [
                    jwks_key.n0, jwks_key.n1, jwks_key.n2, jwks_key.n3, jwks_key.n4, jwks_key.n5,
                    jwks_key.n6, jwks_key.n7, jwks_key.n8, jwks_key.n9, jwks_key.n10, jwks_key.n11,
                    jwks_key.n12, jwks_key.n13, jwks_key.n14, jwks_key.n15,
                ],
            };

            // Extract JWT signed data (header.payload bytes)
            let jwt_data_start: usize = rsa_sig_start + 1 + 16;
            let jwt_data_len: usize = (*signature[jwt_data_start]).try_into().unwrap();

            let mut jwt_bytes = "";
            let mut ji: usize = 0;
            while ji < jwt_data_len {
                let felt_val = *signature[jwt_data_start + 1 + ji];
                // Each felt252 encodes up to 31 bytes of JWT data
                // The SDK packs bytes into felt252 values
                let byte: u8 = felt_val.try_into().unwrap();
                jwt_bytes.append_byte(byte);
                ji += 1;
            }

            // Verify RSA signature on the JWT signed data
            assert!(
                verify_rsa_sha256(@jwt_bytes, @rsa_sig, @modulus),
                "RSA signature verification failed",
            );

            // 8. Register the session (so future transactions can use SESSION_SIG_MAGIC)
            // Default grace period: 1000 blocks (~2.7 hours) after max_block
            let renewal_deadline = max_block_u64 + 1000;
            let session_data = SessionData {
                nonce: jwt_nonce,
                max_block: max_block_u64,
                renewal_deadline: renewal_deadline,
                registered_at: current_block,
            };
            self.sessions.write(eph_pubkey, session_data);

            // Emit event
            self
                .emit(
                    SessionRegistered {
                        ephemeral_pubkey: eph_pubkey, nonce: jwt_nonce, max_block: max_block_u64,
                    },
                );

            VALIDATED
        }
    }
}
