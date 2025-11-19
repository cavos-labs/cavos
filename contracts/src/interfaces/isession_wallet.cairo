use starknet::ContractAddress;

/// Session key policy structure
#[derive(Drop, Serde, starknet::Store)]
pub struct SessionPolicy {
    /// Maximum amount per transaction in wei
    pub max_amount_per_tx: u256,
    /// Maximum amount per day in wei
    pub max_amount_per_day: u256,
    /// Daily amount spent so far
    pub daily_spent: u256,
    /// Last day reset timestamp (in days since epoch)
    pub last_reset_day: u64,
    // Note: allowed_contracts array stored separately in map
}

/// Session key data structure
#[derive(Drop, Serde, starknet::Store)]
pub struct SessionKey {
    /// Public key of the session
    pub public_key: felt252,
    /// Session policy
    pub policy: SessionPolicy,
    /// Creation timestamp
    pub created_at: u64,
    /// Expiration timestamp
    pub expires_at: u64,
    /// Whether the session is active
    pub is_active: bool,
}

/// Call structure for executing transactions
#[derive(Drop, Serde, Copy)]
pub struct Call {
    /// Target contract address
    pub to: ContractAddress,
    /// Function selector
    pub selector: felt252,
    /// Call data
    pub calldata: Span<felt252>,
}

#[starknet::interface]
pub trait ISessionWallet<TContractState> {
    // ============ Session Management ============

    /// Create a new session key with specified policy
    /// Returns the session ID
    fn create_session(
        ref self: TContractState,
        session_public_key: felt252,
        max_amount_per_tx: u256,
        max_amount_per_day: u256,
        duration_seconds: u64,
    ) -> felt252;

    /// Add an allowed contract to a session
    fn add_allowed_contract(
        ref self: TContractState,
        session_id: felt252,
        contract_address: ContractAddress,
    );

    /// Check if a contract is allowed for a session
    fn is_contract_allowed(
        self: @TContractState,
        session_id: felt252,
        contract_address: ContractAddress,
    ) -> bool;

    /// Revoke an existing session
    fn revoke_session(ref self: TContractState, session_id: felt252);

    /// Get session data
    fn get_session(self: @TContractState, session_id: felt252) -> SessionKey;

    /// Check if a session is valid (active and not expired)
    fn is_session_valid(self: @TContractState, session_id: felt252) -> bool;

    // ============ Transaction Execution ============

    /// Execute a transaction using a session key
    /// Returns the transaction result
    fn execute_with_session(
        ref self: TContractState,
        session_id: felt252,
        call: Call,
    ) -> Span<felt252>;

    /// Execute multiple transactions in a single call
    fn execute_multiple_with_session(
        ref self: TContractState,
        session_id: felt252,
        calls: Span<Call>,
    ) -> Span<Span<felt252>>;

    // ============ Policy Checks ============

    /// Check if a transaction complies with the session policy
    fn check_policy_compliance(
        self: @TContractState,
        session_id: felt252,
        amount: u256,
        target: ContractAddress,
    ) -> bool;

    // ============ Account Management ============

    /// Get the master public key
    fn get_master_public_key(self: @TContractState) -> felt252;

    /// Transfer ownership to a new master key
    fn transfer_ownership(ref self: TContractState, new_public_key: felt252);

    // ============ StarkNet Account Interface ============

    /// Validate a transaction signature
    fn __validate__(self: @TContractState, calls: Span<Call>) -> felt252;

    /// Execute transactions (for account abstraction)
    fn __execute__(ref self: TContractState, calls: Span<Call>) -> Span<Span<felt252>>;

    /// Check if the contract supports an interface
    fn supports_interface(self: @TContractState, interface_id: felt252) -> bool;
}
