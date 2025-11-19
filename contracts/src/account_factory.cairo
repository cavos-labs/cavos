use starknet::{ContractAddress, ClassHash};

#[starknet::contract]
pub mod AccountFactory {
    use super::{ContractAddress, ClassHash};
    use starknet::{
        get_caller_address,
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess}
    };
    use starknet::syscalls::deploy_syscall;
    use core::poseidon::poseidon_hash_span;

    use cavos_wallet::interfaces::iaccount_factory::IAccountFactory;

    #[storage]
    struct Storage {
        /// Class hash of the SessionWallet implementation
        session_wallet_class_hash: ClassHash,
        /// Admin address (can update implementation)
        admin: ContractAddress,
        /// Counter for deployment tracking
        deployment_count: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        AccountDeployed: AccountDeployed,
        ImplementationUpdated: ImplementationUpdated,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AccountDeployed {
        pub account_address: ContractAddress,
        pub master_public_key: felt252,
        pub deployer: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ImplementationUpdated {
        pub old_class_hash: ClassHash,
        pub new_class_hash: ClassHash,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        session_wallet_class_hash: ClassHash,
        admin: ContractAddress,
    ) {
        self.session_wallet_class_hash.write(session_wallet_class_hash);
        self.admin.write(admin);
        self.deployment_count.write(0);
    }

    // ============ Internal Functions ============

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Assert that caller is admin
        fn assert_only_admin(self: @ContractState) {
            let caller = get_caller_address();
            let admin = self.admin.read();
            assert(caller == admin, 'Only admin');
        }

        /// Calculate deterministic address for a wallet
        fn calculate_address(
            self: @ContractState,
            master_public_key: felt252,
            salt: felt252,
        ) -> ContractAddress {
            // Use poseidon hash for deterministic address calculation
            let constructor_calldata = array![master_public_key];
            let hash = poseidon_hash_span(constructor_calldata.span());

            // Combine with salt and class hash for final address
            let final_hash = poseidon_hash_span(
                array![
                    hash,
                    salt,
                    self.session_wallet_class_hash.read().into(),
                ].span()
            );

            final_hash.try_into().unwrap()
        }
    }

    // ============ IAccountFactory Implementation ============

    #[abi(embed_v0)]
    impl AccountFactoryImpl of IAccountFactory<ContractState> {
        fn deploy_account(
            ref self: ContractState,
            master_public_key: felt252,
            salt: felt252,
        ) -> ContractAddress {
            let class_hash = self.session_wallet_class_hash.read();

            // Prepare constructor calldata
            let mut constructor_calldata: Array<felt252> = array![];
            constructor_calldata.append(master_public_key);

            // Deploy the contract
            let (contract_address, _) = deploy_syscall(
                class_hash,
                salt,
                constructor_calldata.span(),
                false, // deploy_from_zero
            ).unwrap();

            // Update deployment count
            let count = self.deployment_count.read();
            self.deployment_count.write(count + 1);

            // Emit event
            self.emit(AccountDeployed {
                account_address: contract_address,
                master_public_key,
                deployer: get_caller_address(),
            });

            contract_address
        }

        fn get_account_address(
            self: @ContractState,
            master_public_key: felt252,
            salt: felt252,
        ) -> ContractAddress {
            self.calculate_address(master_public_key, salt)
        }

        fn get_implementation_class_hash(self: @ContractState) -> ClassHash {
            self.session_wallet_class_hash.read()
        }

        fn set_implementation_class_hash(
            ref self: ContractState,
            new_class_hash: ClassHash,
        ) {
            self.assert_only_admin();

            let old_class_hash = self.session_wallet_class_hash.read();
            self.session_wallet_class_hash.write(new_class_hash);

            self.emit(ImplementationUpdated {
                old_class_hash,
                new_class_hash,
            });
        }
    }
}
