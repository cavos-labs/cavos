use starknet::ContractAddress;

#[starknet::contract(account)]
pub mod SessionWallet {
    use super::ContractAddress;
    use starknet::get_block_timestamp;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess,
        Map, StorageMapReadAccess, StorageMapWriteAccess
    };
    use core::ecdsa::check_ecdsa_signature;
    use core::poseidon::poseidon_hash_span;

    use cavos_wallet::interfaces::isession_wallet::{
        ISessionWallet, SessionKey, Call
    };
    use cavos_wallet::components::session_manager::{
        SessionManagerComponent, SessionManagerComponent::SessionManagerImpl
    };
    use cavos_wallet::components::policy_enforcer::{
        PolicyEnforcerComponent, PolicyEnforcerComponent::PolicyEnforcerImpl
    };

    // Include components
    component!(path: SessionManagerComponent, storage: session_manager, event: SessionManagerEvent);
    component!(path: PolicyEnforcerComponent, storage: policy_enforcer, event: PolicyEnforcerEvent);

    #[storage]
    struct Storage {
        /// Master public key (owner of the wallet)
        master_public_key: felt252,
        /// Mapping from session_id to allowed contracts
        session_allowed_contracts: Map<(felt252, ContractAddress), bool>,
        /// Session manager component
        #[substorage(v0)]
        session_manager: SessionManagerComponent::Storage,
        /// Policy enforcer component
        #[substorage(v0)]
        policy_enforcer: PolicyEnforcerComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        OwnershipTransferred: OwnershipTransferred,
        TransactionExecuted: TransactionExecuted,
        ContractAllowed: ContractAllowed,
        #[flat]
        SessionManagerEvent: SessionManagerComponent::Event,
        #[flat]
        PolicyEnforcerEvent: PolicyEnforcerComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OwnershipTransferred {
        pub previous_owner: felt252,
        pub new_owner: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TransactionExecuted {
        pub session_id: felt252,
        pub to: ContractAddress,
        pub selector: felt252,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ContractAllowed {
        pub session_id: felt252,
        pub contract_address: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, master_public_key: felt252) {
        self.master_public_key.write(master_public_key);
    }

    // ============ Internal Functions ============

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Verify signature using ECDSA
        fn verify_signature(
            self: @ContractState,
            message_hash: felt252,
            signature: Span<felt252>,
            public_key: felt252,
        ) -> bool {
            assert(signature.len() == 2, 'Invalid signature length');

            let r = *signature.at(0);
            let s = *signature.at(1);

            check_ecdsa_signature(message_hash, public_key, r, s)
        }

        /// Hash a message for signing
        fn hash_message(
            self: @ContractState,
            calls: Span<Call>,
        ) -> felt252 {
            let mut call_data: Array<felt252> = array![];

            let mut i: u32 = 0;
            loop {
                if i >= calls.len() {
                    break;
                }

                let call = *calls.at(i);
                call_data.append(call.to.into());
                call_data.append(call.selector);

                let mut j: u32 = 0;
                loop {
                    if j >= call.calldata.len() {
                        break;
                    }
                    call_data.append(*call.calldata.at(j));
                    j += 1;
                }

                i += 1;
            }

            poseidon_hash_span(call_data.span())
        }

        /// Assert that caller is the master key holder
        fn assert_only_master(self: @ContractState) {
            // In production, you'd verify signature here
            // For now, we allow direct calls for testing
        }

        /// Check if contract is allowed for session
        fn is_contract_allowed_internal(
            self: @ContractState,
            session_id: felt252,
            contract_address: ContractAddress,
        ) -> bool {
            self.session_allowed_contracts.read((session_id, contract_address))
        }
    }

    // ============ ISessionWallet Implementation ============

    #[abi(embed_v0)]
    impl SessionWalletImpl of ISessionWallet<ContractState> {
        // -------- Session Management --------

        fn create_session(
            ref self: ContractState,
            session_public_key: felt252,
            max_amount_per_tx: u256,
            max_amount_per_day: u256,
            duration_seconds: u64,
        ) -> felt252 {
            // Only master can create sessions
            self.assert_only_master();

            self.session_manager.create_session(
                session_public_key,
                max_amount_per_tx,
                max_amount_per_day,
                duration_seconds,
            )
        }

        fn add_allowed_contract(
            ref self: ContractState,
            session_id: felt252,
            contract_address: ContractAddress,
        ) {
            self.assert_only_master();

            self.session_allowed_contracts.write((session_id, contract_address), true);

            self.emit(ContractAllowed {
                session_id,
                contract_address,
            });
        }

        fn is_contract_allowed(
            self: @ContractState,
            session_id: felt252,
            contract_address: ContractAddress,
        ) -> bool {
            self.is_contract_allowed_internal(session_id, contract_address)
        }

        fn revoke_session(ref self: ContractState, session_id: felt252) {
            self.assert_only_master();
            self.session_manager.revoke_session(session_id);
        }

        fn get_session(self: @ContractState, session_id: felt252) -> SessionKey {
            self.session_manager.get_session(session_id)
        }

        fn is_session_valid(self: @ContractState, session_id: felt252) -> bool {
            self.session_manager.is_session_valid(session_id)
        }

        // -------- Transaction Execution --------

        fn execute_with_session(
            ref self: ContractState,
            session_id: felt252,
            call: Call,
        ) -> Span<felt252> {
            // 1. Validate session
            assert(self.session_manager.is_session_valid(session_id), 'Session invalid');

            let session = self.session_manager.get_session(session_id);

            // 2. Check if contract is allowed
            assert(
                self.is_contract_allowed_internal(session_id, call.to),
                'Contract not allowed'
            );

            // 3. Extract amount from calldata
            let amount = self.policy_enforcer.extract_amount_from_calldata(
                call.to,
                call.selector,
                call.calldata,
            );

            // 4. Check policy compliance (amount limits)
            assert(
                self.policy_enforcer.check_compliance_amount(
                    @session.policy,
                    amount,
                ),
                'Policy violation'
            );

            // 5. Update daily spending
            let new_policy = self.policy_enforcer.update_daily_spending(
                @session.policy,
                amount,
            );
            self.session_manager.update_session_policy(session_id, new_policy);

            // 6. Execute the call
            let result = starknet::syscalls::call_contract_syscall(
                call.to,
                call.selector,
                call.calldata,
            ).unwrap();

            // 7. Emit event
            self.emit(TransactionExecuted {
                session_id,
                to: call.to,
                selector: call.selector,
                timestamp: get_block_timestamp(),
            });

            result
        }

        fn execute_multiple_with_session(
            ref self: ContractState,
            session_id: felt252,
            calls: Span<Call>,
        ) -> Span<Span<felt252>> {
            let mut results: Array<Span<felt252>> = array![];
            let mut i: u32 = 0;

            loop {
                if i >= calls.len() {
                    break;
                }

                let call = *calls.at(i);
                let result = self.execute_with_session(session_id, call);
                results.append(result);

                i += 1;
            }

            results.span()
        }

        // -------- Policy Checks --------

        fn check_policy_compliance(
            self: @ContractState,
            session_id: felt252,
            amount: u256,
            target: ContractAddress,
        ) -> bool {
            let session = self.session_manager.get_session(session_id);

            // Check amount compliance
            if !self.policy_enforcer.check_compliance_amount(@session.policy, amount) {
                return false;
            }

            // Check contract allowlist
            self.is_contract_allowed_internal(session_id, target)
        }

        // -------- Account Management --------

        fn get_master_public_key(self: @ContractState) -> felt252 {
            self.master_public_key.read()
        }

        fn transfer_ownership(ref self: ContractState, new_public_key: felt252) {
            self.assert_only_master();

            let old_key = self.master_public_key.read();
            self.master_public_key.write(new_public_key);

            self.emit(OwnershipTransferred {
                previous_owner: old_key,
                new_owner: new_public_key,
            });
        }

        // -------- StarkNet Account Interface --------

        fn __validate__(self: @ContractState, calls: Span<Call>) -> felt252 {
            // This would validate the transaction signature
            // For session keys, we'd check if it's signed by a valid session
            // For master key transactions, verify master signature

            // Simplified validation - in production, implement proper signature verification
            starknet::VALIDATED
        }

        fn __execute__(ref self: ContractState, calls: Span<Call>) -> Span<Span<felt252>> {
            // Execute calls after validation
            let mut results: Array<Span<felt252>> = array![];
            let mut i: u32 = 0;

            loop {
                if i >= calls.len() {
                    break;
                }

                let call = *calls.at(i);
                let result = starknet::syscalls::call_contract_syscall(
                    call.to,
                    call.selector,
                    call.calldata,
                ).unwrap();

                results.append(result);
                i += 1;
            }

            results.span()
        }

        fn supports_interface(self: @ContractState, interface_id: felt252) -> bool {
            // ISRC6 (Account interface) interface ID
            const ISRC6_ID: felt252 = 0x2ceccef7f994940b3962a6c67e0ba4fcd37df7d131417c604f91e03caecc1cd;

            interface_id == ISRC6_ID
        }
    }
}
