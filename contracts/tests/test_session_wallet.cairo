use starknet::ContractAddress;
use starknet::contract_address_const;
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_block_timestamp_global};

use cavos_wallet::interfaces::isession_wallet::{
    ISessionWalletDispatcher, ISessionWalletDispatcherTrait, Call
};

const MASTER_PUBLIC_KEY: felt252 = 0x123456789;
const SESSION_PUBLIC_KEY: felt252 = 0x987654321;
const MAX_AMOUNT_PER_TX: u256 = 1000000000000000000; // 1 ETH
const MAX_AMOUNT_PER_DAY: u256 = 5000000000000000000; // 5 ETH
const DURATION_SECONDS: u64 = 86400; // 24 hours

fn deploy_wallet(master_public_key: felt252) -> ContractAddress {
    let contract = declare("SessionWallet").unwrap().contract_class();
    let mut constructor_calldata = ArrayTrait::new();
    constructor_calldata.append(master_public_key);
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    contract_address
}

fn get_mock_erc20_address() -> ContractAddress {
    contract_address_const::<0x1234>()
}

fn get_mock_target_address() -> ContractAddress {
    contract_address_const::<0x5678>()
}

#[test]
fn test_deploy_wallet() {
    let wallet_address = deploy_wallet(MASTER_PUBLIC_KEY);
    let dispatcher = ISessionWalletDispatcher { contract_address: wallet_address };

    let master_key = dispatcher.get_master_public_key();
    assert(master_key == MASTER_PUBLIC_KEY, 'Invalid master key');
}

#[test]
fn test_create_session() {
    let wallet_address = deploy_wallet(MASTER_PUBLIC_KEY);
    let dispatcher = ISessionWalletDispatcher { contract_address: wallet_address };

    // Create session
    let session_id = dispatcher.create_session(
        SESSION_PUBLIC_KEY,
        MAX_AMOUNT_PER_TX,
        MAX_AMOUNT_PER_DAY,
        DURATION_SECONDS
    );

    // Verify session was created
    assert(session_id != 0, 'Session ID should not be zero');

    // Check if session is valid
    let is_valid = dispatcher.is_session_valid(session_id);
    assert(is_valid, 'Session should be valid');

    // Get session details
    let session = dispatcher.get_session(session_id);
    assert(session.public_key == SESSION_PUBLIC_KEY, 'Invalid session public key');
    assert(session.policy.max_amount_per_tx == MAX_AMOUNT_PER_TX, 'Invalid max per tx');
    assert(session.policy.max_amount_per_day == MAX_AMOUNT_PER_DAY, 'Invalid max per day');
    assert(session.is_active, 'Session should be active');
}

#[test]
fn test_add_allowed_contract() {
    let wallet_address = deploy_wallet(MASTER_PUBLIC_KEY);
    let dispatcher = ISessionWalletDispatcher { contract_address: wallet_address };

    // Create session
    let session_id = dispatcher.create_session(
        SESSION_PUBLIC_KEY,
        MAX_AMOUNT_PER_TX,
        MAX_AMOUNT_PER_DAY,
        DURATION_SECONDS
    );

    // Add allowed contract
    let erc20_address = get_mock_erc20_address();
    dispatcher.add_allowed_contract(session_id, erc20_address);

    // Verify contract is allowed
    let is_allowed = dispatcher.is_contract_allowed(session_id, erc20_address);
    assert(is_allowed, 'Contract should be allowed');

    // Check that other contracts are not allowed
    let other_address = get_mock_target_address();
    let is_other_allowed = dispatcher.is_contract_allowed(session_id, other_address);
    assert(!is_other_allowed, 'Other contract not allowed');
}

#[test]
fn test_revoke_session() {
    let wallet_address = deploy_wallet(MASTER_PUBLIC_KEY);
    let dispatcher = ISessionWalletDispatcher { contract_address: wallet_address };

    // Create session
    let session_id = dispatcher.create_session(
        SESSION_PUBLIC_KEY,
        MAX_AMOUNT_PER_TX,
        MAX_AMOUNT_PER_DAY,
        DURATION_SECONDS
    );

    // Verify session is valid
    assert(dispatcher.is_session_valid(session_id), 'Session should be valid');

    // Revoke session
    dispatcher.revoke_session(session_id);

    // Verify session is no longer valid
    let is_valid_after = dispatcher.is_session_valid(session_id);
    assert(!is_valid_after, 'Session should be invalid');
}

#[test]
fn test_session_expiration() {
    let wallet_address = deploy_wallet(MASTER_PUBLIC_KEY);
    let dispatcher = ISessionWalletDispatcher { contract_address: wallet_address };

    // Set initial timestamp
    start_cheat_block_timestamp_global(1000);

    // Create session with 1 hour duration
    let session_id = dispatcher.create_session(
        SESSION_PUBLIC_KEY,
        MAX_AMOUNT_PER_TX,
        MAX_AMOUNT_PER_DAY,
        3600 // 1 hour
    );

    // Session should be valid initially
    assert(dispatcher.is_session_valid(session_id), 'Session should be valid');

    // Fast forward time past expiration
    start_cheat_block_timestamp_global(1000 + 3601);

    // Session should be expired
    let is_valid_after = dispatcher.is_session_valid(session_id);
    assert(!is_valid_after, 'Session should be expired');
}

#[test]
fn test_check_policy_compliance_per_tx_limit() {
    let wallet_address = deploy_wallet(MASTER_PUBLIC_KEY);
    let dispatcher = ISessionWalletDispatcher { contract_address: wallet_address };

    // Create session with low per-tx limit
    let session_id = dispatcher.create_session(
        SESSION_PUBLIC_KEY,
        100, // Very low per-tx limit
        1000,
        DURATION_SECONDS
    );

    let target = get_mock_erc20_address();
    dispatcher.add_allowed_contract(session_id, target);

    // Check compliance with amount under limit
    let compliant = dispatcher.check_policy_compliance(session_id, 50, target);
    assert(compliant, 'Should be compliant');

    // Check compliance with amount over limit
    let non_compliant = dispatcher.check_policy_compliance(session_id, 200, target);
    assert(!non_compliant, 'Should not be compliant');
}

#[test]
fn test_check_policy_compliance_daily_limit() {
    let wallet_address = deploy_wallet(MASTER_PUBLIC_KEY);
    let dispatcher = ISessionWalletDispatcher { contract_address: wallet_address };

    // Create session with daily limit
    let session_id = dispatcher.create_session(
        SESSION_PUBLIC_KEY,
        500, // Per-tx limit
        1000, // Daily limit
        DURATION_SECONDS
    );

    let target = get_mock_erc20_address();
    dispatcher.add_allowed_contract(session_id, target);

    // Check should be compliant with amount under both limits
    let compliant = dispatcher.check_policy_compliance(session_id, 400, target);
    assert(compliant, 'Should be compliant');

    // Check with amount at per-tx limit but within daily limit
    let compliant2 = dispatcher.check_policy_compliance(session_id, 500, target);
    assert(compliant2, 'Should still be compliant');
}

#[test]
fn test_check_policy_compliance_contract_not_allowed() {
    let wallet_address = deploy_wallet(MASTER_PUBLIC_KEY);
    let dispatcher = ISessionWalletDispatcher { contract_address: wallet_address };

    // Create session
    let session_id = dispatcher.create_session(
        SESSION_PUBLIC_KEY,
        MAX_AMOUNT_PER_TX,
        MAX_AMOUNT_PER_DAY,
        DURATION_SECONDS
    );

    // Add one allowed contract
    let allowed_contract = get_mock_erc20_address();
    dispatcher.add_allowed_contract(session_id, allowed_contract);

    // Check compliance with non-allowed contract
    let target = get_mock_target_address();
    let compliant = dispatcher.check_policy_compliance(session_id, 100, target);
    assert(!compliant, 'Should not be compliant');
}

#[test]
fn test_transfer_ownership() {
    let wallet_address = deploy_wallet(MASTER_PUBLIC_KEY);
    let dispatcher = ISessionWalletDispatcher { contract_address: wallet_address };

    // Verify initial master key
    assert(dispatcher.get_master_public_key() == MASTER_PUBLIC_KEY, 'Initial key mismatch');

    // Transfer ownership
    let new_master_key: felt252 = 0xABCDEF;
    dispatcher.transfer_ownership(new_master_key);

    // Verify new master key
    let current_master = dispatcher.get_master_public_key();
    assert(current_master == new_master_key, 'Ownership transfer failed');
}

#[test]
fn test_supports_interface() {
    let wallet_address = deploy_wallet(MASTER_PUBLIC_KEY);
    let dispatcher = ISessionWalletDispatcher { contract_address: wallet_address };

    // ISRC6 interface ID
    let isrc6_id: felt252 = 0x2ceccef7f994940b3962a6c67e0ba4fcd37df7d131417c604f91e03caecc1cd;

    let supports = dispatcher.supports_interface(isrc6_id);
    assert(supports, 'Should support ISRC6');

    // Random interface should not be supported
    let random_id: felt252 = 0x12345;
    let supports_random = dispatcher.supports_interface(random_id);
    assert(!supports_random, 'Should not support random');
}

#[test]
fn test_multiple_sessions() {
    let wallet_address = deploy_wallet(MASTER_PUBLIC_KEY);
    let dispatcher = ISessionWalletDispatcher { contract_address: wallet_address };

    // Create first session
    let session_id_1 = dispatcher.create_session(
        0x111,
        1000,
        5000,
        DURATION_SECONDS
    );

    // Create second session
    let session_id_2 = dispatcher.create_session(
        0x222,
        2000,
        10000,
        DURATION_SECONDS
    );

    // Verify both sessions are valid
    assert(dispatcher.is_session_valid(session_id_1), 'Session 1 should be valid');
    assert(dispatcher.is_session_valid(session_id_2), 'Session 2 should be valid');

    // Verify sessions have different IDs
    assert(session_id_1 != session_id_2, 'Session IDs should differ');

    // Get both sessions and verify their public keys
    let session_1 = dispatcher.get_session(session_id_1);
    let session_2 = dispatcher.get_session(session_id_2);

    assert(session_1.public_key == 0x111, 'Session 1 key mismatch');
    assert(session_2.public_key == 0x222, 'Session 2 key mismatch');
}
