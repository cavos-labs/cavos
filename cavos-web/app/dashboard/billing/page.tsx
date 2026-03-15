'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Fuel, ArrowDown, Clock, ExternalLink, Wallet, CheckCircle, Loader2, X, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { connect, disconnect } from 'starknetkit';
import { RpcProvider } from 'starknet';

interface ConnectedWallet {
    id: string;
    name: string;
    icon: string | { dark: string; light: string };
    account?: { execute: (calls: unknown[]) => Promise<{ transaction_hash: string }> };
    selectedAddress: string;
}

const GAS_TANK_CONTRACT = process.env.NEXT_PUBLIC_GAS_TANK_CONTRACT_ADDRESS!;
const STRK_TOKEN = process.env.NEXT_PUBLIC_STRK_TOKEN_ADDRESS!;
const RPC_URL = process.env.NEXT_PUBLIC_STARKNET_RPC_URL!;
const FEE_BPS = 500;

type TxStatus = 'idle' | 'pending_wallet' | 'pending_confirm' | 'registering' | 'done' | 'error';

interface GasBalance {
    balance_strk: number;
    total_deposited: number;
    total_consumed: number;
    org_felt_id: string;
}

interface GasDeposit {
    id: string;
    tx_hash: string;
    amount_strk: number;
    fee_strk: number;
    net_strk: number;
    status: string;
    created_at: string;
}

function toU256Calldata(amount: string): [string, string] {
    const wei = BigInt(Math.floor(parseFloat(amount) * 1e18));
    const low = (wei & BigInt('0xffffffffffffffffffffffffffffffff')).toString();
    const high = (wei >> BigInt(128)).toString();
    return [low, high];
}

function shortAddr(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [balance, setBalance] = useState<GasBalance | null>(null);
    const [deposits, setDeposits] = useState<GasDeposit[]>([]);
    const [depositAmount, setDepositAmount] = useState('');
    const [showDepositForm, setShowDepositForm] = useState(false);

    const [walletObj, setWalletObj] = useState<ConnectedWallet | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    const [txStatus, setTxStatus] = useState<TxStatus>('idle');
    const [txError, setTxError] = useState<string | null>(null);

    const router = useRouter();

    const fetchData = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) { router.replace('/login'); return; }

        const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (!org) { setLoading(false); return; }

        setOrgId(org.id);

        const balanceRes = await fetch(`/api/gas/balance?org_id=${org.id}`);
        if (balanceRes.ok) setBalance(await balanceRes.json());

        const { data: depositData } = await supabase
            .from('gas_deposits')
            .select('*')
            .eq('org_id', org.id)
            .order('created_at', { ascending: false })
            .limit(20);

        setDeposits(depositData || []);
        setLoading(false);
    }, [router]);

    useEffect(() => {
        fetchData();
        connect({ modalMode: 'neverAsk' }).then(({ wallet, connectorData }) => {
            if (wallet && connectorData?.account) {
                setWalletObj(wallet as unknown as ConnectedWallet);
                setWalletAddress(connectorData.account);
            }
        }).catch(() => {});
    }, [fetchData]);

    const handleConnectWallet = async () => {
        const { wallet, connectorData } = await connect({ modalMode: 'alwaysAsk', dappName: 'Cavos' });
        if (wallet && connectorData?.account) {
            setWalletObj(wallet as unknown as ConnectedWallet);
            setWalletAddress(connectorData.account);
        }
    };

    const handleDisconnectWallet = async () => {
        await disconnect({ clearLastWallet: true });
        setWalletObj(null);
        setWalletAddress(null);
    };

    const handleDeposit = async () => {
        const walletRaw = walletObj as unknown as Record<string, unknown> | null;
        const account = (walletObj as unknown as { account?: ConnectedWallet['account'] })?.account;
        const hasRequest = typeof walletRaw?.request === 'function';
        if (!orgId || !balance?.org_felt_id || !depositAmount || !walletRaw) return;
        if (!hasRequest && !account?.execute) {
            setTxError('Wallet does not support transactions');
            setTxStatus('error');
            return;
        }

        setTxStatus('pending_wallet');
        setTxError(null);

        try {
            const [amountLow, amountHigh] = toU256Calldata(depositAmount);
            let txHash: string;

            if (hasRequest) {
                const callsSnake = [
                    { contract_address: STRK_TOKEN, entry_point: 'approve', calldata: [GAS_TANK_CONTRACT, amountLow, amountHigh] },
                    { contract_address: GAS_TANK_CONTRACT, entry_point: 'deposit', calldata: [balance.org_felt_id, amountLow, amountHigh] },
                ];
                const result = await (walletRaw.request as (args: { type: string; params: { calls: typeof callsSnake } }) => Promise<{ transaction_hash: string }>)({
                    type: 'wallet_addInvokeTransaction',
                    params: { calls: callsSnake },
                });
                txHash = result.transaction_hash;
            } else {
                const calls = [
                    { contractAddress: STRK_TOKEN, entrypoint: 'approve', calldata: [GAS_TANK_CONTRACT, amountLow, amountHigh] },
                    { contractAddress: GAS_TANK_CONTRACT, entrypoint: 'deposit', calldata: [balance.org_felt_id, amountLow, amountHigh] },
                ];
                const result = await account!.execute(calls);
                txHash = result.transaction_hash;
            }

            setTxStatus('pending_confirm');
            const provider = new RpcProvider({ nodeUrl: RPC_URL });
            await provider.waitForTransaction(txHash, { retryInterval: 2000 });

            setTxStatus('registering');
            const res = await fetch('/api/gas/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tx_hash: txHash, org_id: orgId }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to register deposit');
            }

            setTxStatus('done');
            setDepositAmount('');
            await fetchData();
            setTimeout(() => { setTxStatus('idle'); setShowDepositForm(false); }, 3000);
        } catch (err: unknown) {
            setTxError(err instanceof Error ? err.message : 'Transaction failed');
            setTxStatus('error');
        }
    };

    const feeAmount = depositAmount ? (parseFloat(depositAmount) * FEE_BPS / 10000) : 0;
    const netAmount = depositAmount ? (parseFloat(depositAmount) - feeAmount) : 0;
    const isDepositing = txStatus !== 'idle' && txStatus !== 'error' && txStatus !== 'done';

    const statusLabel: Record<TxStatus, string> = {
        idle: '',
        pending_wallet: 'Confirm in wallet...',
        pending_confirm: 'Waiting for confirmation...',
        registering: 'Registering deposit...',
        done: 'Deposit confirmed!',
        error: '',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-7 h-7 border-2 border-black/15 border-t-black/60 rounded-full animate-spin" />
            </div>
        );
    }

    const availableBalance = balance ? parseFloat(String(balance.balance_strk)) : 0;
    const totalDeposited = balance ? parseFloat(String(balance.total_deposited)) : 0;
    const totalConsumed = balance ? parseFloat(String(balance.total_consumed)) : 0;
    const consumedPct = totalDeposited > 0 ? Math.min(100, (totalConsumed / totalDeposited) * 100) : 0;

    return (
        <div className="space-y-6 animate-fadeIn max-w-4xl">

            {/* ── Page header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/30 mb-1.5">Billing</p>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gas Balance</h1>
                    <p className="text-xs text-black/40 mt-1 font-medium">Deposit STRK to sponsor gasless transactions for your users.</p>
                </div>

                {/* Wallet connection */}
                {walletAddress ? (
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2 px-3.5 py-2 bg-[#F7F5F2] border border-[#EAE5DC] rounded-xl text-xs font-semibold text-black/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-black/50" />
                            {shortAddr(walletAddress)}
                        </div>
                        <button
                            onClick={handleDisconnectWallet}
                            className="text-xs text-black/30 hover:text-black/60 transition-colors px-2"
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <Button variant="outline" onClick={handleConnectWallet} icon={<Wallet className="w-3.5 h-3.5" />}>
                        Connect Wallet
                    </Button>
                )}
            </div>

            {/* ── Balance card — dark ── */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0A0908] text-white p-7 dark-grain">
                <div
                    className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at top right, #EAE5DC0C 0%, transparent 65%)' }}
                />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Fuel className="w-3.5 h-3.5 text-[#EAE5DC]/50" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">Available Balance</span>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold tracking-tighter tabular-nums">{availableBalance.toFixed(4)}</span>
                                <span className="text-lg font-bold text-white/40">STRK</span>
                            </div>
                        </div>

                        {/* Progress bar: consumed vs deposited */}
                        <div className="space-y-2 max-w-xs">
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#EAE5DC]/50 rounded-full transition-all"
                                    style={{ width: `${consumedPct}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-5 text-[10px] font-semibold text-white/30">
                                <span>Deposited: {totalDeposited.toFixed(2)} STRK</span>
                                <span className="flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    Consumed: {totalConsumed.toFixed(2)} STRK
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowDepositForm(!showDepositForm)}
                        className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-[#EAE5DC] transition-all active:scale-[0.97]"
                    >
                        <ArrowDown className="w-3.5 h-3.5" />
                        Deposit STRK
                    </button>
                </div>
            </div>

            {/* ── Deposit form ── */}
            {showDepositForm && (
                <div className="rounded-2xl bg-white border border-[#EAE5DC] p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold">Deposit STRK</h3>
                        <button
                            onClick={() => { setShowDepositForm(false); setTxStatus('idle'); setTxError(null); setDepositAmount(''); }}
                            className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors rounded-lg hover:bg-black/5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Connect wallet prompt */}
                    {!walletAddress && (
                        <div className="flex items-center gap-3 p-4 bg-[#F7F5F2] border border-[#EAE5DC] rounded-xl text-sm">
                            <Wallet className="w-4 h-4 text-black/40 shrink-0" />
                            <span className="text-black/55 flex-1">Connect your wallet to deposit STRK.</span>
                            <Button variant="outline" size="sm" onClick={handleConnectWallet}>Connect</Button>
                        </div>
                    )}

                    {/* Amount input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-[0.15em] text-black/40 block">Amount (STRK)</label>
                        <Input
                            type="number"
                            placeholder="100"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={isDepositing}
                        />
                    </div>

                    {/* Fee breakdown */}
                    {depositAmount && parseFloat(depositAmount) > 0 && (
                        <div className="rounded-xl bg-[#F7F5F2] border border-[#EAE5DC] p-4 space-y-2 text-sm">
                            {[
                                { label: 'Deposit amount',    value: `${parseFloat(depositAmount).toFixed(4)} STRK`, muted: false },
                                { label: 'Platform fee (5%)', value: `-${feeAmount.toFixed(4)} STRK`,               muted: true },
                            ].map((row) => (
                                <div key={row.label} className="flex justify-between">
                                    <span className={row.muted ? 'text-black/40' : 'text-black/60'}>{row.label}</span>
                                    <span className={row.muted ? 'text-black/40' : ''}>{row.value}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-bold pt-2 border-t border-[#EAE5DC]">
                                <span>Credited to balance</span>
                                <span>{netAmount.toFixed(4)} STRK</span>
                            </div>
                        </div>
                    )}

                    {/* Tx status */}
                    {txStatus !== 'idle' && (
                        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm border ${
                            txStatus === 'done'  ? 'bg-[#F7F5F2] border-[#EAE5DC] text-black/70' :
                            txStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                            'bg-[#F7F5F2] border-[#EAE5DC] text-black/60'
                        }`}>
                            {txStatus === 'done'  ? <CheckCircle className="w-4 h-4 shrink-0 text-black/50" /> :
                             txStatus === 'error' ? <X className="w-4 h-4 shrink-0 text-red-500" /> :
                             <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
                            <span>{txStatus === 'error' ? txError : statusLabel[txStatus]}</span>
                        </div>
                    )}

                    <Button
                        variant="primary"
                        onClick={handleDeposit}
                        loading={isDepositing}
                        disabled={!walletAddress || !depositAmount || parseFloat(depositAmount) <= 0 || isDepositing}
                        className="w-full rounded-xl"
                    >
                        {isDepositing ? statusLabel[txStatus] : 'Deposit STRK'}
                    </Button>
                </div>
            )}

            {/* ── Deposit history ── */}
            <div className="rounded-2xl bg-white border border-[#EAE5DC] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#EAE5DC]/70 flex items-center justify-between">
                    <h3 className="text-sm font-bold">Deposit History</h3>
                    <span className="text-xs text-black/30 font-medium">{deposits.length} deposits</span>
                </div>

                {deposits.length === 0 ? (
                    <div className="px-6 py-16 text-center space-y-2">
                        <Fuel className="w-8 h-8 text-black/15 mx-auto" />
                        <p className="text-sm text-black/40">No deposits yet.</p>
                        <p className="text-xs text-black/25">Deposit STRK above to start sponsoring transactions.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#F7F5F2]">
                                    {['Date', 'Amount', 'Fee', 'Credited', 'Status', 'Tx'].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-black/35 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {deposits.map((deposit, i) => (
                                    <tr key={deposit.id} className={`border-t border-[#EAE5DC]/60 hover:bg-[#F7F5F2]/50 transition-colors ${i === deposits.length - 1 ? '' : ''}`}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 text-black/50">
                                                <Clock className="w-3 h-3 shrink-0" />
                                                <span className="tabular-nums">{new Date(deposit.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-semibold tabular-nums">{parseFloat(String(deposit.amount_strk)).toFixed(4)}</td>
                                        <td className="px-5 py-4 text-black/40 tabular-nums">{parseFloat(String(deposit.fee_strk)).toFixed(4)}</td>
                                        <td className="px-5 py-4 font-bold tabular-nums">{parseFloat(String(deposit.net_strk)).toFixed(4)}</td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F5F2] border border-[#EAE5DC] rounded-full text-[10px] font-bold uppercase tracking-wide text-black/50">
                                                <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
                                                {deposit.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <a
                                                href={`https://sepolia.starkscan.co/tx/${deposit.tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs font-mono text-black/40 hover:text-black transition-colors"
                                            >
                                                {deposit.tx_hash.slice(0, 8)}…
                                                <ExternalLink className="w-3 h-3 shrink-0" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── On-chain info ── */}
            <div className="relative overflow-hidden rounded-2xl bg-[#F7F5F2] border border-[#EAE5DC] p-6">
                <div className="flex gap-4 items-start">
                    <div className="p-2.5 bg-white border border-[#EAE5DC] rounded-xl shrink-0">
                        <Fuel className="w-4 h-4 text-black/50" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold">On-Chain Gas Tank</h3>
                        <p className="text-xs text-black/45 leading-relaxed max-w-2xl">
                            Your STRK deposits are held in an on-chain GasTank contract. Gas costs are deducted
                            atomically with each sponsored transaction. All balances and deductions are verifiable on-chain.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
