# Component 1: Smart Contracts (Cairo/StarkNet)

## Overview
Smart contracts implementing the session key wallet architecture on StarkNet, enabling time-limited transaction signing with on-chain policy enforcement.

## Timeline
**Duration**: 3 weeks (Weeks 7-9)

**Dependencies**: None (can start in parallel with other components)

## Components

### 1.1 Session Wallet Contract

#### Responsibility
Main wallet contract that:
- Holds user funds
- Validates session key signatures
- Enforces spending policies on-chain
- Manages session key lifecycle

#### File Structure
```
contracts/
├── src/
│   ├── session_wallet.cairo         # Main wallet implementation
│   ├── session_manager.cairo        # Session key management
│   ├── policy_enforcer.cairo        # Policy validation logic
│   └── interfaces/
│       ├── ISessionWallet.cairo
│       └── IAccount.cairo           # StarkNet account interface
├── tests/
│   ├── test_session_wallet.cairo
│   ├── test_session_creation.cairo
│   ├── test_policy_enforcement.cairo
│   └── test_expiry.cairo
└── scripts/
    ├── deploy.ts
    └── declare.ts
```

#### Core Data Structures

```cairo
#[derive(Copy, Drop, Serde, starknet::Store)]
struct SessionKey {
    public_key: felt252,
    policy: SessionPolicy,
    created_at: u64,
    expires_at: u64,
    is_active: bool
}

#[derive(Copy, Drop, Serde, starknet::Store)]
struct SessionPolicy {
    max_amount_per_tx: u256,       // Maximum per transaction (in wei)
    max_amount_per_day: u256,      // Daily spending limit
    daily_spent: u256,             // Current day's spending
    last_reset_day: u64,           // Last time daily limit was reset
    allowed_contracts: Span<ContractAddress>,  // Whitelist
}

#[derive(Drop, starknet::Event)]
struct SessionCreated {
    session_id: felt252,
    public_key: felt252,
    expires_at: u64,
    policy: SessionPolicy
}

#[derive(Drop, starknet::Event)]
struct SessionRevoked {
    session_id: felt252,
    revoked_at: u64
}

#[derive(Drop, starknet::Event)]
struct TransactionExecuted {
    session_id: felt252,
    to: ContractAddress,
    amount: u256,
    timestamp: u64
}
```

#### Core Functions

```cairo
#[starknet::interface]
trait ISessionWallet<TContractState> {
    // Session Management
    fn create_session(
        ref self: TContractState,
        session_public_key: felt252,
        policy: SessionPolicy,
        duration_seconds: u64,
        master_signature: Array<felt252>
    ) -> felt252;

    fn revoke_session(
        ref self: TContractState,
        session_id: felt252,
        master_signature: Array<felt252>
    );

    fn get_session(
        self: @TContractState,
        session_id: felt252
    ) -> SessionKey;

    fn is_session_valid(
        self: @TContractState,
        session_id: felt252
    ) -> bool;

    // Transaction Execution
    fn execute_with_session(
        ref self: TContractState,
        session_id: felt252,
        to: ContractAddress,
        selector: felt252,
        calldata: Array<felt252>,
        session_signature: Array<felt252>
    ) -> Span<felt252>;

    // Policy Queries
    fn check_policy_compliance(
        self: @TContractState,
        session_id: felt252,
        amount: u256,
        target: ContractAddress
    ) -> bool;

    // Account Interface (StarkNet)
    fn __validate__(
        self: @TContractState,
        calls: Array<Call>
    ) -> felt252;

    fn __execute__(
        ref self: TContractState,
        calls: Array<Call>
    ) -> Array<Span<felt252>>;
}
```

#### Implementation Details

**Session Creation Logic**:
```cairo
fn create_session(
    ref self: TContractState,
    session_public_key: felt252,
    policy: SessionPolicy,
    duration_seconds: u64,
    master_signature: Array<felt252>
) -> felt252 {
    // 1. Verify master key signature
    let master_key = self.master_public_key.read();
    let message_hash = self.hash_session_creation_message(
        session_public_key,
        policy,
        duration_seconds
    );
    assert(
        self.verify_signature(message_hash, master_signature, master_key),
        'Invalid master signature'
    );

    // 2. Generate session ID
    let session_id = pedersen(
        session_public_key,
        starknet::get_block_timestamp()
    );

    // 3. Create session key struct
    let current_time = starknet::get_block_timestamp();
    let session = SessionKey {
        public_key: session_public_key,
        policy: policy,
        created_at: current_time,
        expires_at: current_time + duration_seconds,
        is_active: true
    };

    // 4. Store session
    self.sessions.write(session_id, session);

    // 5. Emit event
    self.emit(SessionCreated {
        session_id,
        public_key: session_public_key,
        expires_at: session.expires_at,
        policy
    });

    session_id
}
```

**Policy Enforcement**:
```cairo
fn check_policy_compliance(
    self: @TContractState,
    session_id: felt252,
    amount: u256,
    target: ContractAddress
) -> bool {
    let session = self.sessions.read(session_id);
    let policy = session.policy;

    // 1. Check per-transaction limit
    if amount > policy.max_amount_per_tx {
        return false;
    }

    // 2. Check daily limit (reset if new day)
    let current_day = starknet::get_block_timestamp() / 86400;
    let mut daily_spent = policy.daily_spent;

    if current_day > policy.last_reset_day {
        daily_spent = 0;
    }

    if daily_spent + amount > policy.max_amount_per_day {
        return false;
    }

    // 3. Check contract whitelist
    let mut allowed = false;
    let mut i = 0;
    loop {
        if i >= policy.allowed_contracts.len() {
            break;
        }
        if *policy.allowed_contracts.at(i) == target {
            allowed = true;
            break;
        }
        i += 1;
    };

    if !allowed {
        return false;
    }

    true
}
```

**Transaction Execution**:
```cairo
fn execute_with_session(
    ref self: TContractState,
    session_id: felt252,
    to: ContractAddress,
    selector: felt252,
    calldata: Array<felt252>,
    session_signature: Array<felt252>
) -> Span<felt252> {
    // 1. Validate session exists and is active
    let session = self.sessions.read(session_id);
    assert(session.is_active, 'Session not active');
    assert(
        starknet::get_block_timestamp() < session.expires_at,
        'Session expired'
    );

    // 2. Extract amount from calldata (if applicable)
    let amount = self.extract_amount_from_calldata(
        to,
        selector,
        calldata
    );

    // 3. Check policy compliance
    assert(
        self.check_policy_compliance(session_id, amount, to),
        'Policy violation'
    );

    // 4. Verify session signature
    let message_hash = self.hash_transaction_message(
        to,
        selector,
        calldata
    );
    assert(
        self.verify_signature(
            message_hash,
            session_signature,
            session.public_key
        ),
        'Invalid session signature'
    );

    // 5. Update daily spending
    self.update_daily_spending(session_id, amount);

    // 6. Execute the call
    let result = starknet::call_contract_syscall(
        to,
        selector,
        calldata.span()
    ).unwrap();

    // 7. Emit event
    self.emit(TransactionExecuted {
        session_id,
        to,
        amount,
        timestamp: starknet::get_block_timestamp()
    });

    result
}
```

### 1.2 Account Factory Contract

#### Responsibility
Deploy new session wallet instances for users.

```cairo
#[starknet::interface]
trait IAccountFactory<TContractState> {
    fn deploy_account(
        ref self: TContractState,
        master_public_key: felt252,
        salt: felt252
    ) -> ContractAddress;

    fn get_account_address(
        self: @TContractState,
        master_public_key: felt252,
        salt: felt252
    ) -> ContractAddress;
}

#[starknet::contract]
mod AccountFactory {
    use starknet::ClassHash;
    use starknet::deploy_syscall;

    #[storage]
    struct Storage {
        session_wallet_class_hash: ClassHash,
    }

    fn deploy_account(
        ref self: ContractState,
        master_public_key: felt252,
        salt: felt252
    ) -> ContractAddress {
        let class_hash = self.session_wallet_class_hash.read();

        let mut constructor_calldata = ArrayTrait::new();
        constructor_calldata.append(master_public_key);

        let (address, _) = deploy_syscall(
            class_hash,
            salt,
            constructor_calldata.span(),
            false
        ).unwrap();

        address
    }
}
```

## Testing Strategy

### Unit Tests
```cairo
#[cfg(test)]
mod tests {
    use super::{ISessionWallet, SessionPolicy};

    #[test]
    fn test_create_session() {
        // Setup
        let wallet = deploy_session_wallet();

        // Create session
        let policy = SessionPolicy {
            max_amount_per_tx: 100000000000000000, // 0.1 ETH
            max_amount_per_day: 500000000000000000, // 0.5 ETH
            daily_spent: 0,
            last_reset_day: 0,
            allowed_contracts: array![AVNU_ROUTER].span()
        };

        let session_id = wallet.create_session(
            session_pubkey,
            policy,
            86400, // 24h
            master_signature
        );

        // Verify
        assert(wallet.is_session_valid(session_id), 'Session invalid');
    }

    #[test]
    fn test_policy_enforcement_per_tx_limit() {
        let wallet = setup_wallet_with_session();

        // Try to exceed per-tx limit
        let result = wallet.execute_with_session(
            session_id,
            AVNU_ROUTER,
            selector!("swap"),
            calldata_with_amount(200000000000000000), // 0.2 ETH
            session_signature
        );

        // Should fail
        assert(result.is_err(), 'Should exceed limit');
    }

    #[test]
    fn test_session_expiry() {
        let wallet = setup_wallet_with_session();

        // Warp time forward 25 hours
        starknet::testing::set_block_timestamp(
            starknet::get_block_timestamp() + 90000
        );

        // Try to use expired session
        assert(
            !wallet.is_session_valid(session_id),
            'Session should be expired'
        );
    }
}
```

### Integration Tests
- Test with real AVNU router contract
- Test multi-call transactions
- Test session key rotation
- Gas usage benchmarks

## Deployment

### Testnet Deployment Script
```typescript
// scripts/deploy.ts
import { Account, Contract, json } from "starknet";

async function main() {
  const provider = new RpcProvider({
    nodeUrl: "https://starknet-goerli.infura.io/v3/YOUR_KEY"
  });

  const deployer = new Account(
    provider,
    DEPLOYER_ADDRESS,
    DEPLOYER_PRIVATE_KEY
  );

  // 1. Declare Session Wallet
  const compiledWallet = json.parse(
    fs.readFileSync("./target/release/session_wallet.json").toString()
  );

  const declareResponse = await deployer.declare({
    contract: compiledWallet
  });

  console.log("Session Wallet Class Hash:", declareResponse.class_hash);

  // 2. Deploy Factory
  const compiledFactory = json.parse(
    fs.readFileSync("./target/release/account_factory.json").toString()
  );

  const factoryDeploy = await deployer.deploy({
    classHash: compiledFactory.class_hash,
    constructorCalldata: [declareResponse.class_hash]
  });

  console.log("Factory Address:", factoryDeploy.contract_address);
}

main();
```

## Security Considerations

### Audit Checklist
- [ ] Signature verification cannot be bypassed
- [ ] Policy limits cannot be circumvented
- [ ] Session expiry is correctly enforced
- [ ] No reentrancy vulnerabilities
- [ ] Proper access control on session management
- [ ] Integer overflow protection
- [ ] Gas griefing protection
- [ ] Front-running protection on session creation

### Known Limitations
1. **Daily limit reset**: Uses block timestamp, subject to miner manipulation (±15min)
2. **Contract whitelist**: Static list, requires new session for new contracts
3. **Amount extraction**: Assumes standard calldata format for transfers

## Dependencies

```toml
# Scarb.toml
[dependencies]
starknet = ">=2.3.0"

[dev-dependencies]
snforge_std = { git = "https://github.com/foundry-rs/starknet-foundry" }

[[target.starknet-contract]]
sierra = true
```

## Deliverables

- [ ] Session Wallet contract (Cairo)
- [ ] Account Factory contract (Cairo)
- [ ] Policy Enforcer library
- [ ] Test suite (>90% coverage)
- [ ] Deployment scripts (testnet + mainnet)
- [ ] Security audit report
- [ ] Gas optimization report
- [ ] Contract documentation

## Success Metrics

- **Gas Cost**: < 500k gas per session creation
- **Execution Cost**: < 100k gas per transaction
- **Test Coverage**: > 90%
- **Security**: Zero critical findings in audit
