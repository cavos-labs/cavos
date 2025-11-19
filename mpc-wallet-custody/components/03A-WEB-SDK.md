# Component 3A: Cavos Web SDK (TypeScript)

## Overview
Browser-based SDK for web applications (React, Vue, vanilla JS) handling wallet operations, encryption, and cloud storage entirely client-side.

## Timeline
**Duration**: 3 weeks (Weeks 5-7)

**Dependencies**: Backend API, Smart Contracts (for deployment)

## Tech Stack

```json
{
  "language": "TypeScript 5+",
  "crypto": "Web Crypto API",
  "starknet": "starknet.js",
  "build": "Vite + tsup",
  "testing": "vitest + playwright",
  "storage": {
    "google": "Google Drive API (REST)",
    "apple": "CloudKit JS"
  },
  "frameworks": {
    "react": ">=18.0.0",
    "vue": ">=3.0.0",
    "vanilla": "ES2020+"
  }
}
```

## Project Structure

```
cavos-web-sdk/
├── src/
│   ├── index.ts                          # Main export
│   ├── CavosWalletSDK.ts                 # Main SDK class
│   ├── crypto/
│   │   ├── encryption.ts                 # AES-256-GCM
│   │   ├── keyDerivation.ts              # PBKDF2
│   │   └── webCrypto.ts                  # Web Crypto wrapper
│   ├── storage/
│   │   ├── CloudStorageProvider.ts       # Abstract interface
│   │   ├── GoogleDriveStorage.ts         # Google Drive REST API
│   │   └── iCloudStorage.ts              # CloudKit JS
│   ├── auth/
│   │   ├── OAuthProvider.ts              # Abstract interface
│   │   ├── GoogleOAuth.ts                # Google OAuth (popup flow)
│   │   └── AppleOAuth.ts                 # Sign in with Apple (JS)
│   ├── wallet/
│   │   ├── WalletManager.ts              # Wallet lifecycle
│   │   ├── SessionManager.ts             # Session keys
│   │   └── TransactionSigner.ts          # Sign transactions
│   ├── starknet/
│   │   ├── StarkNetClient.ts             # RPC client
│   │   └── SessionWalletContract.ts      # Contract interface
│   ├── api/
│   │   └── BackendClient.ts              # API communication
│   ├── react/
│   │   ├── CavosProvider.tsx             # React Context
│   │   ├── useCavosWallet.ts             # React Hook
│   │   └── components/
│   │       ├── LoginButton.tsx
│   │       └── WalletInfo.tsx
│   ├── vue/
│   │   ├── plugin.ts                     # Vue plugin
│   │   └── composables/
│   │       └── useCavosWallet.ts         # Vue composable
│   ├── types/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   └── wallet.ts
│   └── utils/
│       ├── logger.ts
│       ├── errors.ts
│       └── memory.ts                     # Secure clearing
├── examples/
│   ├── react-app/
│   ├── vue-app/
│   ├── vanilla-js/
│   └── next-js/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Core Implementation

### 1. Main SDK Class

```typescript
// src/CavosWalletSDK.ts
import { Account, Provider, Call } from 'starknet';
import { GoogleDriveStorage } from './storage/GoogleDriveStorage';
import { GoogleOAuth } from './auth/GoogleOAuth';
import { WalletManager } from './wallet/WalletManager';
import { SessionManager } from './wallet/SessionManager';

export type SupportedProvider = 'google' | 'apple';

export interface CavosSDKConfig {
  appId: string;
  backendUrl?: string;
  starknetRpcUrl?: string;
  network?: 'mainnet' | 'sepolia';
  debug?: boolean;
}

export class CavosWalletSDK {
  private config: CavosSDKConfig;
  private provider: SupportedProvider | null = null;
  private cloudStorage: CloudStorageProvider | null = null;
  private walletManager: WalletManager;
  private sessionManager: SessionManager;

  private sessionKey: string | null = null;
  private sessionExpiry: number | null = null;
  private walletAddress: string | null = null;

  constructor(config: CavosSDKConfig) {
    this.config = {
      backendUrl: 'https://api.cavos.io',
      starknetRpcUrl: 'https://starknet-mainnet.public.blastapi.io',
      network: 'mainnet',
      debug: false,
      ...config
    };

    const starknetProvider = new Provider({
      nodeUrl: this.config.starknetRpcUrl
    });

    this.walletManager = new WalletManager(starknetProvider);
    this.sessionManager = new SessionManager(starknetProvider);
  }

  /**
   * Login with Google or Apple (popup-based OAuth)
   */
  async login(provider: SupportedProvider): Promise<void> {
    this.provider = provider;

    if (provider === 'google') {
      await this.loginWithGoogle();
    } else if (provider === 'apple') {
      await this.loginWithApple();
    }
  }

  private async loginWithGoogle(): Promise<void> {
    // 1. OAuth popup flow
    const oauth = new GoogleOAuth({
      clientId: this.config.googleClientId!,
      redirectUri: window.location.origin + '/oauth/callback'
    });

    const authCode = await oauth.authenticate();

    // 2. Exchange with backend
    const backendAuth = await this.exchangeAuthCode('google', authCode);

    // 3. Initialize Drive storage
    this.cloudStorage = new GoogleDriveStorage(backendAuth.accessToken);

    // 4. Load or create wallet
    await this.loadOrCreateWallet(
      backendAuth.userId,
      backendAuth.email
    );
  }

  private async loginWithApple(): Promise<void> {
    // Use Sign in with Apple JS
    const oauth = new AppleOAuth({
      clientId: this.config.appleClientId!,
      redirectUri: window.location.origin + '/oauth/callback'
    });

    const { code, id_token } = await oauth.authenticate();

    // Exchange with backend
    const backendAuth = await this.exchangeAuthCode(
      'apple',
      code,
      id_token
    );

    // iCloud storage (CloudKit JS)
    this.cloudStorage = new iCloudStorage();

    await this.loadOrCreateWallet(
      backendAuth.userId,
      backendAuth.email
    );
  }

  /**
   * Execute transaction
   */
  async executeTransaction(call: Call): Promise<string> {
    if (!this.sessionKey || Date.now() > this.sessionExpiry!) {
      throw new Error('Session expired. Please login again.');
    }

    return await this.sessionManager.executeWithSession(
      this.sessionKey,
      this.walletAddress!,
      call
    );
  }

  /**
   * Get balance
   */
  async getBalance(tokenAddress?: string): Promise<string> {
    // Implementation...
  }

  /**
   * Get wallet address
   */
  getAddress(): string | null {
    return this.walletAddress;
  }

  /**
   * Check session status
   */
  isSessionActive(): boolean {
    return (
      this.sessionKey !== null &&
      Date.now() < this.sessionExpiry!
    );
  }

  /**
   * Logout
   */
  logout(): void {
    if (this.sessionKey) {
      this.walletManager.secureClearKey(this.sessionKey);
    }
    this.sessionKey = null;
    this.sessionExpiry = null;
    this.provider = null;
    this.cloudStorage = null;
  }

  // ... helper methods
}
```

### 2. Google OAuth (Popup Flow)

```typescript
// src/auth/GoogleOAuth.ts
export class GoogleOAuth {
  private clientId: string;
  private redirectUri: string;
  private scope = 'https://www.googleapis.com/auth/drive.appdata';

  constructor(config: { clientId: string; redirectUri: string }) {
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
  }

  async authenticate(): Promise<string> {
    return new Promise((resolve, reject) => {
      const authUrl = this.buildAuthUrl();

      // Open popup
      const popup = window.open(
        authUrl,
        'Google Sign In',
        'width=500,height=600'
      );

      if (!popup) {
        reject(new Error('Popup blocked'));
        return;
      }

      // Listen for callback
      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'OAUTH_SUCCESS') {
          popup?.close();
          resolve(event.data.code);
        } else if (event.data.type === 'OAUTH_ERROR') {
          popup?.close();
          reject(new Error(event.data.error));
        }
      });
    });
  }

  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }
}
```

### 3. Google Drive Storage (REST API)

```typescript
// src/storage/GoogleDriveStorage.ts
export class GoogleDriveStorage implements CloudStorageProvider {
  private accessToken: string;
  private readonly API_BASE = 'https://www.googleapis.com/drive/v3';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async uploadFile(filename: string, content: string): Promise<void> {
    const existing = await this.findFile(filename);

    if (existing) {
      await this.updateFile(existing.id, content);
    } else {
      await this.createFile(filename, content);
    }
  }

  async downloadFile(filename: string): Promise<string | null> {
    const file = await this.findFile(filename);
    if (!file) return null;

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
    form.append(
      'file',
      new Blob([content], { type: 'text/plain' })
    );

    await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
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
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
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

## React Integration

### Provider Component

```typescript
// src/react/CavosProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CavosWalletSDK } from '../CavosWalletSDK';

interface CavosContextValue {
  sdk: CavosWalletSDK;
  address: string | null;
  isConnected: boolean;
  isSessionActive: boolean;
  login: (provider: 'google' | 'apple') => Promise<void>;
  logout: () => void;
}

const CavosContext = createContext<CavosContextValue | null>(null);

export const CavosProvider: React.FC<{
  config: CavosSDKConfig;
  children: React.ReactNode;
}> = ({ config, children }) => {
  const [sdk] = useState(() => new CavosWalletSDK(config));
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check session on mount
    if (sdk.isSessionActive()) {
      setAddress(sdk.getAddress());
      setIsConnected(true);
    }
  }, [sdk]);

  const login = async (provider: 'google' | 'apple') => {
    await sdk.login(provider);
    setAddress(sdk.getAddress());
    setIsConnected(true);
  };

  const logout = () => {
    sdk.logout();
    setAddress(null);
    setIsConnected(false);
  };

  return (
    <CavosContext.Provider
      value={{
        sdk,
        address,
        isConnected,
        isSessionActive: sdk.isSessionActive(),
        login,
        logout
      }}
    >
      {children}
    </CavosContext.Provider>
  );
};

export const useCavos = () => {
  const context = useContext(CavosContext);
  if (!context) {
    throw new Error('useCavos must be used within CavosProvider');
  }
  return context;
};
```

### Hook

```typescript
// src/react/useCavosWallet.ts
import { useState, useCallback } from 'react';
import { useCavos } from './CavosProvider';
import { Call } from 'starknet';

export const useCavosWallet = () => {
  const { sdk, address, isConnected, login, logout } = useCavos();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async (token?: string) => {
    setLoading(true);
    try {
      const bal = await sdk.getBalance(token);
      setBalance(bal);
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  const executeTransaction = useCallback(async (call: Call) => {
    setLoading(true);
    try {
      const txHash = await sdk.executeTransaction(call);
      return txHash;
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  return {
    address,
    balance,
    isConnected,
    loading,
    login,
    logout,
    fetchBalance,
    executeTransaction
  };
};
```

## Usage Examples

### React App

```typescript
// App.tsx
import { CavosProvider } from '@cavos/web-sdk/react';
import { Dashboard } from './Dashboard';

function App() {
  return (
    <CavosProvider
      config={{
        appId: 'app_your_app_id',
        googleClientId: 'your_google_client_id',
        appleClientId: 'your_apple_client_id'
      }}
    >
      <Dashboard />
    </CavosProvider>
  );
}

// Dashboard.tsx
import { useCavosWallet } from '@cavos/web-sdk/react';

function Dashboard() {
  const {
    address,
    balance,
    isConnected,
    login,
    logout,
    fetchBalance,
    executeTransaction
  } = useCavosWallet();

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
      <div>
        <button onClick={() => login('google')}>
          Continue with Google
        </button>
        <button onClick={() => login('apple')}>
          Continue with Apple
        </button>
      </div>
    );
  }

  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {balance} ETH</p>
      <button onClick={handleSwap}>Swap 1 ETH to USDC</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Vue 3 App

```typescript
// main.ts
import { createApp } from 'vue';
import { createCavos } from '@cavos/web-sdk/vue';
import App from './App.vue';

const app = createApp(App);

app.use(createCavos({
  appId: 'app_your_app_id',
  googleClientId: 'your_google_client_id',
  appleClientId: 'your_apple_client_id'
}));

app.mount('#app');

// Dashboard.vue
<template>
  <div>
    <div v-if="!isConnected">
      <button @click="login('google')">Continue with Google</button>
      <button @click="login('apple')">Continue with Apple</button>
    </div>
    <div v-else>
      <p>Address: {{ address }}</p>
      <p>Balance: {{ balance }} ETH</p>
      <button @click="handleSwap">Swap 1 ETH to USDC</button>
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCavosWallet } from '@cavos/web-sdk/vue';

const {
  address,
  balance,
  isConnected,
  login,
  logout,
  executeTransaction
} = useCavosWallet();

const handleSwap = async () => {
  const txHash = await executeTransaction({
    contractAddress: AVNU_ROUTER,
    entrypoint: 'swap',
    calldata: ['ETH', 'USDC', '1000000000000000000']
  });
  console.log('Transaction:', txHash);
};
</script>
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { CavosWalletSDK } from 'https://cdn.cavos.io/sdk/latest/cavos.js';

    const sdk = new CavosWalletSDK({
      appId: 'app_your_app_id',
      googleClientId: 'your_google_client_id'
    });

    document.getElementById('google-login').onclick = async () => {
      await sdk.login('google');
      document.getElementById('address').textContent = sdk.getAddress();
    };

    document.getElementById('swap').onclick = async () => {
      const txHash = await sdk.executeTransaction({
        contractAddress: AVNU_ROUTER,
        entrypoint: 'swap',
        calldata: ['ETH', 'USDC', '1000000000000000000']
      });
      console.log('Transaction:', txHash);
    };
  </script>
</head>
<body>
  <button id="google-login">Login with Google</button>
  <p id="address"></p>
  <button id="swap">Swap ETH to USDC</button>
</body>
</html>
```

## Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        react: 'src/react/index.ts',
        vue: 'src/vue/index.ts'
      },
      name: 'CavosWalletSDK',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'vue', 'starknet'],
      output: {
        globals: {
          react: 'React',
          vue: 'Vue',
          starknet: 'starknet'
        }
      }
    }
  },
  plugins: [react(), vue(), dts()]
});
```

## Package Configuration

```json
{
  "name": "@cavos/web-sdk",
  "version": "1.0.0",
  "description": "Cavos Wallet SDK for Web",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./react": {
      "import": "./dist/react.mjs",
      "require": "./dist/react.js",
      "types": "./dist/react.d.ts"
    },
    "./vue": {
      "import": "./dist/vue.mjs",
      "require": "./dist/vue.js",
      "types": "./dist/vue.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "peerDependencies": {
    "react": ">=18.0.0",
    "vue": ">=3.0.0",
    "starknet": ">=5.0.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    },
    "vue": {
      "optional": true
    }
  }
}
```

## Testing

```typescript
// tests/e2e/wallet-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Cavos Wallet Flow', () => {
  test('should login with Google and execute transaction', async ({ page, context }) => {
    await page.goto('http://localhost:3000');

    // Click login
    await page.click('button:has-text("Continue with Google")');

    // Handle OAuth popup
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("Continue with Google")')
    ]);

    // Complete OAuth (mocked in test)
    await popup.fill('input[type="email"]', 'test@example.com');
    await popup.click('button:has-text("Next")');

    // Verify wallet loaded
    await expect(page.locator('[data-testid="wallet-address"]')).toBeVisible();

    // Execute transaction
    await page.click('button:has-text("Swap")');
    await expect(page.locator('[data-testid="tx-hash"]')).toBeVisible();
  });
});
```

## Deliverables

- [ ] Core SDK implementation
- [ ] Web Crypto API encryption
- [ ] Google OAuth popup flow
- [ ] Apple OAuth JS flow
- [ ] Google Drive REST API integration
- [ ] iCloud CloudKit JS integration
- [ ] React provider + hooks
- [ ] Vue 3 plugin + composables
- [ ] Vanilla JS support
- [ ] TypeScript types
- [ ] Unit tests (>85% coverage)
- [ ] E2E tests (Playwright)
- [ ] NPM package
- [ ] CDN distribution
- [ ] Documentation site
- [ ] Example apps (React, Vue, Vanilla)

## Success Metrics

- **Bundle Size**: <80KB (gzipped, core)
- **Performance**: Login flow <3s
- **Browser Support**: Chrome, Safari, Firefox, Edge (last 2 versions)
- **Test Coverage**: >85%
- **Framework Support**: React, Vue, Vanilla JS
