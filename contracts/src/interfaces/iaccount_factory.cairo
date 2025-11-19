use starknet::ContractAddress;
use starknet::ClassHash;

#[starknet::interface]
pub trait IAccountFactory<TContractState> {
    /// Deploy a new session wallet account
    /// Returns the deployed contract address
    fn deploy_account(
        ref self: TContractState,
        master_public_key: felt252,
        salt: felt252,
    ) -> ContractAddress;

    /// Get the address of a wallet that would be deployed with given parameters
    /// (deterministic address calculation)
    fn get_account_address(
        self: @TContractState,
        master_public_key: felt252,
        salt: felt252,
    ) -> ContractAddress;

    /// Get the class hash of the session wallet implementation
    fn get_implementation_class_hash(self: @TContractState) -> ClassHash;

    /// Update the implementation class hash (admin only)
    fn set_implementation_class_hash(ref self: TContractState, new_class_hash: ClassHash);
}
