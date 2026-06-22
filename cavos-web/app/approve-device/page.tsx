'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  HttpRecoveryClient,
  type PendingDeviceRequest,
} from '@cavos/kit';
import {
  CavosProvider,
  useCavos,
  type CavosConfig,
  type CavosModalConfig,
} from '@cavos/kit/react';

const NETWORK = 'sepolia' as const;
const RPC_URL = 'https://api.cartridge.gg/x/starknet/sepolia';
const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cavos.xyz';

function resolvePaymasterKey(): string {
  // The hosted approval page uses Cavos's own paymaster key for the add_signer tx.
  return process.env.NEXT_PUBLIC_CAVOS_PAYMASTER_API_KEY || '';
}

const config: CavosConfig = {
  network: NETWORK,
  appSalt: 'cavos-hosted-approve',
  paymasterApiKey: resolvePaymasterKey(),
  authBackendUrl: BACKEND_URL,
  rpcUrl: RPC_URL,
};

const modal: CavosModalConfig = { appName: 'Cavos', theme: 'dark', emailMode: 'otp' };

export default function ApproveDevicePage() {
  return (
    <CavosProvider config={config} modal={modal}>
      <Approve />
    </CavosProvider>
  );
}

function Approve() {
  const { isAuthenticated, address, addSigner, openModal } = useCavos();
  const [request, setRequest] = useState<PendingDeviceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Read the request id. The "Sign in to approve" step redirects to Google/Apple
  // which returns with ?auth_data=…, overwriting ?request=. Persist the id in
  // sessionStorage so it survives that OAuth round-trip.
  const [requestId, setRequestId] = useState<string | null>(null);
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('request') || '';
    const STASH = 'cavos.approve.requestId';
    if (fromUrl) {
      sessionStorage.setItem(STASH, fromUrl);
      setRequestId(fromUrl);
    } else {
      setRequestId(sessionStorage.getItem(STASH) || '');
    }
  }, []);

  // Load the pending request once we know the id.
  useEffect(() => {
    if (requestId === null) return; // still resolving
    if (!requestId) {
      setError('Missing request id.');
      setLoading(false);
      return;
    }
    const recovery = new HttpRecoveryClient({ baseUrl: BACKEND_URL, appId: '' });
    recovery
      .getPendingRequest(requestId)
      .then((r) => {
        if (!r) setError('Request not found.');
        else if (r.status === 'expired') setError('This approval link has expired.');
        else if (r.status === 'approved') setDone(true);
        else setRequest(r);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [requestId]);

  const approve = useCallback(async () => {
    if (!request) return;
    setBusy(true);
    setError('');
    try {
      // add_signer(new_pubkey) — signed gaslessly by THIS (registered) device's key.
      const res = await addSigner(request.newSigner);
      const recovery = new HttpRecoveryClient({ baseUrl: BACKEND_URL, appId: '' });
      await recovery.confirmDeviceAddition({ requestId: request.requestId, txHash: res.transactionHash });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [request, addSigner]);

  const btn: React.CSSProperties = {
    padding: '12px 18px', borderRadius: 999, border: '1px solid #000',
    background: '#000', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14,
  };
  const card: React.CSSProperties = { border: '1px solid #eee', borderRadius: 16, padding: 24 };

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 24, fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: 22 }}>Approve a new device</h1>

      {loading && <p style={{ color: '#666' }}>Loading request…</p>}

      {!loading && error && <div style={{ ...card, color: '#b00' }}>{error}</div>}

      {!loading && !error && done && (
        <div style={card}>
          <h2 style={{ marginTop: 0, color: '#16a34a' }}>✓ Device approved</h2>
          <p style={{ color: '#555' }}>The new device can now access the wallet. You can close this page.</p>
        </div>
      )}

      {!loading && !error && !done && request && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={card}>
            <p style={{ color: '#555', marginTop: 0 }}>Someone is trying to add a device to the wallet at:</p>
            <div style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12, wordBreak: 'break-all', color: '#333' }}>
              {request.accountAddress}
            </div>
          </div>

          {!isAuthenticated ? (
            <div style={card}>
              <p style={{ color: '#555' }}>
                To approve this device, sign in with a device that already has access to the wallet.
              </p>
              <button style={btn} onClick={openModal}>Sign in to approve</button>
            </div>
          ) : (
            <div style={card}>
              <p style={{ color: '#555' }}>
                You&apos;re signed in{address ? <> as <code style={{ fontSize: 11 }}>{address.slice(0, 8)}…{address.slice(-4)}</code></> : null}.
                Approving will authorize the new device to operate this wallet.
              </p>
              <button style={btn} disabled={busy} onClick={approve}>
                {busy ? 'Approving…' : 'Approve device'}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
