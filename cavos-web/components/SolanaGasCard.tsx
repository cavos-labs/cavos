'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';

/** Minimal injected-wallet (Phantom-compatible) provider shape. */
interface SolanaProvider {
  publicKey?: { toBase58(): string };
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  /** Sign only — we submit via our own devnet RPC so the deposit lands on the
   *  right cluster regardless of the wallet's selected network. */
  signTransaction(tx: Transaction): Promise<Transaction>;
}
function getProvider(): SolanaProvider | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { phantom?: { solana?: SolanaProvider }; solana?: SolanaProvider };
  return w.phantom?.solana ?? w.solana ?? null;
}

interface SolanaGas {
  balance_sol: number;
  total_deposited_sol: number;
  total_consumed_sol: number;
  deposit_address: string | null;
  deposit_memo: string;
}

interface SolanaDeposit {
  id: string;
  signature: string;
  amount_lamports: number;
  status: string;
  created_at: string;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Per-org Solana gas balance + deposit flow. Unlike the Starknet GasTank (on
 * chain), Solana gas is a prepaid off-chain ledger: deposit SOL to the Cavos
 * relayer address WITH the shown memo, then register the tx signature.
 */
export function SolanaGasCard({ orgId }: { orgId: string }) {
  const [gas, setGas] = useState<SolanaGas | null>(null);
  const [deposits, setDeposits] = useState<SolanaDeposit[]>([]);
  const [signature, setSignature] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [walletPubkey, setWalletPubkey] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/solana/gas/balance?org_id=${orgId}`);
    if (res.ok) setGas(await res.json());
    const { data } = await createClient()
      .from('solana_gas_deposits')
      .select('id, signature, amount_lamports, status, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20);
    setDeposits((data as SolanaDeposit[]) ?? []);
  }, [orgId]);

  useEffect(() => { refresh(); }, [refresh]);

  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  /** Register a confirmed deposit tx with the backend (credits the org). */
  const register = useCallback(async (sig: string): Promise<boolean> => {
    const res = await fetch('/api/solana/gas/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, signature: sig, network: 'solana-mainnet' }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ kind: 'ok', text: `Credited ${data.deposit.amount_sol} SOL` });
      await refresh();
      return true;
    }
    setMsg({ kind: 'err', text: data.error ?? 'Deposit failed' });
    return false;
  }, [orgId, refresh]);

  const registerDeposit = async () => {
    if (!signature.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      if (await register(signature.trim())) setSignature('');
    } catch {
      setMsg({ kind: 'err', text: 'Network error' });
    } finally {
      setBusy(false);
    }
  };

  const connectWallet = async () => {
    const provider = getProvider();
    if (!provider) {
      setMsg({ kind: 'err', text: 'No Solana wallet found. Install Phantom.' });
      return;
    }
    try {
      const { publicKey } = await provider.connect();
      setWalletPubkey(publicKey.toBase58());
      setMsg(null);
    } catch {
      setMsg({ kind: 'err', text: 'Wallet connection rejected' });
    }
  };

  /** Connect-wallet deposit: build transfer + memo, wallet signs & sends, then register. */
  const depositWithWallet = async () => {
    const provider = getProvider();
    if (!provider || !walletPubkey || !gas?.deposit_address) return;
    const sol = parseFloat(amount);
    if (!sol || sol <= 0) return;

    setDepositing(true);
    setMsg(null);
    try {
      const connection = new Connection(MAINNET_RPC, 'confirmed');
      const from = new PublicKey(walletPubkey);
      const lamports = Math.round(sol * LAMPORTS_PER_SOL);
      const tx = new Transaction()
        .add(SystemProgram.transfer({ fromPubkey: from, toPubkey: new PublicKey(gas.deposit_address), lamports }))
        .add(new TransactionInstruction({ keys: [], programId: MEMO_PROGRAM_ID, data: Buffer.from(gas.deposit_memo, 'utf8') }));
      tx.feePayer = from;
      tx.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;

      const signed = await provider.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, 'confirmed');
      if (await register(sig)) setAmount('');
    } catch (e: unknown) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Deposit failed' });
    } finally {
      setDepositing(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  const deposited = gas?.total_deposited_sol ?? 0;
  const consumed = gas?.total_consumed_sol ?? 0;
  const consumedPct = deposited > 0 ? Math.min((consumed / deposited) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Balance hero (mirrors the Starknet panel) ── */}
      <section data-dash-panel className="rounded-2xl bg-white border border-line p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon.Gas size={15} weight="fill" className="text-ink/55" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">Available Balance</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tighter tabular-nums text-ink">{fmt(gas?.balance_sol ?? 0)}</span>
              <span className="text-lg font-bold text-black/35">SOL</span>
            </div>

            <div className="space-y-2 max-w-xs">
              <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${consumedPct}%` }} />
              </div>
              <div className="flex items-center gap-5 text-[10px] font-semibold text-black/40">
                <span>Deposited: {fmt(deposited)} SOL</span>
                <span className="flex items-center gap-1">
                  <Icon.TrendDown size={12} weight="bold" />
                  Consumed: {fmt(consumed)} SOL
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDepositForm((v) => !v)}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-white text-sm font-semibold rounded-xl hover:bg-ink/90 transition-all active:scale-[0.97]"
          >
            <Icon.ArrowDown size={15} weight="bold" />
            Deposit SOL
          </button>
        </div>
      </section>

      {/* ── Deposit form ── */}
      {showDepositForm && (
        <div className="rounded-2xl bg-white border border-line p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Deposit SOL</h3>
            <button
              onClick={() => { setShowDepositForm(false); setMsg(null); setAmount(''); }}
              className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors rounded-lg hover:bg-black/5"
            >
              <Icon.Close size={16} weight="bold" />
            </button>
          </div>

          {/* Connect wallet prompt / connected state */}
          {!walletPubkey ? (
            <div className="flex items-center gap-3 p-4 bg-surface border border-line rounded-xl text-sm">
              <Icon.Wallet size={17} className="text-black/45 shrink-0" />
              <span className="text-black/55 flex-1">Connect your Solana wallet (Phantom) to deposit.</span>
              <Button variant="outline" size="sm" onClick={connectWallet}>Connect</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-black/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {walletPubkey.slice(0, 6)}…{walletPubkey.slice(-4)}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-black/40 block">Amount (SOL)</label>
            <Input
              type="number"
              placeholder="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.001"
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
            disabled={!walletPubkey || !amount || parseFloat(amount) <= 0 || depositing}
            className="w-full rounded-xl"
          >
            Deposit SOL
          </Button>

          {/* Fallback: register a deposit made by CLI / another wallet by signature. */}
          <div className="pt-1 space-y-2.5 border-t border-line">
            <button
              onClick={() => setShowManual((v) => !v)}
              className="text-[11px] text-black/35 hover:text-black/60 transition-colors"
            >
              {showManual ? 'Hide' : 'Deposited elsewhere? Register by signature'}
            </button>
            {showManual && (
              <>
                {gas?.deposit_address && (
                  <div className="space-y-2">
                    {[
                      { label: 'Address', value: gas.deposit_address },
                      { label: 'Memo', value: gas.deposit_memo },
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
                    placeholder="Deposit transaction signature…"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                  />
                  <Button variant="outline" onClick={registerDeposit} loading={busy} disabled={!signature.trim()}>
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
            <p className="text-xs text-black/25">Deposit SOL above to start sponsoring transactions.</p>
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
                    <td className="px-5 py-4 font-semibold tabular-nums">{(d.amount_lamports / LAMPORTS_PER_SOL).toFixed(6)} SOL</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-line rounded-full text-[10px] font-bold uppercase tracking-wide text-black/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
                        {d.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={`https://explorer.solana.com/tx/${d.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-mono text-black/40 hover:text-black transition-colors"
                      >
                        {d.signature.slice(0, 8)}…
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

export default SolanaGasCard;
