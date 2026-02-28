'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Fuel, ArrowDown, Clock, ExternalLink, Wallet, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { connect, disconnect } from 'starknetkit';
import { RpcProvider } from 'starknet';

// Wallets inject account + selectedAddress at runtime on top of the base type
interface ConnectedWallet {
  id: string;
  name: string;
  icon: string | { dark: string; light: string };
    account: { execute: (calls: unknown[]) => Promise<{ transaction_hash: string }> };
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

// Convert STRK float to u256 calldata [low, high]
function toU256Calldata(amount: string): [string, string] {
  const wei = BigInt(Math.floor(parseFloat(amount) * 1e18));
    const low = (wei & BigInt('0xffffffffffffffffffffffffffffffff')).toString();
  const high = (wei >> BigInt(128)).toString();
  return [low, high];
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [balance, setBalance] = useState<GasBalance | null>(null);
  const [deposits, setDeposits] = useState<GasDeposit[]>([]);
    const [depositAmount, setDepositAmount] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);

  // Wallet state
  const [walletObj, setWalletObj] = useState<ConnectedWallet | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Deposit flow state
    const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txError, setTxError] = useState<string | null>(null);

  const router = useRouter();

  const fetchData = useCallback(async () => {
    const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
            router.replace('/login');
      return;
    }

    const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('owner_id', user.id)
      .single();

    if (!org) {
      setLoading(false);
      return;
    }

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
    // Try to restore last connected wallet
    // Silently restore last connected wallet if previously authorized
        connect({ modalMode: 'neverAsk' }).then(({ wallet, connectorData }) => {
        if (wallet && connectorData?.account) {
          setWalletObj(wallet as unknown as ConnectedWallet);
          setWalletAddress(connectorData.account);
        }
        }).catch(() => {});
  }, [fetchData]);

  const handleConnectWallet = async () => {
    const { wallet, connectorData } = await connect({
            modalMode: 'alwaysAsk',
            dappName: 'Cavos',
    });
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
    const account = (
      walletObj as unknown as { account?: ConnectedWallet["account"] }
    )?.account;
    const hasRequest = typeof walletRaw?.request === "function";
    if (!orgId || !balance?.org_felt_id || !depositAmount) return;
    if (!walletRaw) return;
    if (!hasRequest && !account?.execute) {
      setTxError("Wallet does not support transactions");
      setTxStatus("error");
      return;
    }

    setTxStatus("pending_wallet");
    setTxError(null);

    try {
      const [amountLow, amountHigh] = toU256Calldata(depositAmount);
      let txHash: string;
      if (hasRequest) {
        const callsSnake = [
          {
            contract_address: STRK_TOKEN,
            entry_point: "approve",
            calldata: [GAS_TANK_CONTRACT, amountLow, amountHigh],
          },
          {
            contract_address: GAS_TANK_CONTRACT,
            entry_point: "deposit",
            calldata: [balance.org_felt_id, amountLow, amountHigh],
          },
        ];
        const result = await (walletRaw.request as (args: {
          type: string;
          params: { calls: typeof callsSnake };
        }) => Promise<{ transaction_hash: string }>)({
          type: "wallet_addInvokeTransaction",
          params: { calls: callsSnake },
        });
        txHash = result.transaction_hash;
      } else {
        const calls = [
          {
            contractAddress: STRK_TOKEN,
            entrypoint: "approve",
            calldata: [GAS_TANK_CONTRACT, amountLow, amountHigh],
          },
          {
            contractAddress: GAS_TANK_CONTRACT,
            entrypoint: "deposit",
            calldata: [balance.org_felt_id, amountLow, amountHigh],
          },
        ];
        const result = await account!.execute(calls);
        txHash = result.transaction_hash;
      }

      setTxStatus("pending_confirm");
      const provider = new RpcProvider({ nodeUrl: RPC_URL });
      await provider.waitForTransaction(txHash, { retryInterval: 2000 });

      setTxStatus("registering");
      const res = await fetch("/api/gas/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_hash: txHash, org_id: orgId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to register deposit");
      }

      setTxStatus("done");
      setDepositAmount("");
      await fetchData();
      setTimeout(() => {
        setTxStatus("idle");
        setShowDepositForm(false);
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setTxError(message);
      setTxStatus("error");
    }
  };

  const feeAmount = depositAmount
    ? (parseFloat(depositAmount) * FEE_BPS) / 10000
    : 0;
  const netAmount = depositAmount ? parseFloat(depositAmount) - feeAmount : 0;
  const isDepositing =
    txStatus !== "idle" && txStatus !== "error" && txStatus !== "done";

  const statusLabel: Record<TxStatus, string> = {
    idle: "",
    pending_wallet: "Confirm in wallet...",
    pending_confirm: "Waiting for confirmation...",
    registering: "Registering deposit...",
    done: "Deposit confirmed!",
    error: "",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
                    <h1 className="text-3xl font-semibold tracking-tight mb-2">Gas Balance</h1>
                    <p className="text-black/60">Deposit STRK to sponsor gasless transactions for your users.</p>
        </div>

        {walletAddress ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
            <button
              onClick={handleDisconnectWallet}
              className="text-xs text-black/40 hover:text-black/70"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <Button variant="secondary" onClick={handleConnectWallet}>
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </div>

      {/* Balance Card */}
      <Card className="bg-linear-to-br from-black/2 to-black/5 border-black/10">
        <div className="flex flex-col md:flex-row justify-between gap-6 md:items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Fuel className="w-5 h-5 text-black/60" />
              <span className="text-sm text-black/60">Available Balance</span>
            </div>
            <h2 className="text-3xl font-bold mb-1">
                            {balance ? parseFloat(String(balance.balance_strk)).toFixed(4) : '0.0000'} STRK
            </h2>
            <div className="flex gap-4 mt-2 text-sm text-black/50">
                            <span>Deposited: {balance ? parseFloat(String(balance.total_deposited)).toFixed(2) : '0.00'} STRK</span>
                            <span>Consumed: {balance ? parseFloat(String(balance.total_consumed)).toFixed(2) : '0.00'} STRK</span>
            </div>
          </div>

                    <Button variant="primary" onClick={() => setShowDepositForm(!showDepositForm)}>
            <ArrowDown className="w-4 h-4 mr-2" />
            Deposit STRK
          </Button>
        </div>
      </Card>

      {/* Deposit Form */}
      {showDepositForm && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Deposit STRK</h3>

          {!walletAddress && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-3">
              <Wallet className="w-4 h-4 shrink-0" />
              <span>Connect your wallet to deposit STRK.</span>
                            <Button variant="secondary" onClick={handleConnectWallet} className="ml-auto shrink-0">
                Connect
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <div>
                            <label className="text-sm font-medium text-black/70 block mb-1">Amount (STRK)</label>
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

            {depositAmount && parseFloat(depositAmount) > 0 && (
              <div className="p-4 bg-black/5 rounded-lg text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-black/60">Deposit amount</span>
                  <span>{parseFloat(depositAmount).toFixed(4)} STRK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Platform fee (5%)</span>
                  <span>-{feeAmount.toFixed(4)} STRK</span>
                </div>
                <div className="border-t border-black/10 pt-2 flex justify-between font-medium">
                  <span>Credited to balance</span>
                  <span>{netAmount.toFixed(4)} STRK</span>
                </div>
              </div>
            )}

                        {txStatus !== 'idle' && (
                            <div className={`p-4 rounded-lg text-sm flex items-center gap-3 ${
                                txStatus === 'done' ? 'bg-green-50 border border-green-200 text-green-700' :
                                txStatus === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
                                'bg-blue-50 border border-blue-200 text-blue-700'
                            }`}>
                                {txStatus === 'done' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                                ) : txStatus === 'error' ? (
                  <span className="shrink-0">✕</span>
                ) : (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                )}
                                <span>{txStatus === 'error' ? txError : statusLabel[txStatus]}</span>
              </div>
            )}

            <Button
              variant="primary"
              onClick={handleDeposit}
              loading={isDepositing}
                            disabled={!walletAddress || !depositAmount || parseFloat(depositAmount) <= 0 || isDepositing}
              className="w-full"
            >
                            {isDepositing ? statusLabel[txStatus] : 'Deposit STRK'}
            </Button>
          </div>
        </Card>
      )}

      {/* Deposit History */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Deposit History</h3>
        {deposits.length === 0 ? (
          <p className="text-sm text-black/50 text-center py-8">
            No deposits yet. Deposit STRK to start sponsoring transactions.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left">
                  <th className="pb-3 font-medium text-black/60">Date</th>
                  <th className="pb-3 font-medium text-black/60">Amount</th>
                  <th className="pb-3 font-medium text-black/60">Fee</th>
                  <th className="pb-3 font-medium text-black/60">Credited</th>
                  <th className="pb-3 font-medium text-black/60">Status</th>
                  <th className="pb-3 font-medium text-black/60">Tx</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="border-b border-black/5">
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-black/40" />
                        {new Date(deposit.created_at).toLocaleDateString()}
                      </div>
                    </td>
                                        <td className="py-3">{parseFloat(String(deposit.amount_strk)).toFixed(4)} STRK</td>
                                        <td className="py-3 text-black/50">{parseFloat(String(deposit.fee_strk)).toFixed(4)}</td>
                                        <td className="py-3 font-medium">{parseFloat(String(deposit.net_strk)).toFixed(4)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                        {deposit.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <a
                        href={`https://sepolia.starkscan.co/tx/${deposit.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {deposit.tx_hash.slice(0, 8)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="p-6 bg-black/5 rounded-xl">
        <div className="flex gap-4 items-start">
          <Fuel className="w-6 h-6 text-black/60 mt-1" />
          <div>
            <h3 className="font-semibold mb-1">On-Chain Gas Tank</h3>
            <p className="text-sm text-black/60 max-w-2xl">
                            Your STRK deposits are held in an on-chain GasTank contract. Gas costs are deducted
                            atomically with each sponsored transaction. All balances and deductions are verifiable on-chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}