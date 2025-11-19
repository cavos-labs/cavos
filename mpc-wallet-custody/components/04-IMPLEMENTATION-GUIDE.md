# Implementation Guide

## Quick Start

This guide provides a step-by-step implementation roadmap for the Cavos Wallet system.

## Prerequisites

### Development Environment
- Node.js 20+
- PostgreSQL 15+
- Cairo 2.3.0+
- Scarb (Cairo package manager)
- Git
- Docker (optional)

### Required Accounts
- Google Cloud Console (for OAuth + Drive API)
- Apple Developer Account (for Sign In + CloudKit)
- StarkNet testnet account with funds

### Knowledge Requirements
- TypeScript/JavaScript
- Cairo (StarkNet smart contracts)
- React (for examples)
- PostgreSQL/Prisma
- OAuth 2.0 flow
- Cryptography basics (AES, PBKDF2)

## Phase 1: Backend API (Weeks 1-4)

### Week 1: Project Setup

#### Day 1-2: Database Setup
```bash
# Create project
mkdir cavos-wallet-api
cd cavos-wallet-api
npm init -y

# Install dependencies
npm install express typescript @types/express
npm install prisma @prisma/client
npm install bcrypt passport passport-google-oauth20
npm install zod dotenv cors helmet

# Dev dependencies
npm install -D @types/node @types/bcrypt ts-node nodemon
npm install -D jest @types/jest ts-jest supertest

# Initialize Prisma
npx prisma init

# Create schema
```

Edit `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  apiKey    String   @unique @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  apps      App[]
  @@map("organizations")
}

model App {
  id           String          @id @default(uuid())
  appId        String          @unique @map("app_id")
  orgId        String          @map("org_id")
  name         String
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")
  organization Organization    @relation(fields: [orgId], references: [id], onDelete: Cascade)
  wallets      WalletAddress[]
  @@index([orgId])
  @@map("apps")
}

model WalletAddress {
  id        String   @id @default(uuid())
  appId     String   @map("app_id")
  provider  String
  userId    String   @map("user_id")
  userEmail String   @map("user_email")
  address   String   @unique
  publicKey String   @map("public_key")
  network   String   @default("starknet-mainnet")
  createdAt DateTime @default(now()) @map("created_at")
  app       App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  @@unique([appId, provider, userId])
  @@index([appId])
  @@map("wallet_addresses")
}
```

Run migration:
```bash
npx prisma migrate dev --name init
```

#### Day 3-5: Core API Structure

Create folder structure:
```bash
mkdir -p src/{routes,controllers,services,middleware,types,utils}
```

Implement organization endpoints:
- `POST /v2/org/register`
- `POST /v2/org/login`
- `GET /v2/org/:orgId`

**Checkpoint**: Test organization CRUD with Postman/curl

### Week 2: OAuth Integration

#### Day 1-3: Google OAuth

1. Create Google Cloud Project
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Implement `GoogleOAuthService`
5. Implement `POST /v2/auth/google`

Test:
```bash
curl -X POST http://localhost:3000/v2/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "code": "GOOGLE_AUTH_CODE",
    "appId": "app_test"
  }'
```

#### Day 4-5: Apple OAuth

1. Configure Apple Developer account
2. Create Services ID
3. Generate private key for Sign In with Apple
4. Implement `AppleOAuthService`
5. Implement `POST /v2/auth/apple`

**Checkpoint**: Both OAuth flows working end-to-end

### Week 3: App Management & Wallet Registry

#### Day 1-2: App CRUD
Implement:
- `POST /v2/org/:orgId/apps`
- `GET /v2/org/:orgId/apps`
- `GET /v2/org/:orgId/apps/:appId`
- `DELETE /v2/org/:orgId/apps/:appId`

#### Day 3-5: Wallet Registry
Implement:
- `POST /v2/wallet/register`
- `GET /v2/wallet/:address`

Add middleware:
- API key authentication
- Rate limiting
- Request validation (Zod)

**Checkpoint**: All API endpoints functional

### Week 4: Testing & Documentation

#### Day 1-3: Testing
Write tests:
- Unit tests for services (80%+ coverage)
- Integration tests for endpoints
- E2E tests for OAuth flows

#### Day 4-5: Documentation
- OpenAPI/Swagger spec
- README with setup instructions
- API documentation

**Checkpoint**: Backend API complete and tested

---

## Phase 2: Smart Contracts (Weeks 5-7)

### Week 5: Session Wallet Contract

#### Day 1-2: Project Setup
```bash
mkdir cavos-wallet-contracts
cd cavos-wallet-contracts
scarb init

# Edit Scarb.toml
[dependencies]
starknet = ">=2.3.0"

[dev-dependencies]
snforge_std = { git = "https://github.com/foundry-rs/starknet-foundry" }
```

#### Day 3-5: Core Wallet Logic

Implement `session_wallet.cairo`:
- Storage struct for sessions
- `create_session()` function
- Session validation logic
- Master key signature verification

Test:
```bash
scarb test
```

**Checkpoint**: Session creation working

### Week 6: Policy Enforcement

#### Day 1-3: Policy Logic

Implement `policy_enforcer.cairo`:
- Per-transaction limit check
- Daily spending limit with reset
- Contract whitelist validation
- Amount extraction from calldata

#### Day 4-5: Transaction Execution

Implement `execute_with_session()`:
- Session validation
- Policy compliance check
- Signature verification
- Transaction execution
- Daily spending update

**Checkpoint**: Full transaction flow working

### Week 7: Factory & Testing

#### Day 1-2: Account Factory

Implement `account_factory.cairo`:
- Deploy wallet instances
- Calculate deterministic addresses
- Constructor calldata handling

#### Day 3-5: Comprehensive Testing

Write tests:
- Unit tests for each function (>90% coverage)
- Integration tests with AVNU
- Gas benchmarks
- Edge case testing (expired sessions, policy violations)

Deploy to testnet:
```bash
# Declare contracts
scarb build
starkli declare target/release/session_wallet.json

# Deploy factory
starkli deploy <class_hash> <constructor_args>
```

**Checkpoint**: Contracts deployed and tested on testnet

---

## Phase 3: Client SDK (Weeks 8-10)

### Week 8: Core SDK Structure

#### Day 1-2: Project Setup
```bash
mkdir cavos-wallet-sdk
cd cavos-wallet-sdk
npm init -y

# Install dependencies
npm install starknet
npm install -D typescript vite vitest @types/node

# Setup build
npm install -D tsup vite-plugin-dts
```

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

#### Day 3-5: Crypto Utilities

Implement:
- `crypto/keyDerivation.ts` - PBKDF2 implementation
- `crypto/encryption.ts` - AES-256-GCM encrypt/decrypt
- `utils/memory.ts` - Secure memory clearing

Test all crypto functions thoroughly.

**Checkpoint**: Encryption working correctly

### Week 9: Cloud Storage & Auth

#### Day 1-2: Google Integration

Implement:
- `auth/GoogleOAuth.ts` - OAuth flow
- `storage/GoogleDriveStorage.ts` - File operations

Test:
```typescript
const storage = new GoogleDriveStorage(accessToken);
await storage.uploadFile('test.txt', 'encrypted data');
const content = await storage.downloadFile('test.txt');
```

#### Day 3-5: Apple Integration

Implement:
- `auth/AppleOAuth.ts` - Sign In flow
- `storage/iCloudStorage.ts` - CloudKit operations

**Checkpoint**: Both storage providers working

### Week 10: Wallet & Session Management

#### Day 1-3: Wallet Manager

Implement `wallet/WalletManager.ts`:
- `generateWallet()` - Create keypair
- `deployWallet()` - Deploy via factory
- `encryptWallet()` - Encrypt private key
- `decryptWallet()` - Decrypt private key

#### Day 4-5: Session Manager

Implement `wallet/SessionManager.ts`:
- `createSession()` - Generate session keys
- Register session on-chain
- `executeWithSession()` - Sign and submit tx

**Checkpoint**: Full wallet lifecycle working

---

## Phase 4: Integration (Weeks 11-12)

### Week 11: End-to-End Testing

#### Day 1-2: Example App

Create React example:
```bash
npx create-react-app cavos-demo
cd cavos-demo
npm install @cavos/wallet-sdk
```

Implement:
- Login with Google/Apple
- Display wallet address
- Execute sample transaction

#### Day 3-5: Integration Tests

Test complete flows:
1. New user registration
2. Wallet creation and deployment
3. Session key creation
4. Transaction execution
5. Multi-device login
6. Session expiry handling

**Checkpoint**: All user flows working

### Week 12: Security & Launch

#### Day 1-2: Security Audit

Review checklist:
- [ ] No private keys in backend
- [ ] Encryption keys properly derived
- [ ] Session keys destroyed correctly
- [ ] OAuth flows secure
- [ ] Input validation everywhere
- [ ] Rate limiting configured
- [ ] HTTPS enforced

#### Day 3-4: Performance Testing

Benchmark:
- API response times (< 100ms p95)
- SDK login flow (< 3s)
- Transaction signing (< 1s)
- Contract gas usage

#### Day 5: Documentation & Deploy

- Final documentation review
- Production deployment
- Monitoring setup (Sentry, DataDog)
- Launch! 🚀

---

## Development Checklist

### Backend API
- [ ] PostgreSQL setup
- [ ] Prisma migrations
- [ ] Organization CRUD
- [ ] App CRUD
- [ ] Google OAuth integration
- [ ] Apple OAuth integration
- [ ] Wallet registry
- [ ] Authentication middleware
- [ ] Rate limiting
- [ ] Unit tests (80%+)
- [ ] Integration tests
- [ ] OpenAPI documentation
- [ ] Docker configuration
- [ ] Production deployment

### Smart Contracts
- [ ] Session wallet contract
- [ ] Policy enforcer logic
- [ ] Account factory
- [ ] Session creation
- [ ] Session validation
- [ ] Policy enforcement
- [ ] Transaction execution
- [ ] Unit tests (90%+)
- [ ] Integration tests
- [ ] Gas optimization
- [ ] Testnet deployment
- [ ] Security audit
- [ ] Mainnet deployment

### Client SDK
- [ ] Project setup
- [ ] Crypto utilities (PBKDF2, AES-GCM)
- [ ] Google OAuth
- [ ] Apple OAuth
- [ ] Google Drive integration
- [ ] iCloud integration
- [ ] Wallet generation
- [ ] Wallet deployment
- [ ] Session key management
- [ ] Transaction signing
- [ ] Main SDK class
- [ ] Unit tests (85%+)
- [ ] Integration tests
- [ ] React example
- [ ] NPM package
- [ ] Documentation

### Integration
- [ ] E2E tests
- [ ] Example applications
- [ ] Security audit
- [ ] Performance testing
- [ ] Load testing
- [ ] Documentation review
- [ ] Production deployment

---

## Common Issues & Solutions

### Issue: Google OAuth Redirect Mismatch
**Solution**: Ensure redirect URI in Google Console exactly matches the one in code

### Issue: Apple Sign In Not Working
**Solution**: Verify Services ID, Team ID, and private key are correctly configured

### Issue: Contract Deployment Fails
**Solution**: Check account has enough ETH for gas, verify class hash is declared

### Issue: Encryption/Decryption Failing
**Solution**: Ensure userId and email are exactly the same for both operations

### Issue: Session Expired Immediately
**Solution**: Check timestamp calculation, ensure duration is in seconds not milliseconds

### Issue: Transaction Rejected by Contract
**Solution**: Verify session is registered on-chain and hasn't expired

---

## Testing Strategy

### Unit Tests
Each component should have >80% coverage:
- Backend: Jest + Supertest
- Contracts: Scarb test
- SDK: Vitest

### Integration Tests
Test component interactions:
- Backend ↔ Database
- SDK ↔ Backend API
- SDK ↔ Smart Contracts
- SDK ↔ Cloud Storage

### E2E Tests
Full user journeys:
- New user onboarding
- Returning user login
- Transaction execution
- Multi-device scenarios

### Security Tests
- OWASP Top 10
- Contract exploit attempts
- OAuth security
- Encryption strength

---

## Deployment

### Backend API
```bash
# Build
npm run build

# Start production
NODE_ENV=production npm start

# Or with Docker
docker build -t cavos-api .
docker run -p 3000:3000 cavos-api
```

### Smart Contracts
```bash
# Declare
starkli declare target/release/session_wallet.json --network mainnet

# Deploy factory
starkli deploy <class_hash> --network mainnet
```

### SDK
```bash
# Build
npm run build

# Publish to NPM
npm publish
```

---

## Monitoring

### Backend
- Uptime: UptimeRobot / Pingdom
- Errors: Sentry
- Metrics: DataDog / New Relic
- Logs: CloudWatch / Logtail

### Smart Contracts
- Transactions: Voyager / StarkScan
- Events: Index with The Graph
- Gas usage: Monitor daily

### SDK
- Usage analytics: Mixpanel / Amplitude
- Error tracking: Sentry
- Performance: Web Vitals

---

## Support & Resources

### Documentation
- StarkNet: https://docs.starknet.io
- Google Drive API: https://developers.google.com/drive
- Apple CloudKit: https://developer.apple.com/cloudkit

### Community
- StarkNet Discord
- Cairo Book
- GitHub Issues

### Security
- Report vulnerabilities: security@cavos.io
- Bug bounty program (coming soon)

---

## Next Steps

1. Clone component specs:
   - `00-ARCHITECTURE-OVERVIEW.md`
   - `01-SMART-CONTRACTS.md`
   - `02-BACKEND-API.md`
   - `03-CLIENT-SDK.md`

2. Choose starting point (recommendation: Backend API)

3. Set up development environment

4. Start Week 1 tasks

5. Follow weekly checkpoints

Good luck! 🚀
