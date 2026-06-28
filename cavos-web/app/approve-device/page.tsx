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

const RPC_URL = 'https://api.cartridge.gg/x/starknet/sepolia';
const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cavos.xyz';

function resolvePaymasterKey(): string {
  // The hosted approval page uses Cavos's own paymaster key for the add_signer tx.
  return process.env.NEXT_PUBLIC_CAVOS_PAYMASTER_API_KEY || '';
}

const modal: CavosModalConfig = { appName: 'Cavos', theme: 'dark', emailMode: 'otp' };

const btn: React.CSSProperties = {
  padding: '12px 18px', borderRadius: 999, border: '1px solid #000',
  background: '#000', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14,
};
const card: React.CSSProperties = { border: '1px solid #eee', borderRadius: 16, padding: 24 };

/**
 * Resolve the request id. The "Sign in to approve" step redirects to Google/Apple
 * which returns with ?auth_data=…, overwriting ?request=. Persist the id in
 * sessionStorage so it survives that OAuth round-trip.
 */
function useRequestId(): { requestId: string | null } {
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
  return { requestId };
}

/**
 * Fetch a pending device-addition request, plus the per-app identity context
 * (appSalt, appId, network) needed to rebuild the SAME wallet the request
 * refers to. Without this, the hosted page would derive a different wallet
 * (different appSalt → different address + device key) and never recognize the
 * approving user as an authorized signer.
 */
async function fetchRequest(
  requestId: string,
): Promise<{ request: PendingDeviceRequest; appId: string; appSalt: string; network: string | null } | { error: string }> {
  // The kit's PendingDeviceRequest doesn't (yet) carry appSalt/network, so we
  // fetch the raw JSON to read those fields alongside the request data.
  const url = new URL('/api/devices/request', BACKEND_URL);
  url.searchParams.set('id', requestId);
  const rawRes = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!rawRes.ok) return { error: `Failed to load request (${rawRes.status}).` };
  const data = await rawRes.json();
  if (!data.found) return { error: 'Request not found.' };

  const status = data.status as PendingDeviceRequest['status'];
  if (status === 'expired') return { error: 'This approval link has expired.' };

  const request: PendingDeviceRequest = {
    requestId: data.request_id,
    appId: data.app_id,
    userId: '',
    accountAddress: data.wallet_address,
    newSigner: { x: BigInt(data.new_pub_x), y: BigInt(data.new_pub_y) },
    createdAt: data.created_at,
    status,
  };

  const appSalt: string | undefined = data.app_salt;
  const appId: string | undefined = data.app_id;
  const network: string | null = data.network ?? null;

  if (!appSalt || !appId) {
    return { error: 'This request is missing app identity; cannot resolve the wallet.' };
  }

  return { request, appId, appSalt, network };
}

export default function ApproveDevicePage() {
  const { requestId } = useRequestId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ctx, setCtx] = useState<{
    request: PendingDeviceRequest;
    appId: string;
    appSalt: string;
    network: string | null;
  } | null>(null);

  useEffect(() => {
    if (requestId === null) return; // still resolving
    if (!requestId) {
      setError('Missing request id.');
      setLoading(false);
      return;
    }
    fetchRequest(requestId)
      .then((res) => {
        if ('error' in res) setError(res.error);
        else {
          if (res.request.status === 'approved') {
            // Already approved — render the success state directly (no provider needed).
            setCtx({ ...res, request: { ...res.request, status: 'approved' } });
          } else {
            setCtx(res);
          }
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 22 }}>Approve a new device</h1>
        <p style={{ color: '#666' }}>Loading request…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 22 }}>Approve a new device</h1>
        <div style={{ ...card, color: '#b00' }}>{error}</div>
      </main>
    );
  }

  if (!ctx) return null;

  // Already approved — show success without mounting a provider.
  if (ctx.request.status === 'approved') {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 22 }}>Approve a new device</h1>
        <div style={card}>
          <h2 style={{ marginTop: 0, color: '#16a34a' }}>✓ Device approved</h2>
          <p style={{ color: '#555' }}>The new device can now access the wallet. You can close this page.</p>
        </div>
      </main>
    );
  }

  // Build the CavosConfig from the request's identity context so the approving
  // device is recognized against the SAME wallet the request refers to.
  // network from wallets is e.g. 'sepolia'; fall back to sepolia (Starknet only here).
  const network = (ctx.network === 'mainnet' ? 'mainnet' : 'sepolia') as 'sepolia' | 'mainnet';
  const config: CavosConfig = {
    network,
    appSalt: ctx.appSalt,
    appId: ctx.appId,
    paymasterApiKey: resolvePaymasterKey(),
    authBackendUrl: BACKEND_URL,
    rpcUrl: RPC_URL,
  };

  return (
    <CavosProvider config={config} modal={modal}>
      <Approve initialRequest={ctx.request} />
    </CavosProvider>
  );
}

function Approve({ initialRequest }: { initialRequest: PendingDeviceRequest }) {
  const { isAuthenticated, address, addSigner, openModal } = useCavos();
  const request = initialRequest;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 24, fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: 22 }}>Approve a new device</h1>

      {error && <div style={{ ...card, color: '#b00', marginBottom: 16 }}>{error}</div>}

      {done && (
        <div style={card}>
          <h2 style={{ marginTop: 0, color: '#16a34a' }}>✓ Device approved</h2>
          <p style={{ color: '#555' }}>The new device can now access the wallet. You can close this page.</p>
        </div>
      )}

      {!done && request && (
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
