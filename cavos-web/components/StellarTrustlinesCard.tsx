'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';

interface Asset {
  code: string;
  issuer: string;
}

type Network = 'stellar-mainnet' | 'stellar-testnet';

const NETWORKS: { key: Network; label: string }[] = [
  { key: 'stellar-mainnet', label: 'Mainnet' },
  { key: 'stellar-testnet', label: 'Testnet' },
];

/** Base reserve locked per trustline, in XLM. Protocol default since v18. */
const RESERVE_PER_TRUSTLINE = 0.5;

/**
 * The assets this app's wallets may hold.
 *
 * The list is the relay's allowlist, not a description of what wallets hold: an
 * asset here is one the relay agrees to sponsor, and removing it stops new
 * trustlines being sponsored without touching the ones already open. The reserve
 * is paid by the org that owns the app.
 */
export function StellarTrustlinesCard({ appId }: { appId: string }) {
  const [network, setNetwork] = useState<Network>('stellar-mainnet');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [max, setMax] = useState(10);
  const [code, setCode] = useState('');
  const [issuer, setIssuer] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/stellar/trustlines?app_id=${appId}&network=${network}`);
      const data = await res.json();
      if (res.ok) {
        setAssets(data.assets ?? []);
        setMax(data.max ?? 10);
      }
    } finally {
      setLoading(false);
    }
  }, [appId, network]);

  useEffect(() => { setLoading(true); void load(); }, [load]);

  const mutate = async (method: 'POST' | 'DELETE', asset: Asset) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/stellar/trustlines', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: appId,
          network,
          code: asset.code,
          issuer: asset.issuer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ kind: 'err', text: data.error ?? 'Request failed' });
        return;
      }
      setAssets(data.assets ?? []);
      if (method === 'POST') {
        setCode('');
        setIssuer('');
        setShowForm(false);
      }
    } catch {
      setMsg({ kind: 'err', text: 'Network error' });
    } finally {
      setBusy(false);
    }
  };

  const perWallet = (assets.length * RESERVE_PER_TRUSTLINE).toFixed(1);

  return (
    <section data-dash-panel className="rounded-2xl bg-white border border-line p-6 md:p-7 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Icon.Gas size={15} weight="fill" className="text-ink/55" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">
              Sponsored trustlines
            </span>
          </div>
          <p className="text-sm text-black/50 max-w-lg">
            Assets this app&apos;s wallets can hold. Each one locks{' '}
            <span className="font-semibold text-ink tabular-nums">{RESERVE_PER_TRUSTLINE} XLM</span>{' '}
            per wallet from your organization&apos;s gas pot — currently{' '}
            <span className="font-semibold text-ink tabular-nums">{perWallet} XLM</span> on top of
            the ~3.5 XLM a wallet already costs.
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setMsg(null); }}
          disabled={assets.length >= max}
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-hover transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add asset
        </button>
      </div>

      <div className="inline-flex rounded-lg border border-line p-0.5">
        {NETWORKS.map((n) => (
          <button
            key={n.key}
            onClick={() => { setNetwork(n.key); setMsg(null); setShowForm(false); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              network === n.key ? 'bg-ink text-white' : 'text-black/45 hover:text-ink'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {msg && (
        <p className={`text-sm font-medium ${msg.kind === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
          {msg.text}
        </p>
      )}

      {showForm && (
        <div className="rounded-xl border border-line p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-[140px_1fr]">
            <Input
              placeholder="USDC"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              disabled={busy}
            />
            <Input
              placeholder="Issuer G…"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value.trim())}
              disabled={busy}
            />
          </div>
          <Button
            onClick={() => mutate('POST', { code, issuer })}
            loading={busy}
            disabled={!code || !issuer || busy}
          >
            Add
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-black/40">Loading…</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-black/40">
          No assets configured. Wallets on this network can hold XLM only.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {assets.map((a) => (
            <li key={`${a.code}:${a.issuer}`} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-ink">{a.code}</span>
                <span className="block text-xs text-black/40 font-mono truncate">{a.issuer}</span>
              </div>
              <button
                onClick={() => mutate('DELETE', a)}
                disabled={busy}
                className="shrink-0 text-xs font-semibold text-black/40 hover:text-red-600 transition-colors disabled:opacity-40"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
