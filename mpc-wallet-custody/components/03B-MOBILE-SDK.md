# Component 3B: Cavos Mobile SDK (Native + React Native)

## Overview
Native mobile SDK for iOS and Android with React Native bindings, featuring native OAuth, biometric authentication, and platform-specific cloud storage.

## Timeline
**Duration**: 4 weeks (Weeks 8-11)

**Dependencies**: Backend API, Smart Contracts, Web SDK (for shared crypto logic)

## Platform Support

```yaml
ios:
  language: Swift 5.9+
  min_version: iOS 15.0+
  storage: iCloud CloudKit (native)
  auth: Sign in with Apple (native)
  crypto: CryptoKit
  biometrics: Face ID / Touch ID

android:
  language: Kotlin 1.9+
  min_version: Android 8.0+ (API 26)
  storage: Google Drive (native SDK)
  auth: Google Sign-In (native)
  crypto: Android Keystore
  biometrics: BiometricPrompt

react_native:
  version: ">=0.72.0"
  bridges: Swift/Kotlin native modules
  typescript: Yes
```

## Project Structure

```
cavos-mobile-sdk/
├── ios/
│   ├── CavosWalletSDK/
│   │   ├── Core/
│   │   │   ├── CavosSDK.swift               # Main SDK class
│   │   │   ├── WalletManager.swift
│   │   │   └── SessionManager.swift
│   │   ├── Crypto/
│   │   │   ├── Encryption.swift             # CryptoKit wrapper
│   │   │   └── KeyDerivation.swift
│   │   ├── Storage/
│   │   │   └── iCloudStorage.swift          # CloudKit native
│   │   ├── Auth/
│   │   │   └── AppleAuth.swift              # Sign in with Apple
│   │   ├── Biometrics/
│   │   │   └── BiometricAuth.swift          # Face ID / Touch ID
│   │   └── StarkNet/
│   │       └── StarkNetClient.swift
│   ├── CavosWalletSDK.xcodeproj
│   └── Tests/
│
├── android/
│   └── cavos-wallet-sdk/
│       ├── src/main/java/io/cavos/sdk/
│       │   ├── CavosSDK.kt                  # Main SDK class
│       │   ├── core/
│       │   │   ├── WalletManager.kt
│       │   │   └── SessionManager.kt
│       │   ├── crypto/
│       │   │   ├── Encryption.kt            # Android Keystore
│       │   │   └── KeyDerivation.kt
│       │   ├── storage/
│       │   │   └── GoogleDriveStorage.kt    # Drive API native
│       │   ├── auth/
│       │   │   └── GoogleAuth.kt            # Google Sign-In
│       │   ├── biometrics/
│       │   │   └── BiometricAuth.kt         # BiometricPrompt
│       │   └── starknet/
│       │       └── StarkNetClient.kt
│       └── src/test/
│
├── react-native/
│   ├── src/
│   │   ├── index.ts                         # Main export
│   │   ├── CavosSDK.ts                      # JS wrapper
│   │   ├── NativeModules.ts                 # Native bridges
│   │   ├── hooks/
│   │   │   ├── useCavosWallet.ts
│   │   │   └── useCavosBiometrics.ts
│   │   └── types/
│   │       └── index.ts
│   ├── ios/
│   │   └── CavosSDKBridge.swift             # Swift → JS bridge
│   ├── android/
│   │   └── CavosSDKBridge.kt                # Kotlin → JS bridge
│   └── example/
│       └── CavosDemoApp/
│
├── examples/
│   ├── ios-native/
│   ├── android-native/
│   └── react-native-app/
│
└── docs/
    ├── ios-setup.md
    ├── android-setup.md
    └── react-native-setup.md
```

## iOS Implementation

### Main SDK Class (Swift)

```swift
// ios/CavosWalletSDK/Core/CavosSDK.swift
import Foundation
import CryptoKit
import AuthenticationServices
import CloudKit

@available(iOS 15.0, *)
public class CavosSDK {
    private let config: CavosConfig
    private var sessionKey: String?
    private var sessionExpiry: Date?
    private var walletAddress: String?

    private let walletManager: WalletManager
    private let sessionManager: SessionManager
    private let storage: iCloudStorage
    private let biometrics: BiometricAuth

    public init(config: CavosConfig) {
        self.config = config
        self.walletManager = WalletManager()
        self.sessionManager = SessionManager()
        self.storage = iCloudStorage()
        self.biometrics = BiometricAuth()
    }

    /// Login with Sign in with Apple
    public func login() async throws {
        // 1. Biometric authentication
        guard try await biometrics.authenticate(
            reason: "Sign in to Cavos Wallet"
        ) else {
            throw CavosError.biometricAuthFailed
        }

        // 2. Sign in with Apple
        let appleIDCredential = try await authenticateWithApple()

        // 3. Exchange with backend
        let authResult = try await exchangeAppleToken(
            userID: appleIDCredential.user,
            identityToken: appleIDCredential.identityToken
        )

        // 4. Check iCloud for wallet
        let filename = "app_\(config.appId)_cavos_wallet"

        if let encryptedWallet = try await storage.downloadFile(
            filename: filename
        ) {
            // Load existing wallet
            try await loadWallet(
                encrypted: encryptedWallet,
                userID: appleIDCredential.user,
                email: authResult.email
            )
        } else {
            // Create new wallet
            try await createWallet(
                userID: appleIDCredential.user,
                email: authResult.email,
                filename: filename
            )
        }
    }

    /// Execute transaction with session key
    public func executeTransaction(
        call: StarkNetCall
    ) async throws -> String {
        // Require biometric auth for transactions
        guard try await biometrics.authenticate(
            reason: "Confirm transaction"
        ) else {
            throw CavosError.biometricAuthFailed
        }

        // Check session validity
        guard let sessionKey = sessionKey,
              let expiry = sessionExpiry,
              Date() < expiry else {
            throw CavosError.sessionExpired
        }

        // Execute with session key
        return try await sessionManager.executeWithSession(
            sessionKey: sessionKey,
            walletAddress: walletAddress!,
            call: call
        )
    }

    /// Get wallet balance
    public func getBalance(
        tokenAddress: String? = nil
    ) async throws -> String {
        guard let address = walletAddress else {
            throw CavosError.noWallet
        }

        let token = tokenAddress ?? Constants.ETH_TOKEN
        return try await starkNetClient.getBalance(
            wallet: address,
            token: token
        )
    }

    /// Check if session is active
    public var isSessionActive: Bool {
        guard let expiry = sessionExpiry else {
            return false
        }
        return Date() < expiry
    }

    /// Logout
    public func logout() {
        // Clear session key from Keychain
        if let sessionKey = sessionKey {
            KeychainHelper.delete(key: "cavos_session_key")
        }

        sessionKey = nil
        sessionExpiry = nil
        walletAddress = nil
    }

    // MARK: - Private Methods

    private func authenticateWithApple() async throws -> ASAuthorizationAppleIDCredential {
        return try await withCheckedThrowingContinuation { continuation in
            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.fullName, .email]

            let controller = ASAuthorizationController(
                authorizationRequests: [request]
            )

            // Delegate handles success/failure
            controller.performRequests()
        }
    }

    private func createWallet(
        userID: String,
        email: String,
        filename: String
    ) async throws {
        // 1. Generate wallet
        let wallet = try walletManager.generateWallet()

        // 2. Deploy wallet contract
        walletAddress = try await walletManager.deployWallet(
            publicKey: wallet.publicKey
        )

        // 3. Create session keys
        let session = try await sessionManager.createSession(
            masterKey: wallet.privateKey,
            walletAddress: walletAddress!
        )

        sessionKey = session.privateKey
        sessionExpiry = session.expiresAt

        // 4. Encrypt master key
        let encrypted = try await walletManager.encryptWallet(
            privateKey: wallet.privateKey,
            userID: userID,
            email: email
        )

        // 5. Upload to iCloud
        try await storage.uploadFile(
            filename: filename,
            content: encrypted
        )

        // 6. Register with backend
        try await registerWallet(
            address: walletAddress!,
            publicKey: wallet.publicKey,
            userID: userID,
            email: email
        )

        // 7. DESTROY master key
        walletManager.secureClear(wallet.privateKey)
    }

    private func loadWallet(
        encrypted: String,
        userID: String,
        email: String
    ) async throws {
        // 1. Decrypt master key
        let masterKey = try await walletManager.decryptWallet(
            encrypted: encrypted,
            userID: userID,
            email: email
        )

        // 2. Get wallet address from backend
        walletAddress = try await fetchWalletAddress(
            userID: userID
        )

        // 3. Create new session
        let session = try await sessionManager.createSession(
            masterKey: masterKey,
            walletAddress: walletAddress!
        )

        sessionKey = session.privateKey
        sessionExpiry = session.expiresAt

        // 4. DESTROY master key
        walletManager.secureClear(masterKey)
    }
}
```

### Biometric Authentication (Swift)

```swift
// ios/CavosWalletSDK/Biometrics/BiometricAuth.swift
import LocalAuthentication

public class BiometricAuth {
    private let context = LAContext()

    public func canAuthenticate() -> Bool {
        var error: NSError?
        return context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        )
    }

    public func authenticate(reason: String) async throws -> Bool {
        guard canAuthenticate() else {
            throw CavosError.biometricsNotAvailable
        }

        return try await context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: reason
        )
    }

    public var biometricType: BiometricType {
        switch context.biometryType {
        case .faceID:
            return .faceID
        case .touchID:
            return .touchID
        default:
            return .none
        }
    }
}

public enum BiometricType {
    case faceID
    case touchID
    case none
}
```

### iCloud Storage (Swift)

```swift
// ios/CavosWalletSDK/Storage/iCloudStorage.swift
import CloudKit

public class iCloudStorage {
    private let container = CKContainer(
        identifier: "iCloud.io.cavos.wallet"
    )
    private let database: CKDatabase

    public init() {
        self.database = container.privateCloudDatabase
    }

    public func uploadFile(
        filename: String,
        content: String
    ) async throws {
        let record = CKRecord(
            recordType: "WalletFile",
            recordID: CKRecord.ID(recordName: filename)
        )
        record["filename"] = filename
        record["content"] = content
        record["updatedAt"] = Date()

        _ = try await database.save(record)
    }

    public func downloadFile(
        filename: String
    ) async throws -> String? {
        let recordID = CKRecord.ID(recordName: filename)

        do {
            let record = try await database.record(for: recordID)
            return record["content"] as? String
        } catch {
            // File not found
            return nil
        }
    }

    public func deleteFile(filename: String) async throws {
        let recordID = CKRecord.ID(recordName: filename)
        _ = try await database.deleteRecord(withID: recordID)
    }
}
```

### Encryption (Swift)

```swift
// ios/CavosWalletSDK/Crypto/Encryption.swift
import CryptoKit
import Foundation

public class Encryption {
    /// Derive encryption key using PBKDF2
    public static func deriveKey(
        from userID: String,
        email: String
    ) throws -> SymmetricKey {
        let salt = Data((userID + email).utf8)

        let inputKeyMaterial = SymmetricKey(
            data: Data(userID.utf8)
        )

        let derivedKey = HKDF<SHA256>.deriveKey(
            inputKeyMaterial: inputKeyMaterial,
            salt: salt,
            info: Data("cavos-wallet".utf8),
            outputByteCount: 32
        )

        return derivedKey
    }

    /// Encrypt using AES-256-GCM
    public static func encrypt(
        plaintext: String,
        key: SymmetricKey
    ) throws -> String {
        let data = Data(plaintext.utf8)
        let sealedBox = try AES.GCM.seal(data, using: key)

        // Combine nonce + ciphertext + tag
        guard let combined = sealedBox.combined else {
            throw CavosError.encryptionFailed
        }

        return combined.base64EncodedString()
    }

    /// Decrypt using AES-256-GCM
    public static func decrypt(
        ciphertext: String,
        key: SymmetricKey
    ) throws -> String {
        guard let combined = Data(base64Encoded: ciphertext) else {
            throw CavosError.invalidCiphertext
        }

        let sealedBox = try AES.GCM.SealedBox(combined: combined)
        let decrypted = try AES.GCM.open(sealedBox, using: key)

        guard let plaintext = String(data: decrypted, encoding: .utf8) else {
            throw CavosError.decryptionFailed
        }

        return plaintext
    }
}
```

## Android Implementation

### Main SDK Class (Kotlin)

```kotlin
// android/cavos-wallet-sdk/src/main/java/io/cavos/sdk/CavosSDK.kt
package io.cavos.sdk

import android.content.Context
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class CavosSDK(
    private val context: Context,
    private val config: CavosConfig
) {
    private var sessionKey: String? = null
    private var sessionExpiry: Long? = null
    private var walletAddress: String? = null

    private val walletManager = WalletManager()
    private val sessionManager = SessionManager()
    private val storage = GoogleDriveStorage(context)
    private val biometrics = BiometricAuth(context)

    /**
     * Login with Google
     */
    suspend fun login(activity: FragmentActivity) {
        // 1. Biometric authentication
        if (!biometrics.authenticate(
            activity,
            title = "Sign in to Cavos Wallet",
            subtitle = "Authenticate to continue"
        )) {
            throw CavosException("Biometric authentication failed")
        }

        // 2. Google Sign In
        val googleAccount = authenticateWithGoogle(activity)

        // 3. Exchange with backend
        val authResult = exchangeGoogleToken(
            idToken = googleAccount.idToken!!,
            appId = config.appId
        )

        // 4. Initialize Drive storage
        storage.initialize(googleAccount.account!!)

        // 5. Check Drive for wallet
        val filename = "app_${config.appId}_cavos_wallet"

        val encryptedWallet = storage.downloadFile(filename)

        if (encryptedWallet != null) {
            // Load existing wallet
            loadWallet(
                encrypted = encryptedWallet,
                userID = googleAccount.id!!,
                email = googleAccount.email!!
            )
        } else {
            // Create new wallet
            createWallet(
                userID = googleAccount.id!!,
                email = googleAccount.email!!,
                filename = filename
            )
        }
    }

    /**
     * Execute transaction with session key
     */
    suspend fun executeTransaction(
        activity: FragmentActivity,
        call: StarkNetCall
    ): String {
        // Require biometric for transactions
        if (!biometrics.authenticate(
            activity,
            title = "Confirm Transaction",
            subtitle = "Authenticate to execute transaction"
        )) {
            throw CavosException("Biometric authentication required")
        }

        // Check session validity
        val key = sessionKey ?: throw CavosException("No session")
        val expiry = sessionExpiry ?: throw CavosException("No session")

        if (System.currentTimeMillis() > expiry) {
            throw CavosException("Session expired")
        }

        // Execute
        return sessionManager.executeWithSession(
            sessionKey = key,
            walletAddress = walletAddress!!,
            call = call
        )
    }

    /**
     * Get wallet balance
     */
    suspend fun getBalance(tokenAddress: String? = null): String {
        val address = walletAddress
            ?: throw CavosException("No wallet loaded")

        val token = tokenAddress ?: Constants.ETH_TOKEN
        return starkNetClient.getBalance(address, token)
    }

    /**
     * Check if session is active
     */
    val isSessionActive: Boolean
        get() {
            val expiry = sessionExpiry ?: return false
            return System.currentTimeMillis() < expiry
        }

    /**
     * Logout
     */
    fun logout() {
        sessionKey?.let { SecureStorage.delete(context, "session_key") }
        sessionKey = null
        sessionExpiry = null
        walletAddress = null
    }

    // Private methods...
}
```

### Biometric Authentication (Kotlin)

```kotlin
// android/cavos-wallet-sdk/src/main/java/io/cavos/sdk/biometrics/BiometricAuth.kt
package io.cavos.sdk.biometrics

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

class BiometricAuth(private val context: Context) {

    fun canAuthenticate(): Boolean {
        val biometricManager = BiometricManager.from(context)
        return biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG
        ) == BiometricManager.BIOMETRIC_SUCCESS
    }

    suspend fun authenticate(
        activity: FragmentActivity,
        title: String,
        subtitle: String
    ): Boolean = suspendCoroutine { continuation ->

        val executor = ContextCompat.getMainExecutor(context)

        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(
                result: BiometricPrompt.AuthenticationResult
            ) {
                continuation.resume(true)
            }

            override fun onAuthenticationFailed() {
                continuation.resume(false)
            }

            override fun onAuthenticationError(
                errorCode: Int,
                errString: CharSequence
            ) {
                continuation.resume(false)
            }
        }

        val prompt = BiometricPrompt(activity, executor, callback)

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setNegativeButtonText("Cancel")
            .build()

        prompt.authenticate(promptInfo)
    }
}
```

### Google Drive Storage (Kotlin)

```kotlin
// android/cavos-wallet-sdk/src/main/java/io/cavos/sdk/storage/GoogleDriveStorage.kt
package io.cavos.sdk.storage

import android.content.Context
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential
import com.google.api.client.http.ByteArrayContent
import com.google.api.services.drive.Drive
import com.google.api.services.drive.DriveScopes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream

class GoogleDriveStorage(private val context: Context) {
    private lateinit var driveService: Drive

    fun initialize(account: GoogleSignInAccount) {
        val credential = GoogleAccountCredential.usingOAuth2(
            context,
            listOf(DriveScopes.DRIVE_APPDATA)
        )
        credential.selectedAccount = account.account

        driveService = Drive.Builder(
            AndroidHttp.newCompatibleTransport(),
            GsonFactory.getDefaultInstance(),
            credential
        )
            .setApplicationName("Cavos Wallet")
            .build()
    }

    suspend fun uploadFile(
        filename: String,
        content: String
    ) = withContext(Dispatchers.IO) {
        val existing = findFile(filename)

        if (existing != null) {
            updateFile(existing.id, content)
        } else {
            createFile(filename, content)
        }
    }

    suspend fun downloadFile(
        filename: String
    ): String? = withContext(Dispatchers.IO) {
        val file = findFile(filename) ?: return@withContext null

        val outputStream = ByteArrayOutputStream()
        driveService.files()
            .get(file.id)
            .executeMediaAndDownloadTo(outputStream)

        outputStream.toString("UTF-8")
    }

    private fun findFile(filename: String): com.google.api.services.drive.model.File? {
        val result = driveService.files()
            .list()
            .setSpaces("appDataFolder")
            .setQ("name='$filename'")
            .setFields("files(id, name)")
            .execute()

        return result.files.firstOrNull()
    }

    private fun createFile(filename: String, content: String) {
        val metadata = com.google.api.services.drive.model.File()
            .setName(filename)
            .setParents(listOf("appDataFolder"))

        val contentStream = ByteArrayContent.fromString(
            "text/plain",
            content
        )

        driveService.files()
            .create(metadata, contentStream)
            .execute()
    }

    private fun updateFile(fileId: String, content: String) {
        val contentStream = ByteArrayContent.fromString(
            "text/plain",
            content
        )

        driveService.files()
            .update(fileId, null, contentStream)
            .execute()
    }
}
```

## React Native Bridge

### TypeScript Interface

```typescript
// react-native/src/index.ts
import { NativeModules, NativeEventEmitter } from 'react-native';

const { CavosSDKModule } = NativeModules;
const cavosEmitter = new NativeEventEmitter(CavosSDKModule);

export interface CavosConfig {
  appId: string;
  backendUrl?: string;
  starknetRpcUrl?: string;
  network?: 'mainnet' | 'sepolia';
}

export interface StarkNetCall {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export class CavosSDK {
  constructor(config: CavosConfig) {
    CavosSDKModule.initialize(config);
  }

  async login(): Promise<void> {
    return CavosSDKModule.login();
  }

  async executeTransaction(call: StarkNetCall): Promise<string> {
    return CavosSDKModule.executeTransaction(call);
  }

  async getBalance(tokenAddress?: string): Promise<string> {
    return CavosSDKModule.getBalance(tokenAddress);
  }

  async getAddress(): Promise<string | null> {
    return CavosSDKModule.getAddress();
  }

  async isSessionActive(): Promise<boolean> {
    return CavosSDKModule.isSessionActive();
  }

  async logout(): Promise<void> {
    return CavosSDKModule.logout();
  }

  // Event listeners
  onSessionExpired(callback: () => void): () => void {
    const subscription = cavosEmitter.addListener(
      'SessionExpired',
      callback
    );
    return () => subscription.remove();
  }
}
```

### React Native Hook

```typescript
// react-native/src/hooks/useCavosWallet.ts
import { useState, useEffect, useCallback } from 'react';
import { CavosSDK, StarkNetCall } from '../index';

export function useCavosWallet(sdk: CavosSDK) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSession();

    // Listen for session expiry
    const unsubscribe = sdk.onSessionExpired(() => {
      setIsConnected(false);
      setAddress(null);
    });

    return unsubscribe;
  }, [sdk]);

  const checkSession = async () => {
    const active = await sdk.isSessionActive();
    if (active) {
      const addr = await sdk.getAddress();
      setAddress(addr);
      setIsConnected(true);
    }
  };

  const login = useCallback(async () => {
    setLoading(true);
    try {
      await sdk.login();
      const addr = await sdk.getAddress();
      setAddress(addr);
      setIsConnected(true);
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  const executeTransaction = useCallback(async (call: StarkNetCall) => {
    setLoading(true);
    try {
      const txHash = await sdk.executeTransaction(call);
      return txHash;
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  const fetchBalance = useCallback(async (token?: string) => {
    setLoading(true);
    try {
      const bal = await sdk.getBalance(token);
      setBalance(bal);
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  const logout = useCallback(async () => {
    await sdk.logout();
    setIsConnected(false);
    setAddress(null);
    setBalance('0');
  }, [sdk]);

  return {
    address,
    balance,
    isConnected,
    loading,
    login,
    logout,
    executeTransaction,
    fetchBalance
  };
}
```

### React Native Example

```typescript
// examples/react-native-app/App.tsx
import React from 'react';
import { View, Button, Text } from 'react-native';
import { CavosSDK } from '@cavos/mobile-sdk';
import { useCavosWallet } from '@cavos/mobile-sdk/hooks';

const sdk = new CavosSDK({
  appId: 'app_your_app_id'
});

export default function App() {
  const {
    address,
    balance,
    isConnected,
    loading,
    login,
    logout,
    executeTransaction,
    fetchBalance
  } = useCavosWallet(sdk);

  const handleSwap = async () => {
    const txHash = await executeTransaction({
      contractAddress: AVNU_ROUTER,
      entrypoint: 'swap',
      calldata: ['ETH', 'USDC', '1000000000000000000']
    });
    console.log('Transaction:', txHash);
  };

  if (!isConnected) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <Button
          title="Sign in with Biometrics"
          onPress={login}
          disabled={loading}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Address: {address}</Text>
      <Text>Balance: {balance} ETH</Text>
      <Button title="Refresh Balance" onPress={fetchBalance} />
      <Button title="Swap 1 ETH to USDC" onPress={handleSwap} />
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

## Platform-Specific Features

### iOS: Face ID / Touch ID
```swift
// Always require biometrics for sensitive operations
let authenticated = try await biometrics.authenticate(
    reason: "Confirm transaction"
)
```

### Android: BiometricPrompt
```kotlin
// Biometric auth for transactions
val authenticated = biometrics.authenticate(
    activity,
    title = "Confirm Transaction",
    subtitle = "Use fingerprint or face"
)
```

### iOS: iCloud Sync
```swift
// Automatic sync across iOS devices
let storage = iCloudStorage()
await storage.uploadFile(filename, content)
```

### Android: Google Drive
```kotlin
// Cross-platform sync via Drive
val storage = GoogleDriveStorage(context)
storage.uploadFile(filename, content)
```

## Deliverables

### iOS
- [ ] Swift SDK implementation
- [ ] Sign in with Apple integration
- [ ] iCloud CloudKit storage
- [ ] Face ID / Touch ID support
- [ ] CryptoKit encryption
- [ ] XCFramework distribution
- [ ] CocoaPods spec
- [ ] Example app

### Android
- [ ] Kotlin SDK implementation
- [ ] Google Sign-In integration
- [ ] Google Drive storage
- [ ] BiometricPrompt support
- [ ] Android Keystore encryption
- [ ] AAR library
- [ ] Maven publication
- [ ] Example app

### React Native
- [ ] TypeScript bindings
- [ ] Native module bridges
- [ ] React hooks
- [ ] NPM package
- [ ] Example app
- [ ] Documentation

## Success Metrics

- **App Size**: <5MB (iOS), <3MB (Android)
- **Performance**: Login flow <3s, Transaction <2s
- **Platform Support**: iOS 15+, Android 8+
- **Test Coverage**: >85%
- **Biometric Support**: Face ID, Touch ID, Fingerprint, Face Unlock
