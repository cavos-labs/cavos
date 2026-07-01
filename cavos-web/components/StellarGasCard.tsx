'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { createClient } from '@/lib/supabase/client';
import { getStellarKit, MAINNET_PASSPHRASE } from '@/lib/stellar/walletKit';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';

const MAINNET_HORIZON = 'https://horizon.stellar.org';

interface StellarGas {
  balance_xlm: number;
  total_deposited_xlm: number;
  total_consumed_xlm: number;
  deposit_address: string | null;
  deposit_memo_hash: string;
}

interface StellarDeposit {
  id: string;
  tx_hash: string;
  amount_stroops: number;
  status: string;
  created_at: string;
}

const STROOPS_PER_XLM = 10_000_000;

/**
 * Per-org Stellar gas balance + deposit flow. Like the Solana ledger, Stellar gas
 * is a prepaid off-chain balance: send XLM to the Cavos relayer G-account carrying
 * the org's hash memo, then the tx hash is registered to credit the org.
 *
 * Primary path connects any Stellar wallet via Stellar Wallets Kit (Freighter,
 * xBull, Albedo, Rabet, Lobstr, Hana) and builds the payment + memo automatically.
 * A manual "register by hash" fallback covers deposits made elsewhere (CLI, etc).
 */
export function StellarGasCard({ orgId }: { orgId: string }) {
  const [gas, setGas] = useState<StellarGas | null>(null);
  const [deposits, setDeposits] = useState<StellarDeposit[]>([]);
  const [txHash, setTxHash] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/stellar/gas/balance?org_id=${orgId}`);
    if (res.ok) setGas(await res.json());
    const { data } = await createClient()
      .from('stellar_gas_deposits')
      .select('id, tx_hash, amount_stroops, status, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20);
    setDeposits((data as StellarDeposit[]) ?? []);
  }, [orgId]);

  useEffect(() => { refresh(); }, [refresh]);

  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  /** Register a confirmed deposit tx with the backend (credits the org). */
  const register = useCallback(async (hash: string): Promise<boolean> => {
    const res = await fetch('/api/stellar/gas/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, tx_hash: hash, network: 'stellar-mainnet' }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ kind: 'ok', text: `Credited ${data.deposit.amount_xlm} XLM` });
      await refresh();
      return true;
    }
    setMsg({ kind: 'err', text: data.error ?? 'Deposit failed' });
    return false;
  }, [orgId, refresh]);

  const registerManual = async () => {
    if (!txHash.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      if (await register(txHash.trim())) setTxHash('');
    } catch {
      setMsg({ kind: 'err', text: 'Network error' });
    } finally {
      setBusy(false);
    }
  };

  /** Open the Stellar Wallets Kit modal and remember the connected address. */
  const connectWallet = async () => {
    setConnecting(true);
    setMsg(null);
    try {
      const kit = await getStellarKit();
      const { address } = await kit.authModal();
      setWalletAddress(address);
    } catch (e: unknown) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Wallet connection failed' });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      const kit = await getStellarKit();
      await kit.disconnect();
    } catch { /* ignore */ }
    setWalletAddress(null);
  };

  /** Build the payment + hash memo with the connected wallet, sign, submit, register. */
  const depositWithWallet = async () => {
    if (!gas?.deposit_address || !walletAddress) return;
    const xlm = parseFloat(amount);
    if (!xlm || xlm <= 0) return;

    setDepositing(true);
    setMsg(null);
    try {
      const kit = await getStellarKit();
      const address = walletAddress;

      const server = new Horizon.Server(MAINNET_HORIZON);
      const account = await server.loadAccount(address);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: MAINNET_PASSPHRASE,
      })
        .addOperation(Operation.payment({
          destination: gas.deposit_address,
          asset: Asset.native(),
          amount: xlm.toFixed(7),
        }))
        .addMemo(Memo.hash(gas.deposit_memo_hash))
        .setTimeout(180)
        .build();

      const { signedTxXdr } = await kit.signTransaction(tx.toXDR(), {
        address,
        networkPassphrase: MAINNET_PASSPHRASE,
      });

      const signed = TransactionBuilder.fromXDR(signedTxXdr, MAINNET_PASSPHRASE);
      const sent = await server.submitTransaction(signed);
      if (await register(sent.hash)) setAmount('');
    } catch (e: unknown) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Deposit failed' });
    } finally {
      setDepositing(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  const deposited = gas?.total_deposited_xlm ?? 0;
  const consumed = gas?.total_consumed_xlm ?? 0;
  const consumedPct = deposited > 0 ? Math.min((consumed / deposited) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Balance hero (mirrors the Solana panel) ── */}
      <section data-dash-panel className="rounded-2xl bg-white border border-line p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon.Gas size={15} weight="fill" className="text-ink/55" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">Available Balance</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tighter tabular-nums text-ink">{fmt(gas?.balance_xlm ?? 0)}</span>
              <span className="text-lg font-bold text-black/35">XLM</span>
            </div>

            <div className="space-y-2 max-w-xs">
              <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${consumedPct}%` }} />
              </div>
              <div className="flex items-center gap-5 text-[10px] font-semibold text-black/40">
                <span>Deposited: {fmt(deposited)} XLM</span>
                <span className="flex items-center gap-1">
                  <Icon.TrendDown size={12} weight="bold" />
                  Consumed: {fmt(consumed)} XLM
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDepositForm((v) => !v)}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-white text-sm font-semibold rounded-xl hover:bg-ink/90 transition-all active:scale-[0.97]"
          >
            <Icon.ArrowDown size={15} weight="bold" />
            Deposit XLM
          </button>
        </div>
      </section>

      {/* ── Deposit form ── */}
      {showDepositForm && (
        <div className="rounded-2xl bg-white border border-line p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Deposit XLM</h3>
            <button
              onClick={() => { setShowDepositForm(false); setMsg(null); setAmount(''); }}
              className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors rounded-lg hover:bg-black/5"
            >
              <Icon.Close size={16} weight="bold" />
            </button>
          </div>

          <p className="text-sm text-black/55">
            Connect a Stellar wallet (Freighter, xBull, Albedo, Lobstr…) and deposit —
            the payment and org memo are built for you.
          </p>

          {/* Deposits need the mainnet relayer address to send to. */}
          {!gas?.deposit_address && (
            <div className="flex items-center gap-3 p-4 bg-surface border border-line rounded-xl text-sm">
              <Icon.Wallet size={17} className="text-black/45 shrink-0" />
              <span className="text-black/55 flex-1">
                Deposits open once the Cavos mainnet relayer is configured.
              </span>
            </div>
          )}

          {/* Connect wallet prompt / connected state (mirrors the Starknet panel). */}
          {!walletAddress ? (
            <div className="flex items-center gap-3 p-4 bg-surface border border-line rounded-xl text-sm">
              <Icon.Wallet size={17} className="text-black/45 shrink-0" />
              <span className="text-black/55 flex-1">Connect your Stellar wallet to deposit.</span>
              <Button variant="outline" size="sm" onClick={connectWallet} loading={connecting}>Connect</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 text-xs text-black/50">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </span>
              <button onClick={disconnectWallet} className="text-black/35 hover:text-black transition-colors">
                Disconnect
              </button>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-black/40 block">Amount (XLM)</label>
            <Input
              type="number"
              placeholder="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.1"
              disabled={depositing}
            />
          </div>

          {msg && (
            <p className={`text-xs font-medium ${msg.kind === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
              {msg.text}
            </p>
          )}

          <Button
            variant="primary"
            onClick={depositWithWallet}
            loading={depositing}
            disabled={!walletAddress || !amount || parseFloat(amount) <= 0 || depositing || !gas?.deposit_address}
            className="w-full rounded-xl"
          >
            Deposit XLM
          </Button>

          {/* Fallback: register a deposit made elsewhere (CLI / cold wallet) by hash. */}
          <div className="pt-1 space-y-2.5 border-t border-line">
            <button
              onClick={() => setShowManual((v) => !v)}
              className="text-[11px] text-black/35 hover:text-black/60 transition-colors"
            >
              {showManual ? 'Hide' : 'Deposited elsewhere? Register by tx hash'}
            </button>
            {showManual && (
              <>
                {gas?.deposit_address && (
                  <div className="space-y-2">
                    {[
                      { label: 'Address', value: gas.deposit_address },
                      { label: 'Memo (hash, hex)', value: gas.deposit_memo_hash },
                    ].map((f) => (
                      <button
                        key={f.label}
                        onClick={() => copy(f.label, f.value)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-surface border border-line rounded-lg text-left hover:border-black/20 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-wide text-black/30 font-bold">{f.label}</div>
                          <div className="text-xs font-mono truncate text-black/70">{f.value}</div>
                        </div>
                        <span className="text-[10px] text-black/40 shrink-0">{copied === f.label ? 'Copied' : 'Copy'}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Input
                    placeholder="Deposit transaction hash…"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                  />
                  <Button variant="outline" onClick={registerManual} loading={busy} disabled={!txHash.trim()}>
                    Register
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Deposit history ── */}
      <div data-dash-panel className="rounded-2xl bg-white border border-line overflow-hidden">
        <div className="px-6 py-4 border-b border-line/70 flex items-center justify-between">
          <h3 className="text-sm font-bold">Deposit History</h3>
          <span className="text-xs text-black/30 font-medium">{deposits.length} deposits</span>
        </div>
        {deposits.length === 0 ? (
          <div className="px-6 py-16 text-center space-y-2">
            <Icon.Gas size={34} className="text-black/20 mx-auto" />
            <p className="text-sm text-black/40">No deposits yet.</p>
            <p className="text-xs text-black/25">Deposit XLM above to start sponsoring transactions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface">
                  {['Date', 'Amount', 'Status', 'Tx'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-black/35 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} className="border-t border-line/60 hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-black/50">
                        <Icon.Clock size={13} className="shrink-0" />
                        <span className="tabular-nums">{new Date(d.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums">{(d.amount_stroops / STROOPS_PER_XLM).toFixed(6)} XLM</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-line rounded-full text-[10px] font-bold uppercase tracking-wide text-black/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
                        {d.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={`https://stellar.expert/explorer/public/tx/${d.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-mono text-black/40 hover:text-black transition-colors"
                      >
                        {d.tx_hash.slice(0, 8)}…
                        <Icon.External size={13} weight="bold" className="shrink-0" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StellarGasCard;
