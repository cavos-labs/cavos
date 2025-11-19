# Cavos Wallet - Project Summary

## Overview

Cavos is a non-custodial cryptocurrency wallet solution for StarkNet with cloud-backed session key architecture. The system is divided into **4 main components**:

1. **Smart Contracts** (Cairo/StarkNet)
2. **Backend API** (Node.js/TypeScript)
3. **Web SDK** (TypeScript for browsers)
4. **Mobile SDK** (Swift/Kotlin/React Native)

## Component Breakdown

### 1. Smart Contracts
**File**: `01-SMART-CONTRACTS.md`

**What it does**: On-chain session wallet with policy enforcement

**Key deliverables**:
- Session wallet contract (Cairo)
- Account factory contract
- Policy enforcer logic
- 90%+ test coverage
- Mainnet deployment

**Timeline**: 3 weeks

---

### 2. Backend API
**File**: `02-BACKEND-API.md`

**What it does**: OAuth orchestration and metadata storage (NO private keys)

**Key deliverables**:
- Organization/app management
- Google OAuth integration
- Apple OAuth integration
- Wallet address registry
- PostgreSQL database (3 tables only)
- 80%+ test coverage

**Timeline**: 4 weeks

---

### 3A. Web SDK
**File**: `03A-WEB-SDK.md`

**What it does**: Browser-based wallet SDK with framework support

**Platforms**:
- React 18+ (Provider + Hooks)
- Vue 3+ (Plugin + Composables)
- Vanilla JavaScript (ES2020+)

**Key features**:
- Web Crypto API encryption
- Google OAuth popup flow
- Sign in with Apple (JS)
- Google Drive REST API
- CloudKit JS (iCloud)
- Session key management
- Transaction signing

**Bundle size**: <80KB (gzipped)

**Timeline**: 3 weeks

---

### 3B. Mobile SDK
**File**: `03B-MOBILE-SDK.md`

**What it does**: Native mobile SDK with biometric authentication

**Platforms**:
- **iOS**: Swift 5.9+, iOS 15+
  - Sign in with Apple (native)
  - iCloud CloudKit (native)
  - CryptoKit
  - Face ID / Touch ID

- **Android**: Kotlin 1.9+, API 26+
  - Google Sign-In (native)
  - Google Drive SDK (native)
  - Android Keystore
  - BiometricPrompt

- **React Native**: >=0.72.0
  - Native module bridges
  - TypeScript bindings
  - React hooks

**App size**: <5MB (iOS), <3MB (Android)

**Timeline**: 4 weeks

---

## Why Two Separate SDKs?

### Different Capabilities

| Feature | Web SDK | Mobile SDK |
|---------|---------|------------|
| **OAuth** | Popup flow | Native SDK |
| **Crypto** | Web Crypto API | CryptoKit/Keystore |
| **Storage** | REST APIs | Native SDKs |
| **Auth** | Browser-based | Biometric (Face ID, Fingerprint) |
| **Frameworks** | React, Vue, Vanilla | iOS, Android, React Native |
| **Bundle/App Size** | <80KB | <5MB |

### Different User Experiences

**Web**:
- Quick integration for web apps
- No app store required
- Works across all desktop browsers
- Instant updates via CDN

**Mobile**:
- Native biometric authentication
- Better offline support
- Native cloud storage APIs
- Platform-specific optimizations
- App store distribution

### Better Developer Experience

**Web developers** get:
- Familiar tools (npm, webpack, vite)
- Framework-specific integrations
- TypeScript throughout
- Browser devtools

**Mobile developers** get:
- Native language support (Swift/Kotlin)
- Platform-specific best practices
- XCFramework/AAR distribution
- React Native bindings for cross-platform

---

## Project Timeline

### Sequential Phases (14 weeks total)

```
Week 1-4:   Backend API
Week 5-7:   Smart Contracts + Web SDK (parallel)
Week 8-11:  Mobile SDK
Week 12-13: Integration & Testing
Week 14:    Launch
```

### Parallelization Opportunities

- **Weeks 5-7**: Smart Contracts and Web SDK can be developed simultaneously
- **Weeks 8-11**: Mobile SDK development while Web SDK enters testing/integration
- **Week 12-13**: Final integration testing for all components

---

## Deployment Packages

### NPM Packages

```bash
# Web SDK
npm install @cavos/web-sdk

# React integration
import { CavosProvider, useCavosWallet } from '@cavos/web-sdk/react';

# Vue integration
import { useCavosWallet } from '@cavos/web-sdk/vue';
```

### iOS Distribution

```ruby
# CocoaPods
pod 'CavosWalletSDK'

# Swift Package Manager
dependencies: [
    .package(url: "https://github.com/cavos/ios-sdk.git", from: "1.0.0")
]
```

### Android Distribution

```gradle
// build.gradle
dependencies {
    implementation 'io.cavos:wallet-sdk:1.0.0'
}
```

### React Native

```bash
npm install @cavos/mobile-sdk

# iOS
cd ios && pod install

# Android (auto-linked)
```

---

## Key Differences: Web vs Mobile

### Authentication Flow

**Web**:
```typescript
// OAuth popup flow
const sdk = new CavosWalletSDK({ appId: 'app_123' });
await sdk.login('google'); // Opens popup
```

**Mobile**:
```swift
// Native iOS
let sdk = CavosSDK(config: config)
await sdk.login() // Face ID → Sign in with Apple
```

```kotlin
// Native Android
val sdk = CavosSDK(context, config)
sdk.login(activity) // Fingerprint → Google Sign-In
```

### Cloud Storage

**Web**:
- Google Drive: REST API via `fetch()`
- iCloud: CloudKit JS (browser-based)

**Mobile**:
- iOS: CloudKit native framework
- Android: Google Drive Android SDK

### Security

**Web**:
- Web Crypto API for encryption
- Session storage in memory
- Clear on page refresh

**Mobile**:
- iOS: CryptoKit + Keychain
- Android: Android Keystore + EncryptedSharedPreferences
- Biometric-protected access
- Survives app restarts (session key only)

---

## File Structure

```
cavos-wallet/
├── contracts/              # Component 1: Smart Contracts
│   ├── src/
│   │   ├── session_wallet.cairo
│   │   └── account_factory.cairo
│   └── tests/
│
├── api/                    # Component 2: Backend API
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── prisma/
│   └── tests/
│
├── web-sdk/                # Component 3A: Web SDK
│   ├── src/
│   │   ├── CavosWalletSDK.ts
│   │   ├── react/
│   │   └── vue/
│   └── examples/
│       ├── react-app/
│       └── vue-app/
│
└── mobile-sdk/             # Component 3B: Mobile SDK
    ├── ios/
    │   └── CavosWalletSDK/
    ├── android/
    │   └── cavos-wallet-sdk/
    ├── react-native/
    │   └── src/
    └── examples/
        ├── ios-native/
        ├── android-native/
        └── react-native-app/
```

---

## Development Priorities

### Must Have (MVP)

- ✅ Backend API (org/app management, OAuth)
- ✅ Smart Contracts (session wallet, policies)
- ✅ Web SDK (React support only)
- ✅ Mobile SDK (iOS native only)

### Should Have (v1.0)

- ✅ Web SDK (Vue + vanilla JS support)
- ✅ Mobile SDK (Android native)
- ✅ Mobile SDK (React Native bindings)
- ✅ Example apps for all platforms

### Nice to Have (v1.1+)

- Additional frameworks (Angular, Svelte)
- Flutter SDK
- Desktop app (Electron/Tauri)
- Browser extension

---

## Security Model

All components share the same security model:

### Non-Custodial
- Backend never sees private keys
- Master keys destroyed after session creation
- Session keys have 24h validity + spending limits

### Cloud-Backed
- Google Drive (Web + Android)
- iCloud (Web + iOS)
- AES-256-GCM encryption
- PBKDF2 key derivation

### Biometric Protection (Mobile Only)
- iOS: Face ID / Touch ID required for transactions
- Android: BiometricPrompt required for transactions

### On-Chain Enforcement
- Session key policies enforced by smart contract
- Spending limits (per-tx, per-day)
- Contract whitelist
- Time-based expiration

---

## Testing Strategy

### Component Tests

| Component | Framework | Coverage Target |
|-----------|-----------|-----------------|
| Smart Contracts | Scarb test | >90% |
| Backend API | Jest | >80% |
| Web SDK | Vitest | >85% |
| Mobile SDK (iOS) | XCTest | >85% |
| Mobile SDK (Android) | JUnit | >85% |
| React Native | Jest | >85% |

### Integration Tests

- Web SDK ↔ Backend API
- Mobile SDK ↔ Backend API
- All SDKs ↔ Smart Contracts
- Cloud storage operations
- OAuth flows

### E2E Tests

- Web: Playwright
- iOS: XCUITest
- Android: Espresso
- React Native: Detox

---

## Success Metrics

### Performance

| Metric | Web SDK | Mobile SDK |
|--------|---------|------------|
| Login Flow | <3s | <3s |
| Transaction | <2s | <2s |
| Bundle/App Size | <80KB | <5MB |

### Coverage

- Global user reach: 95%+ (Google + Apple)
- Browser support: Chrome, Safari, Firefox, Edge (last 2 versions)
- Mobile support: iOS 15+, Android 8+

### Quality

- Zero critical security findings
- >85% test coverage (all components)
- API uptime: 99.9%

---

## Next Steps

1. ✅ Review architecture overview
2. ⬜ Choose starting component (recommend: Backend API)
3. ⬜ Read component specification
4. ⬜ Follow implementation guide
5. ⬜ Build MVP (Backend + Contracts + Web SDK React)
6. ⬜ Expand to full v1.0 (all platforms)

---

## Questions & Answers

**Q: Why not a single universal SDK?**
A: Web and mobile have fundamentally different capabilities (biometrics, native storage, crypto APIs). Separate SDKs provide better DX and smaller bundle sizes.

**Q: Can users switch between web and mobile?**
A: Yes! Same wallet file in cloud storage, accessible from both web and mobile apps.

**Q: Do I need to implement both SDKs?**
A: No. Start with your target platform (web or mobile) and add the other later if needed.

**Q: Which SDK should I start with?**
A: Depends on your product:
- **Web app**: Use Web SDK
- **Mobile app**: Use Mobile SDK (iOS or Android)
- **Both**: Start with Web SDK (faster to prototype), add Mobile SDK later

**Q: Can React Native use the Web SDK?**
A: No. React Native requires the Mobile SDK with native modules for biometrics and cloud storage.

---

## Documentation Map

- `00-ARCHITECTURE-OVERVIEW.md` - System architecture
- `01-SMART-CONTRACTS.md` - Cairo contracts
- `02-BACKEND-API.md` - Node.js API
- `03A-WEB-SDK.md` - Browser SDK
- `03B-MOBILE-SDK.md` - Native mobile SDK
- `04-IMPLEMENTATION-GUIDE.md` - Step-by-step guide
- `README.md` - Component index
- `SUMMARY.md` - This file

Start here → [Architecture Overview](./00-ARCHITECTURE-OVERVIEW.md)
