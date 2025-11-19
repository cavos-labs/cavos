# Cavos Wallet - Architecture Overview

## System Components

The Cavos Wallet system is divided into 3 independent, loosely-coupled components:

```
┌─────────────────────────────────────────────────────────────┐
│                       USER DEVICE                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │              CLIENT SDK (Component 3)               │     │
│  │  - Wallet generation                                │     │
│  │  - Encryption/Decryption (AES-256-GCM)             │     │
│  │  - Session key management                          │     │
│  │  - Transaction signing                             │     │
│  └────────────────────────────────────────────────────┘     │
│           │                    │                             │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌─────────────────┐   ┌──────────────────┐                │
│  │ Google Drive /  │   │  StarkNet RPC    │                │
│  │ iCloud Drive    │   │  Direct Access   │                │
│  └─────────────────┘   └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
           │                            │
           │ OAuth Token                │ Tx Submission
           │ Wallet File                │
           ▼                            ▼
┌──────────────────────┐    ┌───────────────────────────┐
│  BACKEND API         │    │   STARKNET BLOCKCHAIN     │
│  (Component 2)       │    │   (Component 1)           │
│                      │    │                           │
│  - OAuth orchestr.   │    │  ┌─────────────────────┐ │
│  - Org/App mgmt      │    │  │ Session Wallet      │ │
│  - Address registry  │    │  │ Contract            │ │
│                      │    │  │                     │ │
│  PostgreSQL:         │    │  │ - Session keys      │ │
│  - organizations     │    │  │ - Policy enforcement│ │
│  - apps              │    │  │ - Tx validation     │ │
│  - wallet_addresses  │    │  └─────────────────────┘ │
└──────────────────────┘    │                           │
                            │  ┌─────────────────────┐ │
                            │  │ Account Factory     │ │
                            │  │ Contract            │ │
                            │  │                     │ │
                            │  │ - Deploy wallets    │ │
                            │  └─────────────────────┘ │
                            └───────────────────────────┘
```

## Component Breakdown

### Component 1: Smart Contracts (Cairo/StarkNet)
**Location**: `components/01-SMART-CONTRACTS.md`

**Responsibility**: On-chain logic for session-based wallet architecture

**Key Files**:
- `session_wallet.cairo` - Main wallet with session validation
- `account_factory.cairo` - Deploy new wallet instances
- `policy_enforcer.cairo` - Spending limit enforcement

**Timeline**: 3 weeks (Weeks 7-9)

**Dependencies**: None (can start immediately)

**Deliverables**:
- Session wallet contract
- Factory contract
- 90%+ test coverage
- Security audit

---

### Component 2: Backend API (Node.js/TypeScript)
**Location**: `components/02-BACKEND-API.md`

**Responsibility**: OAuth orchestration, metadata storage, NO private keys

**Key Routes**:
- `POST /v2/org/register` - Organization registration
- `POST /v2/org/:orgId/apps` - Create application
- `POST /v2/auth/google` - Google OAuth exchange
- `POST /v2/auth/apple` - Apple OAuth exchange
- `POST /v2/wallet/register` - Register wallet address
- `GET /v2/wallet/:address` - Query wallet info

**Timeline**: 4 weeks (Weeks 1-4)

**Dependencies**: PostgreSQL

**Deliverables**:
- Express API with TypeScript
- Prisma ORM + migrations
- OAuth integrations (Google + Apple)
- 80%+ test coverage
- OpenAPI documentation

---

### Component 3: Client SDK (TypeScript)
**Location**: `components/03-CLIENT-SDK.md`

**Responsibility**: Client-side wallet operations, encryption, storage

**Key Classes**:
- `CavosWalletSDK` - Main SDK interface
- `WalletManager` - Wallet lifecycle management
- `SessionManager` - Session key creation/management
- `GoogleDriveStorage` - Google Drive integration
- `iCloudStorage` - iCloud Drive integration

**Timeline**: 4 weeks (Weeks 5-8)

**Dependencies**: Backend API, Smart Contracts

**Deliverables**:
- NPM package
- Google Drive + iCloud integration
- 85%+ test coverage
- React/Vanilla examples

---

## Data Flow Diagrams

### 1. User Registration & Wallet Creation

```
┌──────┐          ┌─────────┐         ┌─────────┐         ┌──────────┐
│ User │          │   SDK   │         │ Backend │         │  Cloud   │
└──┬───┘          └────┬────┘         └────┬────┘         └────┬─────┘
   │                   │                   │                   │
   │ 1. Click Google  │                   │                   │
   │─────────────────>│                   │                   │
   │                   │                   │                   │
   │                   │ 2. OAuth flow     │                   │
   │                   │──────────────────>│                   │
   │                   │                   │                   │
   │                   │ 3. Return tokens  │                   │
   │                   │<──────────────────│                   │
   │                   │                   │                   │
   │                   │ 4. Check for wallet                   │
   │                   │──────────────────────────────────────>│
   │                   │                   │                   │
   │                   │ 5. Not found      │                   │
   │                   │<──────────────────────────────────────│
   │                   │                   │                   │
   │ 6. Generate PK    │                   │                   │
   │<──────────────────│                   │                   │
   │                   │                   │                   │
   │ 7. Deploy wallet  │                   │                   │
   │   (StarkNet)      │                   │                   │
   │<──────────────────│                   │                   │
   │                   │                   │                   │
   │ 8. Create session │                   │                   │
   │   (on-chain)      │                   │                   │
   │<──────────────────│                   │                   │
   │                   │                   │                   │
   │ 9. Encrypt PK     │                   │                   │
   │<──────────────────│                   │                   │
   │                   │                   │                   │
   │                   │10. Upload wallet  │                   │
   │                   │──────────────────────────────────────>│
   │                   │                   │                   │
   │                   │11. Register addr  │                   │
   │                   │──────────────────>│                   │
   │                   │                   │                   │
   │                   │12. Destroy master key                 │
   │                   │<──────────────────│                   │
   │                   │                   │                   │
   │ 13. Ready         │                   │                   │
   │<──────────────────│                   │                   │
```

### 2. Returning User Login

```
┌──────┐          ┌─────────┐         ┌─────────┐         ┌──────────┐
│ User │          │   SDK   │         │ Backend │         │  Cloud   │
└──┬───┘          └────┬────┘         └────┬────┘         └────┬─────┘
   │                   │                   │                   │
   │ 1. Login Google   │                   │                   │
   │─────────────────>│                   │                   │
   │                   │                   │                   │
   │                   │ 2. OAuth flow     │                   │
   │                   │──────────────────>│                   │
   │                   │                   │                   │
   │                   │ 3. Return tokens  │                   │
   │                   │<──────────────────│                   │
   │                   │                   │                   │
   │                   │ 4. Download wallet                    │
   │                   │──────────────────────────────────────>│
   │                   │                   │                   │
   │                   │ 5. Encrypted file │                   │
   │                   │<──────────────────────────────────────│
   │                   │                   │                   │
   │ 6. Decrypt PK     │                   │                   │
   │   (brief moment)  │                   │                   │
   │<──────────────────│                   │                   │
   │                   │                   │                   │
   │ 7. Create NEW     │                   │                   │
   │    session keys   │                   │                   │
   │   (on-chain)      │                   │                   │
   │<──────────────────│                   │                   │
   │                   │                   │                   │
   │ 8. Destroy master │                   │                   │
   │<──────────────────│                   │                   │
   │                   │                   │                   │
   │ 9. Ready          │                   │                   │
   │   (session valid  │                   │                   │
   │    for 24h)       │                   │                   │
   │<──────────────────│                   │                   │
```

### 3. Transaction Execution

```
┌──────┐          ┌─────────┐         ┌──────────┐
│ User │          │   SDK   │         │ StarkNet │
└──┬───┘          └────┬────┘         └────┬─────┘
   │                   │                   │
   │ 1. Swap ETH/USDC  │                   │
   │─────────────────>│                   │
   │                   │                   │
   │ 2. Check session  │                   │
   │   is valid        │                   │
   │<──────────────────│                   │
   │                   │                   │
   │ 3. Sign with      │                   │
   │    SESSION KEY    │                   │
   │   (NOT master)    │                   │
   │<──────────────────│                   │
   │                   │                   │
   │                   │ 4. Submit tx      │
   │                   │─────────────────> │
   │                   │                   │
   │                   │ 5. Validate sig   │
   │                   │   & policy        │
   │                   │<──────────────────│
   │                   │                   │
   │                   │ 6. Execute        │
   │                   │<──────────────────│
   │                   │                   │
   │ 7. Tx hash        │                   │
   │<──────────────────│                   │
   │                   │                   │

Note: Backend is NOT involved in transaction flow
```

## Component Communication

### API Contracts

#### SDK → Backend
```typescript
// Authentication
POST /v2/auth/google
Request: { code: string, appId: string }
Response: { accessToken: string, email: string, userId: string }

// Wallet Registration
POST /v2/wallet/register
Request: {
  appId: string,
  provider: 'google' | 'apple',
  userId: string,
  email: string,
  address: string,
  publicKey: string
}
Response: { success: boolean }
```

#### SDK → Cloud Storage
```typescript
interface CloudStorageProvider {
  uploadFile(filename: string, content: string): Promise<void>;
  downloadFile(filename: string): Promise<string | null>;
}
```

#### SDK → Smart Contracts
```typescript
interface ISessionWallet {
  create_session(
    session_public_key: felt252,
    policy: SessionPolicy,
    duration: u64
  ): felt252;

  execute_with_session(
    session_id: felt252,
    to: ContractAddress,
    selector: felt252,
    calldata: Array<felt252>
  ): Array<felt252>;
}
```

## Security Boundaries

### What Each Component Can Access

| Component | Private Keys | Session Keys | Wallet Addresses | Tx History |
|-----------|--------------|--------------|------------------|------------|
| Smart Contracts | ❌ | ✅ (on-chain) | ✅ | ✅ (events) |
| Backend API | ❌ | ❌ | ✅ | ❌ |
| Client SDK | ✅ (briefly) | ✅ (memory) | ✅ | ✅ (RPC query) |
| Cloud Storage | ✅ (encrypted) | ❌ | ❌ | ❌ |

### Attack Surface Analysis

**Backend Compromise**:
- ✅ Cannot steal funds (no private keys)
- ⚠️ Can see wallet addresses (privacy leak)
- ✅ Cannot execute transactions

**Cloud Storage Compromise**:
- ⚠️ Gets encrypted wallet file
- ✅ Cannot decrypt without userId + email
- ✅ Cannot steal funds without decryption

**Smart Contract Exploit**:
- ⚠️ Session keys limited by policy
- ⚠️ Max damage: daily spending limit
- ✅ Master key not exposed

**SDK/Client Compromise**:
- ⚠️ Session key exposed (24h validity)
- ⚠️ Policy limits apply
- ✅ Master key destroyed after session creation

## Development Workflow

### Phase 1: Foundation (Weeks 1-4)
**Component**: Backend API

Tasks:
1. Setup PostgreSQL + Prisma
2. Implement organization/app CRUD
3. Integrate Google OAuth
4. Integrate Apple OAuth
5. Setup testing infrastructure

**Dependencies**: None

---

### Phase 2: Blockchain (Weeks 5-7)
**Component**: Smart Contracts

Tasks:
1. Develop session wallet contract
2. Implement policy enforcer
3. Create factory contract
4. Write comprehensive tests
5. Deploy to testnet

**Dependencies**: None (parallel with SDK dev)

---

### Phase 3: Client Layer (Weeks 5-8)
**Component**: Client SDK

Tasks:
1. Core wallet management
2. Encryption/decryption utilities
3. Google Drive integration
4. iCloud integration
5. Session key management
6. StarkNet integration

**Dependencies**: Backend API (Weeks 1-4)

---

### Phase 4: Integration (Weeks 8-10)
**All Components**

Tasks:
1. End-to-end integration testing
2. Security audit
3. Performance optimization
4. Bug fixes

**Dependencies**: All components complete

---

### Phase 5: Launch (Weeks 11-12)
**All Components**

Tasks:
1. Production deployment
2. Documentation
3. Example applications
4. Monitoring setup

## Testing Strategy

### Component 1: Smart Contracts
- Unit tests for each function
- Integration tests with AVNU
- Gas optimization benchmarks
- Formal verification (optional)

### Component 2: Backend API
- Unit tests for services
- Integration tests for endpoints
- Load testing (1000 req/s)
- Security testing (OWASP Top 10)

### Component 3: Client SDK
- Unit tests for crypto utilities
- Integration tests with cloud providers
- E2E tests with real wallets
- Browser compatibility tests

### System Integration
- Full user flows (registration → login → transaction)
- Multi-device scenarios
- Session expiry handling
- Error recovery

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   PRODUCTION                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐      ┌──────────────┐            │
│  │   Backend    │      │  PostgreSQL  │            │
│  │   (API)      │─────>│   Database   │            │
│  │              │      │              │            │
│  │ Load Balanced│      │  Replicated  │            │
│  │ 3 instances  │      │              │            │
│  └──────────────┘      └──────────────┘            │
│         │                                            │
│         │ HTTPS                                      │
│         │                                            │
│  ┌──────▼───────┐                                   │
│  │   Nginx      │                                   │
│  │   Reverse    │                                   │
│  │   Proxy      │                                   │
│  └──────────────┘                                   │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │         StarkNet Mainnet                  │      │
│  │                                            │      │
│  │  - Session Wallet Contracts                │      │
│  │  - Account Factory                         │      │
│  │                                            │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │         CDN (SDK Distribution)            │      │
│  │                                            │      │
│  │  - NPM Registry                            │      │
│  │  - CDN for browser builds                  │      │
│  │                                            │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Repository Structure

```
cavos-wallet/
├── contracts/              # Component 1: Smart Contracts
│   ├── src/
│   ├── tests/
│   └── Scarb.toml
│
├── api/                    # Component 2: Backend API
│   ├── src/
│   ├── prisma/
│   ├── tests/
│   └── package.json
│
├── sdk/                    # Component 3: Client SDK
│   ├── src/
│   ├── examples/
│   ├── tests/
│   └── package.json
│
├── docs/                   # Documentation
│   ├── API.md
│   ├── SDK.md
│   └── CONTRACTS.md
│
└── examples/               # Example apps
    ├── react-demo/
    ├── vanilla-js/
    └── mobile/
```

## Next Steps

1. ✅ Review architecture overview (this document)
2. ⬜ Review Component 1 spec: Smart Contracts
3. ⬜ Review Component 2 spec: Backend API
4. ⬜ Review Component 3 spec: Client SDK
5. ⬜ Start Phase 1: Backend development
6. ⬜ Start Phase 2: Smart contract development (parallel)
7. ⬜ Start Phase 3: SDK development
8. ⬜ Integration testing
9. ⬜ Security audit
10. ⬜ Production launch

## Success Criteria

- ✅ 100% non-custodial (backend never sees private keys)
- ✅ Excellent UX (social login, no seed phrases)
- ✅ Multi-tenant (orgs → apps → users)
- ✅ Minimal backend (3 tables only)
- ✅ Portable (multi-device via cloud sync)
- ✅ Secure (session keys + on-chain policies)
- ✅ Wide coverage (Google + Apple = 95%+ users)
- ✅ Complete in 12 weeks
