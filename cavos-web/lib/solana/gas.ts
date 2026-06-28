/**
 * Solana per-org gas metering. Off-chain lamports ledger (org_solana_gas):
 * deposits credit an org, relayed transactions debit the real cost. See
 * supabase/migrations/20260625_solana_gas.sql.
 *
 * Mode: SOLANA_GAS_ENFORCE_MODE
 *   enforce  (default) — return 402 when the org has no gas balance, so the
 *                        relayer never sponsors unpaid mainnet traffic.
 *   warn               — sponsor + log even with no balance (opt-in soak window).
 * Only meaningful on mainnet; devnet is always free/unmetered.
 */
import { createAdminClient } from '@/lib/supabase/admin';

export const DEPOSIT_MEMO_PREFIX = 'cavos:gas:';
/** Minimum balance to allow a sponsored tx (covers fee + a PDA-rent buffer). */
export const MIN_GAS_LAMPORTS = 3_000_000; // ~0.003 SOL
export const LAMPORTS_PER_SOL = 1_000_000_000;

export type GasEnforceMode = 'warn' | 'enforce';

export function solanaGasEnforceMode(): GasEnforceMode {
  // Enforce by default; only an explicit opt-in turns on the warn soak window.
  return process.env.SOLANA_GAS_ENFORCE_MODE === 'warn' ? 'warn' : 'enforce';
}

/** True when an insufficient-balance result should actually 402 (enforce mode). */
export function shouldBlockGas(allowed: boolean): boolean {
  return !allowed && solanaGasEnforceMode() === 'enforce';
}

/** The memo a depositor must include so the deposit is attributed to their org. */
export function depositMemo(orgId: string): string {
  return `${DEPOSIT_MEMO_PREFIX}${orgId}`;
}

export interface SolanaGas {
  balance_lamports: number;
  total_deposited_lamports: number;
  total_consumed_lamports: number;
}

const ZERO: SolanaGas = {
  balance_lamports: 0,
  total_deposited_lamports: 0,
  total_consumed_lamports: 0,
};

/** Current ledger for an org (zeros when no row exists yet). */
export async function getSolanaGas(orgId: string): Promise<SolanaGas> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('org_solana_gas')
    .select('balance_lamports, total_deposited_lamports, total_consumed_lamports')
    .eq('org_id', orgId)
    .single();
  if (!data) return { ...ZERO };
  return {
    balance_lamports: Number(data.balance_lamports),
    total_deposited_lamports: Number(data.total_deposited_lamports),
    total_consumed_lamports: Number(data.total_consumed_lamports),
  };
}

/**
 * Atomically record a deposit (deduped by signature) and credit the balance.
 * Returns false when the signature was already credited.
 */
export async function creditSolanaGas(
  orgId: string,
  amountLamports: number,
  signature: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('credit_solana_gas', {
    p_org_id: orgId,
    p_amount_lamports: amountLamports,
    p_signature: signature,
  });
  if (error) throw error;
  return data === true;
}

/** Atomically debit consumed lamports (balance clamped at 0). */
export async function debitSolanaGas(orgId: string, amountLamports: number): Promise<void> {
  if (amountLamports <= 0) return;
  const admin = createAdminClient();
  const { error } = await admin.rpc('debit_solana_gas', {
    p_org_id: orgId,
    p_amount_lamports: amountLamports,
  });
  if (error) throw error;
}

/** Whether the org has enough balance to be sponsored right now. */
export async function hasGas(orgId: string): Promise<boolean> {
  const gas = await getSolanaGas(orgId);
  return gas.balance_lamports >= MIN_GAS_LAMPORTS;
}
