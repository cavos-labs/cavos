# Component 3: Client SDK (TypeScript)

## Overview
Client-side SDK handling wallet creation, encryption/decryption, cloud storage, session management, and transaction signing. Runs entirely in the browser/mobile app with zero backend trust.

## Timeline
**Duration**: 4 weeks (Weeks 5-8)

**Dependencies**:
- Backend API (for OAuth orchestration)
- Smart Contracts (for session registration)

## Tech Stack

```json
{
  "language": "TypeScript 5+",
  "crypto": "Web Crypto API",
  "starknet": "starknet.js",
  "build": "Vite + tsup",
  "testing": "vitest",
  "storage": {
    "google": "Google Drive API",
    "apple": "CloudKit JS"
  }
}
```

## Project Structure

```
sdk/
├── src/
│   ├── index.ts                          # Main export
│   ├── CavosWalletSDK.ts                 # Main SDK class
│   ├── crypto/
│   │   ├── encryption.ts                 # AES-256-GCM
│   │   ├── keyDerivation.ts              # PBKDF2
│   │   └── signatures.ts                 # StarkNet signatures
│   ├── storage/
│   │   ├── CloudStorageProvider.ts       # Abstract interface
│   │   ├── GoogleDriveStorage.ts         # Google implementation
│   │   ├── iCloudStorage.ts              # Apple implementation
│   │   └── StorageFactory.ts
│   ├── auth/
│   │   ├── OAuthProvider.ts              # Abstract interface
│   │   ├── GoogleOAuth.ts                # Google implementation
│   │   ├── AppleOAuth.ts                 # Apple implementation
│   │   └── AuthFactory.ts
│   ├── wallet/
│   │   ├── WalletManager.ts              # Wallet lifecycle
│   │   ├── SessionManager.ts             # Session key management
│   │   └── TransactionSigner.ts          # Sign transactions
│   ├── starknet/
│   │   ├── StarkNetClient.ts             # RPC client
│   │   ├── AccountContract.ts            # Account abstraction
│   │   └── SessionWalletContract.ts      # Session wallet interface
│   ├── api/
│   │   └── BackendClient.ts              # API communication
│   ├── types/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── wallet.ts
│   │   └── session.ts
│   └── utils/
│       ├── logger.ts
│       ├── errors.ts
│       └── memory.ts                     # Secure memory clearing
├── examples/
│   ├── react/
│   ├── vanilla/
│   └── mobile/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Core Classes

### 1. Main SDK Class

```typescript
// src/CavosWalletSDK.ts
import { Account, Provider, Contract, Call } from 'starknet';
import { CloudStorageProvider } from './storage/CloudStorageProvider';
import { OAuthProvider } from './auth/OAuthProvider';
import { WalletManager } from './wallet/WalletManager';
import { SessionManager } from './wallet/SessionManager';

export type SupportedProvider = 'google' | 'apple';

export interface CavosSDKConfig {
  appId: string;
  backendUrl?: string;
  starknetRpcUrl?: string;
  network?: 'mainnet' | 'goerli' | 'sepolia';
}

export class CavosWalletSDK {
  private config: CavosSDKConfig;
  private provider: SupportedProvider | null = null;
  private cloudStorage: CloudStorageProvider | null = null;
  private walletManager: WalletManager;
  private sessionManager: SessionManager;
  private starknetProvider: Provider;

  // Session state
  private sessionKey: string | null = null;
  private sessionExpiry: number | null = null;
  private walletAddress: string | null = null;

  constructor(config: CavosSDKConfig) {
    this.config = {
      backendUrl: 'https://api.cavos.io',
      starknetRpcUrl: 'https://starknet-mainnet.public.blastapi.io',
      network: 'mainnet',
      ...config
    };

    this.starknetProvider = new Provider({
      nodeUrl: this.config.starknetRpcUrl
    });

    this.walletManager = new WalletManager(this.starknetProvider);
    this.sessionManager = new SessionManager(this.starknetProvider);
  }

  /**
   * Login with Google or Apple
   */
  async login(provider: SupportedProvider): Promise<void> {
    this.provider = provider;

    if (provider === 'google') {
      await this.loginWithGoogle();
    } else if (provider === 'apple') {
      await this.loginWithApple();
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async loginWithGoogle(): Promise<void> {
    const { GoogleOAuth } = await import('./auth/GoogleOAuth');
    const { GoogleDriveStorage } = await import('./storage/GoogleDriveStorage');

    // 1. OAuth flow
    const oauth = new GoogleOAuth();
    const authResult = await oauth.authenticate();

    // 2. Exchange code with backend
    const backendAuth = await this.exchangeAuthCode(
      'google',
      authResult.code
    );

    // 3. Initialize cloud storage
    this.cloudStorage = new GoogleDriveStorage(backendAuth.accessToken);

    // 4. Load or create wallet
    await this.loadOrCreateWallet(
      backendAuth.userId,
      backendAuth.email
    );
  }

  private async loginWithApple(): Promise<void> {
    const { AppleOAuth } = await import('./auth/AppleOAuth');
    const { iCloudStorage } = await import('./storage/iCloudStorage');

    // 1. Apple Sign In
    const oauth = new AppleOAuth();
    const authResult = await oauth.authenticate();

    // 2. Exchange with backend
    const backendAuth = await this.exchangeAuthCode(
      'apple',
      authResult.code,
      authResult.identityToken
    );

    // 3. Initialize iCloud storage
    this.cloudStorage = new iCloudStorage();

    // 4. Load or create wallet
    await this.loadOrCreateWallet(
      backendAuth.userId,
      backendAuth.email
    );
  }

  private async loadOrCreateWallet(
    userId: string,
    email: string
  ): Promise<void> {
    const filename = `app_${this.config.appId}_cavos_wallet`;

    // Check if wallet exists in cloud
    const encryptedWallet = await this.cloudStorage!.downloadFile(filename);

    if (encryptedWallet) {
      await this.loadExistingWallet(userId, email, encryptedWallet);
    } else {
      await this.createNewWallet(userId, email, filename);
    }
  }

  private async loadExistingWallet(
    userId: string,
    email: string,
    encryptedWallet: string
  ): Promise<void> {
    // 1. Decrypt master key
    const masterKey = await this.walletManager.decryptWallet(
      encryptedWallet,
      userId,
      email
    );

    // 2. Create session keys
    const sessionKey = await this.sessionManager.createSession(
      masterKey,
      this.walletAddress!
    );

    // 3. Store session key in memory
    this.sessionKey = sessionKey.privateKey;
    this.sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24h

    // 4. DESTROY master key
    this.walletManager.secureClearKey(masterKey);

    console.log('Wallet loaded, session created');
  }

  private async createNewWallet(
    userId: string,
    email: string,
    filename: string
  ): Promise<void> {
    // 1. Generate new wallet
    const wallet = await this.walletManager.generateWallet();

    // 2. Deploy wallet contract
    const deployedAddress = await this.walletManager.deployWallet(
      wallet.publicKey
    );

    this.walletAddress = deployedAddress;

    // 3. Create session keys
    const sessionKey = await this.sessionManager.createSession(
      wallet.privateKey,
      deployedAddress
    );

    this.sessionKey = sessionKey.privateKey;
    this.sessionExpiry = Date.now() + 24 * 60 * 60 * 1000;

    // 4. Encrypt and upload to cloud
    const encrypted = await this.walletManager.encryptWallet(
      wallet.privateKey,
      userId,
      email
    );

    await this.cloudStorage!.uploadFile(filename, encrypted);

    // 5. Register with backend
    await this.registerWalletWithBackend({
      provider: this.provider!,
      userId,
      email,
      address: deployedAddress,
      publicKey: wallet.publicKey
    });

    // 6. DESTROY master key
    this.walletManager.secureClearKey(wallet.privateKey);

    console.log('New wallet created and deployed');
  }

  /**
   * Execute transaction with session key
   */
  async executeTransaction(call: Call): Promise<string> {
    if (!this.sessionKey) {
      throw new Error('No active session. Please login first.');
    }

    // Check session expiry
    if (Date.now() > this.sessionExpiry!) {
      throw new Error('Session expired. Please login again.');
    }

    // Sign and execute with session key
    const txHash = await this.sessionManager.executeWithSession(
      this.sessionKey,
      this.walletAddress!,
      call
    );

    return txHash;
  }

  /**
   * Get wallet balance
   */
  async getBalance(tokenAddress?: string): Promise<string> {
    if (!this.walletAddress) {
      throw new Error('No wallet loaded');
    }

    const ETH_TOKEN = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
    const token = tokenAddress || ETH_TOKEN;

    const { res } = await this.starknetProvider.callContract({
      contractAddress: token,
      entrypoint: 'balanceOf',
      calldata: [this.walletAddress]
    });

    return res[0];
  }

  /**
   * Get wallet address
   */
  getAddress(): string | null {
    return this.walletAddress;
  }

  /**
   * Check if session is valid
   */
  isSessionActive(): boolean {
    return (
      this.sessionKey !== null &&
      Date.now() < this.sessionExpiry!
    );
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    if (this.sessionKey) {
      this.walletManager.secureClearKey(this.sessionKey);
    }

    this.sessionKey = null;
    this.sessionExpiry = null;
    this.provider = null;
    this.cloudStorage = null;

    console.log('Logged out');
  }

  // Private helper methods

  private async exchangeAuthCode(
    provider: string,
    code: string,
    identityToken?: string
  ) {
    const response = await fetch(
      `${this.config.backendUrl}/v2/auth/${provider}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          identityToken,
          appId: this.config.appId
        })
      }
    );

    if (!response.ok) {
      throw new Error('Auth failed');
    }

    return response.json();
  }

  private async registerWalletWithBackend(data: {
    provider: string;
    userId: string;
    email: string;
    address: string;
    publicKey: string;
  }) {
    await fetch(`${this.config.backendUrl}/v2/wallet/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: this.config.appId,
        ...data
      })
    });
  }
}
```

### 2. Wallet Manager

```typescript
// src/wallet/WalletManager.ts
import { ec, stark, CallData } from 'starknet';
import { deriveEncryptionKey, encrypt, decrypt } from '../crypto/encryption';
import { secureClear } from '../utils/memory';

export class WalletManager {
  constructor(private provider: Provider) {}

  /**
   * Generate new wallet keypair
   */
  async generateWallet() {
    const privateKey = stark.randomAddress();
    const publicKey = ec.starkCurve.getStarkKey(privateKey);

    return { privateKey, publicKey };
  }

  /**
   * Deploy wallet contract
   */
  async deployWallet(publicKey: string): Promise<string> {
    // Use factory contract to deploy
    const FACTORY_ADDRESS = '0x...'; // Factory contract address
    const CLASS_HASH = '0x...'; // Session wallet class hash

    const deployCall = {
      contractAddress: FACTORY_ADDRESS,
      entrypoint: 'deploy_account',
      calldata: CallData.compile({
        master_public_key: publicKey,
        salt: stark.randomAddress()
      })
    };

    // Submit transaction
    const { transaction_hash } = await this.provider.addInvokeTransaction(
      deployCall
    );

    // Wait for confirmation
    await this.provider.waitForTransaction(transaction_hash);

    // Get deployed address from events
    const receipt = await this.provider.getTransactionReceipt(
      transaction_hash
    );

    // Extract address from events
    const deployedAddress = this.extractAddressFromEvents(receipt.events);

    return deployedAddress;
  }

  /**
   * Encrypt wallet private key
   */
  async encryptWallet(
    privateKey: string,
    userId: string,
    email: string
  ): Promise<string> {
    const encryptionKey = await deriveEncryptionKey(userId, email);
    const encrypted = await encrypt(privateKey, encryptionKey);
    return encrypted;
  }

  /**
   * Decrypt wallet private key
   */
  async decryptWallet(
    encryptedData: string,
    userId: string,
    email: string
  ): Promise<string> {
    const encryptionKey = await deriveEncryptionKey(userId, email);
    const privateKey = await decrypt(encryptedData, encryptionKey);
    return privateKey;
  }

  /**
   * Securely clear key from memory
   */
  secureClearKey(key: string): void {
    secureClear(key);
  }

  private extractAddressFromEvents(events: any[]): string {
    // Parse events to find AccountDeployed event
    // Implementation depends on factory contract events
    return '0x...';
  }
}
```

### 3. Session Manager

```typescript
// src/wallet/SessionManager.ts
import { ec, hash, Account, Contract, CallData } from 'starknet';

export interface SessionPolicy {
  maxAmountPerTx: bigint;
  maxAmountPerDay: bigint;
  allowedContracts: string[];
}

export class SessionManager {
  constructor(private provider: Provider) {}

  /**
   * Create session keys and register on-chain
   */
  async createSession(
    masterPrivateKey: string,
    walletAddress: string
  ) {
    // 1. Generate session keypair
    const sessionPrivateKey = stark.randomAddress();
    const sessionPublicKey = ec.starkCurve.getStarkKey(sessionPrivateKey);

    // 2. Define session policy
    const policy: SessionPolicy = {
      maxAmountPerTx: BigInt('100000000000000000'), // 0.1 ETH
      maxAmountPerDay: BigInt('500000000000000000'), // 0.5 ETH
      allowedContracts: [
        '0x04270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f' // AVNU Router
      ]
    };

    // 3. Create master account
    const masterAccount = new Account(
      this.provider,
      walletAddress,
      masterPrivateKey
    );

    // 4. Call session wallet contract to register session
    const sessionWallet = new Contract(
      SESSION_WALLET_ABI,
      walletAddress,
      masterAccount
    );

    const { transaction_hash } = await sessionWallet.create_session(
      sessionPublicKey,
      policy,
      86400 // 24 hours
    );

    // Wait for confirmation
    await this.provider.waitForTransaction(transaction_hash);

    return {
      privateKey: sessionPrivateKey,
      publicKey: sessionPublicKey,
      expiresAt: Date.now() + 86400000
    };
  }

  /**
   * Execute transaction using session key
   */
  async executeWithSession(
    sessionPrivateKey: string,
    walletAddress: string,
    call: Call
  ): Promise<string> {
    // Create session account
    const sessionAccount = new Account(
      this.provider,
      walletAddress,
      sessionPrivateKey
    );

    // Execute transaction
    const { transaction_hash } = await sessionAccount.execute(call);

    return transaction_hash;
  }
}
```

### 4. Encryption Utilities

```typescript
// src/crypto/encryption.ts

/**
 * Derive encryption key from userId + email using PBKDF2
 */
export async function deriveEncryptionKey(
  userId: string,
  email: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const salt = encoder.encode(userId + email);

  // Import key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Return base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decrypt(
  ciphertext: string,
  key: CryptoKey
): Promise<string> {
  // Decode base64
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  // Decode to string
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
```

### 5. Google Drive Storage

```typescript
// src/storage/GoogleDriveStorage.ts
import { CloudStorageProvider } from './CloudStorageProvider';

export class GoogleDriveStorage implements CloudStorageProvider {
  private accessToken: string;
  private readonly API_BASE = 'https://www.googleapis.com/drive/v3';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async uploadFile(filename: string, content: string): Promise<void> {
    // Check if file exists
    const existing = await this.findFile(filename);

    if (existing) {
      // Update existing file
      await this.updateFile(existing.id, content);
    } else {
      // Create new file
      await this.createFile(filename, content);
    }
  }

  async downloadFile(filename: string): Promise<string | null> {
    const file = await this.findFile(filename);

    if (!file) {
      return null;
    }

    const response = await fetch(
      `${this.API_BASE}/files/${file.id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    );

    return await response.text();
  }

  private async findFile(filename: string) {
    const response = await fetch(
      `${this.API_BASE}/files?` +
      `q=name='${filename}' and 'appDataFolder' in parents`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    );

    const data = await response.json();
    return data.files?.[0] || null;
  }

  private async createFile(filename: string, content: string) {
    const metadata = {
      name: filename,
      parents: ['appDataFolder']
    };

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], {
        type: 'application/json'
      })
    );
    form.append('file', new Blob([content], { type: 'text/plain' }));

    await fetch(
      `${this.API_BASE}/../upload/drive/v3/files?uploadType=multipart`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        },
        body: form
      }
    );
  }

  private async updateFile(fileId: string, content: string) {
    await fetch(
      `${this.API_BASE}/../upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: content
      }
    );
  }
}
```

## Usage Examples

### React Integration

```typescript
// examples/react/App.tsx
import { useState } from 'react';
import { CavosWalletSDK } from '@cavos/wallet-sdk';

const sdk = new CavosWalletSDK({
  appId: 'app_your_app_id'
});

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');

  const handleLogin = async (provider: 'google' | 'apple') => {
    await sdk.login(provider);
    setAddress(sdk.getAddress());

    const bal = await sdk.getBalance();
    setBalance(bal);
  };

  const handleSwap = async () => {
    const txHash = await sdk.executeTransaction({
      contractAddress: AVNU_ROUTER,
      entrypoint: 'swap',
      calldata: [tokenIn, tokenOut, amount]
    });

    console.log('Transaction:', txHash);
  };

  return (
    <div>
      {!address ? (
        <>
          <button onClick={() => handleLogin('google')}>
            Login with Google
          </button>
          <button onClick={() => handleLogin('apple')}>
            Login with Apple
          </button>
        </>
      ) : (
        <>
          <p>Address: {address}</p>
          <p>Balance: {balance} ETH</p>
          <button onClick={handleSwap}>Swap 1 ETH to USDC</button>
        </>
      )}
    </div>
  );
}
```

## Testing

```typescript
// tests/unit/encryption.test.ts
import { describe, it, expect } from 'vitest';
import { deriveEncryptionKey, encrypt, decrypt } from '../src/crypto/encryption';

describe('Encryption', () => {
  it('should encrypt and decrypt correctly', async () => {
    const key = await deriveEncryptionKey('user123', 'test@example.com');
    const plaintext = '0x1234567890abcdef';

    const encrypted = await encrypt(plaintext, key);
    const decrypted = await decrypt(encrypted, key);

    expect(decrypted).toBe(plaintext);
  });

  it('should fail with wrong key', async () => {
    const key1 = await deriveEncryptionKey('user1', 'test@example.com');
    const key2 = await deriveEncryptionKey('user2', 'test@example.com');

    const encrypted = await encrypt('secret', key1);

    await expect(decrypt(encrypted, key2)).rejects.toThrow();
  });
});
```

## Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'CavosWalletSDK',
      fileName: 'cavos-wallet-sdk'
    },
    rollupOptions: {
      external: ['starknet'],
      output: {
        globals: {
          starknet: 'starknet'
        }
      }
    }
  },
  plugins: [dts()]
});
```

## Deliverables

- [ ] Core SDK implementation
- [ ] Encryption/decryption (AES-256-GCM + PBKDF2)
- [ ] Google Drive integration
- [ ] iCloud Drive integration
- [ ] StarkNet wallet management
- [ ] Session key management
- [ ] Transaction signing
- [ ] React example app
- [ ] Vanilla JS example
- [ ] Unit tests (>85% coverage)
- [ ] Integration tests
- [ ] API documentation
- [ ] NPM package

## Success Metrics

- **Bundle Size**: < 100KB (gzipped)
- **Performance**: Login flow < 3s
- **Test Coverage**: > 85%
- **Browser Support**: Chrome, Safari, Firefox (last 2 versions)
