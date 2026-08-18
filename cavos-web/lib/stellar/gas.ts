/**
 * Stellar per-org gas metering. Off-chain stroops ledger (org_stellar_gas):
 * deposits credit an org, fees debit `feeCharged`, and sponsored reserves move
 * available → reserved. See supabase/migrations/20260818180000_stellar_org_sponsors.sql.
 *
 * Only meaningful on mainnet; testnet is always free/unmetered. On mainnet an org
 * with no balance is always blocked (402) — the relayer never sponsors unpaid
 * traffic. (No enforce/warn toggle, unlike the Solana soak window.)
 */
import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export const DEPOSIT_MEMO_PREFIX = 'cavos:gas:';
export const STROOPS_PER_XLM = 10_000_000; // 1 XLM = 10^7 stroops
/** Minimum balance to allow a sponsored tx (Soroban fees run higher than a
 *  Solana signature, so keep a generous buffer). ~2 XLM. */
export const MIN_GAS_STROOPS = 20_000_000;

/**
 * Deposit attribution memo. Stellar's MEMO_TEXT caps at 28 bytes, too small for
 * `cavos:gas:<uuid>` (46 bytes), so we use a MEMO_HASH: the 32-byte
 * sha256("cavos:gas:<org_id>"). Deterministic per org, so a deposit carrying this
 * hash memo can only be attributed to (and claimed by) that org.
 */
export function depositMemoHash(orgId: string): Buffer {
  return createHash('sha256').update(`${DEPOSIT_MEMO_PREFIX}${orgId}`).digest();
}

/** Hex form shown to users / consumed by the client to build the hash memo. */
export function depositMemoHex(orgId: string): string {
  return depositMemoHash(orgId).toString('hex');
}

/** Base64 form, matching how Horizon serializes a hash memo. */
export function depositMemoBase64(orgId: string): string {
  return depositMemoHash(orgId).toString('base64');
}

export interface StellarGas {
  /** Spendable / withdrawable. Does not include reserved. */
  balance_stroops: number;
  reserved_stroops: number;
  withdrawn_stroops: number;
  total_deposited_stroops: number;
  total_consumed_stroops: number;
}

const ZERO: StellarGas = {
  balance_stroops: 0,
  reserved_stroops: 0,
  withdrawn_stroops: 0,
  total_deposited_stroops: 0,
  total_consumed_stroops: 0,
};

/** Current ledger for an org (zeros when no row exists yet). */
export async function getStellarGas(orgId: string): Promise<StellarGas> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('org_stellar_gas')
    .select(
      'balance_stroops, reserved_stroops, withdrawn_stroops, total_deposited_stroops, total_consumed_stroops',
    )
    .eq('org_id', orgId)
    .single();
  if (!data) return { ...ZERO };
  return {
    balance_stroops: Number(data.balance_stroops),
    reserved_stroops: Number(data.reserved_stroops ?? 0),
    withdrawn_stroops: Number(data.withdrawn_stroops ?? 0),
    total_deposited_stroops: Number(data.total_deposited_stroops),
    total_consumed_stroops: Number(data.total_consumed_stroops),
  };
}

/**
 * Atomically record a deposit (deduped by tx hash) and credit the balance.
 * Returns false when the tx hash was already credited.
 */
export async function creditStellarGas(
  orgId: string,
  amountStroops: number,
  txHash: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('credit_stellar_gas', {
    p_org_id: orgId,
    p_amount_stroops: amountStroops,
    p_tx_hash: txHash,
  });
  if (error) throw error;
  return data === true;
}

/** Atomically debit consumed stroops (balance clamped at 0). */
export async function debitStellarGas(orgId: string, amountStroops: number): Promise<void> {
  if (amountStroops <= 0) return;
  const admin = createAdminClient();
  const { error } = await admin.rpc('debit_stellar_gas', {
    p_org_id: orgId,
    p_amount_stroops: amountStroops,
  });
  if (error) throw error;
}

/** Whether the org can cover `needStroops` from available (not reserved). */
export async function hasGas(orgId: string, needStroops: number = MIN_GAS_STROOPS): Promise<boolean> {
  const gas = await getStellarGas(orgId);
  return gas.balance_stroops >= needStroops;
}

/** Move available → reserved. Returns false if the org cannot cover it. */
export async function lockStellarReserves(orgId: string, amountStroops: number): Promise<boolean> {
  if (amountStroops <= 0) return true;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('lock_stellar_reserves', {
    p_org_id: orgId,
    p_amount_stroops: amountStroops,
  });
  if (error) throw error;
  return data === true;
}

/** reserved → available after sponsorship is revoked. */
export async function releaseStellarReserves(orgId: string, amountStroops: number): Promise<void> {
  if (amountStroops <= 0) return;
  const admin = createAdminClient();
  const { error } = await admin.rpc('release_stellar_reserves', {
    p_org_id: orgId,
    p_amount_stroops: amountStroops,
  });
  if (error) throw error;
}

/** Debit available for a withdrawal. Returns false if it would overdraw. */
export async function withdrawStellarGas(orgId: string, amountStroops: number): Promise<boolean> {
  if (amountStroops <= 0) return false;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('withdraw_stellar_gas', {
    p_org_id: orgId,
    p_amount_stroops: amountStroops,
  });
  if (error) throw error;
  return data === true;
}
