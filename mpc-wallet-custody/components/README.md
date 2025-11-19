# Cavos Wallet - Component Specifications

This directory contains detailed specifications for each component of the Cavos Wallet system.

## 📚 Documentation Index

### 🏗️ [00 - Architecture Overview](./00-ARCHITECTURE-OVERVIEW.md)
**Start here!** High-level system architecture, component interactions, data flows, and security model.

**Key Topics**:
- System component diagram
- Data flow diagrams (registration, login, transactions)
- Component communication contracts
- Security boundaries
- Attack surface analysis
- Development workflow
- Deployment architecture

**Read this first** to understand how all components work together.

---

### 🔗 [Component 1 - Smart Contracts](./01-SMART-CONTRACTS.md)
Cairo/StarkNet smart contracts implementing session-based wallet architecture.

**Timeline**: 3 weeks (Weeks 7-9)
**Tech Stack**: Cairo 2.3+, StarkNet, Scarb
**Dependencies**: None (can start immediately)

**Key Features**:
- Session wallet contract with policy enforcement
- Account factory for wallet deployment
- On-chain spending limits
- Time-based session expiration
- Contract whitelist validation

**Deliverables**:
- `session_wallet.cairo` - Main wallet contract
- `account_factory.cairo` - Deployment factory
- `policy_enforcer.cairo` - Policy validation
- Test suite (>90% coverage)
- Testnet + mainnet deployment scripts

---

### 🖥️ [Component 2 - Backend API](./02-BACKEND-API.md)
Node.js/TypeScript REST API for OAuth orchestration and metadata storage.

**Timeline**: 4 weeks (Weeks 1-4)
**Tech Stack**: Node.js 20+, Express, TypeScript, Prisma, PostgreSQL
**Dependencies**: PostgreSQL database

**Key Features**:
- Organization and app management
- Google OAuth integration
- Apple OAuth integration
- Wallet address registry
- API key authentication
- Rate limiting

**API Endpoints**:
- `POST /v2/org/register` - Create organization
- `POST /v2/org/:orgId/apps` - Create app
- `POST /v2/auth/google` - Google OAuth
- `POST /v2/auth/apple` - Apple OAuth
- `POST /v2/wallet/register` - Register wallet

**Important**: Backend does NOT store private keys or handle transactions.

---

### 🌐 [Component 3A - Web SDK](./03A-WEB-SDK.md)
TypeScript SDK for web browsers (React, Vue, vanilla JS).

**Timeline**: 3 weeks (Weeks 5-7)
**Tech Stack**: TypeScript, Web Crypto API, starknet.js, Vite
**Dependencies**: Backend API, Smart Contracts

**Key Features**:
- Browser-based wallet operations
- Web Crypto API encryption
- Google OAuth popup flow
- Sign in with Apple (JS)
- Google Drive REST API
- CloudKit JS (iCloud)
- React provider + hooks
- Vue 3 plugin + composables
- Vanilla JS support

**Framework Support**:
```typescript
// React
import { CavosProvider, useCavosWallet } from '@cavos/web-sdk/react';

// Vue 3
import { useCavosWallet } from '@cavos/web-sdk/vue';

// Vanilla JS
import { CavosWalletSDK } from '@cavos/web-sdk';
```

**Bundle Size**: <80KB (gzipped)

---

### 📱 [Component 3B - Mobile SDK](./03B-MOBILE-SDK.md)
Native SDK for iOS (Swift) and Android (Kotlin) with React Native bindings.

**Timeline**: 4 weeks (Weeks 8-11)
**Tech Stack**: Swift, Kotlin, React Native
**Dependencies**: Backend API, Smart Contracts

**Platform Support**:
- **iOS**: Swift 5.9+, iOS 15+, Face ID/Touch ID
- **Android**: Kotlin 1.9+, Android 8+ (API 26), BiometricPrompt
- **React Native**: >=0.72.0

**Key Features**:
- Native biometric authentication
- Native cloud storage (iCloud, Google Drive)
- Platform-specific crypto (CryptoKit, Keystore)
- Sign in with Apple (native)
- Google Sign-In (native)
- React Native hooks
- Secure keychain storage

**Usage**:
```swift
// iOS Native
let sdk = CavosSDK(config: config)
await sdk.login()
await sdk.executeTransaction(call)
```

```kotlin
// Android Native
val sdk = CavosSDK(context, config)
sdk.login(activity)
sdk.executeTransaction(activity, call)
```

```typescript
// React Native
const sdk = new CavosSDK({ appId: 'app_123' });
await sdk.login();
await sdk.executeTransaction(call);
```

**App Size**: <5MB (iOS), <3MB (Android)

---

### 📖 [04 - Implementation Guide](./04-IMPLEMENTATION-GUIDE.md)
Step-by-step guide for implementing the entire system.

**Includes**:
- Development environment setup
- Week-by-week implementation plan
- Code examples and commands
- Common issues and solutions
- Testing strategies
- Deployment instructions
- Monitoring setup

**Use this** as your day-to-day implementation reference.

---

## 🗂️ Component Summary

| Component | Tech | Timeline | Lines of Code (est.) | Test Coverage |
|-----------|------|----------|---------------------|---------------|
| 1. Smart Contracts | Cairo | 3 weeks | ~1,500 | >90% |
| 2. Backend API | TypeScript/Node | 4 weeks | ~3,000 | >80% |
| 3A. Web SDK | TypeScript | 3 weeks | ~3,500 | >85% |
| 3B. Mobile SDK | Swift/Kotlin/RN | 4 weeks | ~5,000 | >85% |
| **Total** | - | **14 weeks*** | **~13,000** | **>85%** |

*Web and Mobile SDKs can be developed in parallel after week 7

## 🎯 Quick Start

1. **Review Architecture** → Read `00-ARCHITECTURE-OVERVIEW.md`
2. **Choose Component** → Pick where to start (recommended: Backend API)
3. **Read Component Spec** → Study detailed specification
4. **Follow Implementation Guide** → Execute week-by-week plan
5. **Test & Deploy** → Follow testing and deployment procedures

## 📋 Project Phases

### Phase 1: Backend API (Weeks 1-4)
Set up database, implement OAuth flows, create org/app management.

**Start with**: `02-BACKEND-API.md`

### Phase 2: Smart Contracts (Weeks 5-7)
Develop session wallet contract, policy enforcer, and factory.

**Start with**: `01-SMART-CONTRACTS.md`

### Phase 3A: Web SDK (Weeks 5-7)
Build browser SDK with React/Vue support.

**Start with**: `03A-WEB-SDK.md`
**Can run in parallel with**: Smart Contracts

### Phase 3B: Mobile SDK (Weeks 8-11)
Build native iOS/Android SDK with React Native bindings.

**Start with**: `03B-MOBILE-SDK.md`
**Can run in parallel with**: Web SDK integration testing

### Phase 4: Integration & Testing (Weeks 12-13)
End-to-end testing, security audit, performance optimization.

**Refer to**: `04-IMPLEMENTATION-GUIDE.md`

### Phase 5: Launch (Week 14)
Documentation, example apps, production deployment, monitoring.

**Refer to**: `04-IMPLEMENTATION-GUIDE.md`

## 🔐 Security Highlights

### Zero Backend Trust
- Backend never has access to private keys
- Master keys only exist briefly in client memory
- Session keys have time + spending limits

### Encrypted Cloud Storage
- AES-256-GCM encryption
- PBKDF2 key derivation (100k iterations)
- Keys derived from userId + email

### On-Chain Policy Enforcement
- Spending limits enforced by smart contract
- Contract whitelist validation
- Session expiration (24 hours)

### Defense in Depth
| Attack Vector | Mitigation |
|---------------|------------|
| Backend compromise | No private keys stored |
| Cloud storage breach | Strong encryption (AES-256) |
| Device compromise | Session keys only (limited damage) |
| Contract exploit | Policy limits + time restrictions |

## 🧪 Testing Strategy

### Unit Tests
- Backend: Jest + Supertest (>80%)
- Contracts: Scarb test (>90%)
- SDK: Vitest (>85%)

### Integration Tests
- Component interactions
- OAuth flows
- Cloud storage operations
- Contract deployments

### E2E Tests
- Complete user journeys
- Multi-device scenarios
- Session expiry handling
- Error recovery

### Security Tests
- OWASP Top 10
- Contract exploit attempts
- Cryptography validation
- OAuth security

## 📊 Success Metrics

### Performance
- **API Response Time**: <100ms (p95)
- **SDK Login Flow**: <3s
- **Transaction Signing**: <1s
- **Contract Gas**: <500k (session creation)

### Reliability
- **API Uptime**: 99.9%
- **Test Coverage**: >85%
- **Security Audit**: Zero critical findings

### User Experience
- **Login**: Social auth only (no seed phrases)
- **Transactions**: Gasless via AVNU
- **Multi-device**: Cloud sync enabled
- **Coverage**: Google + Apple = 95%+ users

## 🚀 Deployment Checklist

### Backend API
- [ ] PostgreSQL configured
- [ ] Environment variables set
- [ ] OAuth credentials configured
- [ ] SSL certificates installed
- [ ] Load balancer configured
- [ ] Monitoring enabled (Sentry, DataDog)
- [ ] Rate limiting configured
- [ ] Backup strategy implemented

### Smart Contracts
- [ ] Contracts audited
- [ ] Testnet deployment successful
- [ ] Gas optimizations applied
- [ ] Factory contract deployed
- [ ] Class hashes declared
- [ ] Events indexed
- [ ] Mainnet deployment executed

### Client SDK
- [ ] NPM package published
- [ ] CDN distribution configured
- [ ] Documentation site live
- [ ] Example apps deployed
- [ ] Error tracking enabled
- [ ] Analytics configured

## 📞 Support

### Documentation
- **StarkNet**: https://docs.starknet.io
- **Google Drive API**: https://developers.google.com/drive
- **Apple CloudKit**: https://developer.apple.com/cloudkit
- **Prisma**: https://www.prisma.io/docs

### Community
- GitHub Issues: Report bugs and request features
- Discord: Join StarkNet community
- Twitter: @CavosWallet (coming soon)

### Security
- **Security Issues**: security@cavos.io
- **Bug Bounty**: Coming soon

## 📝 Additional Resources

### In this directory:
- `FINAL-SIMPLIFIED-SPEC.md` - Original consolidated specification
- `CAVOS-WALLET-SPECIFICATION.tex` - LaTeX academic specification

### Example Code:
- React integration example (in Web SDK spec)
- Vue 3 integration example (in Web SDK spec)
- React Native example (in Mobile SDK spec)
- iOS native example (in Mobile SDK spec)
- Android native example (in Mobile SDK spec)
- Smart contract examples (in Contracts spec)

## 🎓 Learning Path

If you're new to the stack:

**Backend & Contracts**:
1. **Cairo/StarkNet**: https://book.cairo-lang.org/
2. **TypeScript**: https://www.typescriptlang.org/docs/
3. **Prisma**: https://www.prisma.io/docs/getting-started
4. **OAuth 2.0**: https://oauth.net/2/

**Web SDK**:
5. **Web Crypto API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
6. **React**: https://react.dev/learn
7. **Vue 3**: https://vuejs.org/guide/introduction.html

**Mobile SDK**:
8. **Swift**: https://docs.swift.org/swift-book/
9. **Kotlin**: https://kotlinlang.org/docs/getting-started.html
10. **React Native**: https://reactnative.dev/docs/getting-started

## 🏁 Get Started

```bash
# 1. Clone the repository
git clone <repo-url>

# 2. Choose a component to start with (recommended: Backend API)
cd components

# 3. Read the architecture overview
cat 00-ARCHITECTURE-OVERVIEW.md

# 4. Read your chosen component spec
cat 02-BACKEND-API.md  # or 01-SMART-CONTRACTS.md or 03A-WEB-SDK.md or 03B-MOBILE-SDK.md

# 5. Follow the implementation guide
cat 04-IMPLEMENTATION-GUIDE.md

# 6. Start coding! 🚀
```

---

**Ready to build?** Start with [Architecture Overview](./00-ARCHITECTURE-OVERVIEW.md) →
