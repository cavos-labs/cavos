/**
 * Solana sponsoring relayer — server-side fee payer for Cavos device-account
 * transactions. The relayer ONLY pays fees/rent; it never holds user funds and
 * is not a custodian. User assets live in their device-account PDAs, controlled
 * solely by P-256 device keys (verified on-chain by the secp256r1 precompile).
 *
 * Security model: the relayer never signs blindly. It co-signs only transactions
 * whose top-level instructions are exclusively the Cavos device-account flow
 * (secp256r1 precompile + the device-account program, optionally ComputeBudget).
 * Any other instruction — e.g. a SystemProgram.transfer draining the fee payer —
 * is rejected. So even a compromised endpoint/env can lose at most the relayer's
 * bounded hot float, never user or org funds.
 */
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export const SECP256R1_PROGRAM_ID = 'Secp256r1SigVerify1111111111111111111111111';
export const COMPUTE_BUDGET_PROGRAM_ID = 'ComputeBudget111111111111111111111111111111';

/** Deployed cavos-device-account program (override via env for other clusters). */
export function deviceAccountProgramId(): string {
  return process.env.SOLANA_DEVICE_ACCOUNT_PROGRAM_ID ?? 'FHnoYNfYAmFrwt18gcBGG7G1S5q3RAbCBvrV2D29izNJ';
}

export type SolanaNetwork = 'solana-devnet' | 'solana-mainnet';

export function isSupportedSolanaNetwork(n: string): n is SolanaNetwork {
  return n === 'solana-devnet' || n === 'solana-mainnet';
}

export function rpcUrl(network: SolanaNetwork): string {
  if (network === 'solana-mainnet') {
    return process.env.SOLANA_MAINNET_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
  }
  return process.env.SOLANA_DEVNET_RPC_URL ?? 'https://api.devnet.solana.com';
}

/** Program ids the relayer is willing to co-sign at the transaction top level. */
function allowedProgramIds(): Set<string> {
  return new Set([
    SECP256R1_PROGRAM_ID,
    deviceAccountProgramId(),
    COMPUTE_BUDGET_PROGRAM_ID,
  ]);
}

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * Reject any transaction the relayer should not sponsor. Enforces:
 *  - the fee payer is the relayer (so the relayer only ever pays its own fees);
 *  - every instruction targets a whitelisted program (no SystemProgram transfer,
 *    no token transfer, nothing that could move the relayer's lamports out);
 *  - at least one instruction is a real device-account call.
 */
export function validateSponsoredTransaction(tx: Transaction, relayer: PublicKey): ValidationResult {
  if (!tx.feePayer || !tx.feePayer.equals(relayer)) {
    return { ok: false, reason: 'fee payer must be the Cavos relayer' };
  }
  if (tx.instructions.length === 0) {
    return { ok: false, reason: 'empty transaction' };
  }
  const allowed = allowedProgramIds();
  const program = deviceAccountProgramId();
  let hasDeviceCall = false;
  for (const ix of tx.instructions) {
    const pid = ix.programId.toBase58();
    if (!allowed.has(pid)) {
      return { ok: false, reason: `instruction to non-whitelisted program ${pid}` };
    }
    if (pid === program) hasDeviceCall = true;
  }
  if (!hasDeviceCall) {
    return { ok: false, reason: 'no cavos-device-account instruction present' };
  }
  return { ok: true };
}

export function connectionFor(network: SolanaNetwork): Connection {
  return new Connection(rpcUrl(network), 'confirmed');
}
