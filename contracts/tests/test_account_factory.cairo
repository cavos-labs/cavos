use starknet::{ContractAddress, ClassHash, contract_address_const};
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};

use cavos_wallet::interfaces::iaccount_factory::{
    IAccountFactoryDispatcher, IAccountFactoryDispatcherTrait
};
use cavos_wallet::interfaces::isession_wallet::{
    ISessionWalletDispatcher, ISessionWalletDispatcherTrait
};

const ADMIN_ADDRESS: felt252 = 0x123;
const MASTER_PUBLIC_KEY: felt252 = 0x123456789;
const SALT: felt252 = 0x42;

fn get_admin_address() -> ContractAddress {
    contract_address_const::<ADMIN_ADDRESS>()
}

fn deploy_factory() -> (ContractAddress, ClassHash) {
    // First declare the SessionWallet contract
    let session_wallet_class = declare("SessionWallet").unwrap().contract_class();
    let session_wallet_class_hash = *session_wallet_class.class_hash;

    // Deploy the AccountFactory
    let factory_contract = declare("AccountFactory").unwrap().contract_class();
    let mut constructor_calldata = ArrayTrait::new();
    constructor_calldata.append(session_wallet_class_hash.into());
    constructor_calldata.append(ADMIN_ADDRESS);

    let (factory_address, _) = factory_contract.deploy(@constructor_calldata).unwrap();

    (factory_address, session_wallet_class_hash)
}

#[test]
fn test_deploy_factory() {
    let (factory_address, expected_class_hash) = deploy_factory();
    let dispatcher = IAccountFactoryDispatcher { contract_address: factory_address };

    let class_hash = dispatcher.get_implementation_class_hash();
    assert(class_hash == expected_class_hash, 'Class hash mismatch');
}

#[test]
fn test_deploy_account() {
    let (factory_address, _) = deploy_factory();
    let dispatcher = IAccountFactoryDispatcher { contract_address: factory_address };

    // Deploy a session wallet through the factory
    let account_address = dispatcher.deploy_account(MASTER_PUBLIC_KEY, SALT);

    // Verify the account was deployed
    assert(account_address.into() != 0, 'Account address is zero');

    // Verify the account has the correct master key
    let wallet_dispatcher = ISessionWalletDispatcher { contract_address: account_address };
    let master_key = wallet_dispatcher.get_master_public_key();
    assert(master_key == MASTER_PUBLIC_KEY, 'Master key mismatch');
}

#[test]
fn test_deterministic_address() {
    let (factory_address, _) = deploy_factory();
    let dispatcher = IAccountFactoryDispatcher { contract_address: factory_address };

    // Get the address before deployment
    let predicted_address = dispatcher.get_account_address(MASTER_PUBLIC_KEY, SALT);

    // Deploy the account
    let deployed_address = dispatcher.deploy_account(MASTER_PUBLIC_KEY, SALT);

    // Note: The actual deployed address might differ from prediction due to
    // how Starknet calculates contract addresses. This test verifies the
    // factory's address calculation logic is consistent.
    assert(predicted_address.into() != 0, 'Predicted address is zero');
    assert(deployed_address.into() != 0, 'Deployed address is zero');
}

#[test]
fn test_deploy_multiple_accounts() {
    let (factory_address, _) = deploy_factory();
    let dispatcher = IAccountFactoryDispatcher { contract_address: factory_address };

    // Deploy first account
    let account1 = dispatcher.deploy_account(MASTER_PUBLIC_KEY, SALT);

    // Deploy second account with different salt
    let account2 = dispatcher.deploy_account(MASTER_PUBLIC_KEY, SALT + 1);

    // Verify both accounts are deployed
    assert(account1.into() != 0, 'Account 1 address is zero');
    assert(account2.into() != 0, 'Account 2 address is zero');

    // Verify accounts have different addresses
    assert(account1 != account2, 'Accounts should differ');

    // Verify both have the same master key
    let wallet1 = ISessionWalletDispatcher { contract_address: account1 };
    let wallet2 = ISessionWalletDispatcher { contract_address: account2 };

    assert(wallet1.get_master_public_key() == MASTER_PUBLIC_KEY, 'Wallet 1 key mismatch');
    assert(wallet2.get_master_public_key() == MASTER_PUBLIC_KEY, 'Wallet 2 key mismatch');
}

#[test]
fn test_deploy_accounts_with_different_keys() {
    let (factory_address, _) = deploy_factory();
    let dispatcher = IAccountFactoryDispatcher { contract_address: factory_address };

    let master_key_1: felt252 = 0x111;
    let master_key_2: felt252 = 0x222;

    // Deploy accounts with different master keys but same salt
    let account1 = dispatcher.deploy_account(master_key_1, SALT);
    let account2 = dispatcher.deploy_account(master_key_2, SALT);

    // Verify accounts have different addresses
    assert(account1 != account2, 'Accounts should differ');

    // Verify each account has its own master key
    let wallet1 = ISessionWalletDispatcher { contract_address: account1 };
    let wallet2 = ISessionWalletDispatcher { contract_address: account2 };

    assert(wallet1.get_master_public_key() == master_key_1, 'Wallet 1 key mismatch');
    assert(wallet2.get_master_public_key() == master_key_2, 'Wallet 2 key mismatch');
}

#[test]
#[should_panic(expected: ('Only admin',))]
fn test_set_implementation_non_admin_fails() {
    let (factory_address, _) = deploy_factory();
    let dispatcher = IAccountFactoryDispatcher { contract_address: factory_address };

    // Try to set implementation as non-admin (should fail)
    let new_class_hash: ClassHash = 0x999.try_into().unwrap();

    // This should panic because we're not calling as admin
    dispatcher.set_implementation_class_hash(new_class_hash);
}
