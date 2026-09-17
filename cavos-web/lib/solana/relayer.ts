/**
 * Solana sponsoring relayer — fee payer for native system-account transactions.
 * The relayer never holds user funds. The user signs the spend; the relayer
 * only co-signs as fee payer after the whitelist check.
 */
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export const COMPUTE_BUDGET_PROGRAM_ID = 'ComputeBudget111111111111111111111111111111';

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

export const SAFE_CPI_PROGRAM_IDS: string[] = [
  '11111111111111111111111111111111', // System
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', // Token-2022
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Associated Token
];

export const MAX_SPONSORED_COMPUTE_UNITS = 1_000_000;

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
const SYSTEM_TRANSFER_IX = 2;

export function validateNativeSponsoredTransaction(
  tx: Transaction,
  relayer: PublicKey,
  appAllowedPrograms: string[] = [],
): ValidationResult {
  if (!tx.feePayer || !tx.feePayer.equals(relayer)) {
    return { ok: false, reason: 'fee payer must be the Cavos relayer' };
  }
  if (tx.instructions.length === 0) {
    return { ok: false, reason: 'empty transaction' };
  }

  const allowed = new Set<string>([
    SYSTEM_PROGRAM_ID,
    COMPUTE_BUDGET_PROGRAM_ID,
    ...SAFE_CPI_PROGRAM_IDS,
    ...appAllowedPrograms,
  ]);
  let requestedCu = 0;
  let userSigned = false;

  for (const sig of tx.signatures) {
    if (!sig.signature) continue;
    if (!sig.publicKey.equals(relayer)) userSigned = true;
  }
  if (!userSigned) {
    return { ok: false, reason: 'native transaction is missing the user signature' };
  }

  for (const ix of tx.instructions) {
    const pid = ix.programId.toBase58();
    if (pid === COMPUTE_BUDGET_PROGRAM_ID) {
      const cu = parseComputeUnitLimit(ix.data);
      if (cu !== null) requestedCu = Math.max(requestedCu, cu);
      continue;
    }
    if (!allowed.has(pid)) {
      return { ok: false, reason: `top-level instruction to non-whitelisted program ${pid}` };
    }
    if (pid === SYSTEM_PROGRAM_ID && isSystemTransferFrom(ix, relayer)) {
      return { ok: false, reason: 'native transaction must not transfer from the relayer' };
    }
  }
  if (requestedCu > MAX_SPONSORED_COMPUTE_UNITS) {
    return {
      ok: false,
      reason: `requested compute units ${requestedCu} exceed sponsored cap ${MAX_SPONSORED_COMPUTE_UNITS}`,
    };
  }
  return { ok: true };
}

function isSystemTransferFrom(
  ix: { programId: PublicKey; data: Buffer; keys: { pubkey: PublicKey }[] },
  relayer: PublicKey,
): boolean {
  const data = Buffer.from(ix.data);
  if (data.length < 4) return false;
  if (data.readUInt32LE(0) !== SYSTEM_TRANSFER_IX) return false;
  return ix.keys[0]?.pubkey.equals(relayer) ?? false;
}

const SET_CU_LIMIT_DISC = Buffer.from([0x20, 0xb5, 0xc0, 0x1c, 0xe2, 0x6e, 0x6d, 0xd6]);
function parseComputeUnitLimit(data: Buffer): number | null {
  if (data.length === 12 && data.subarray(0, 8).equals(SET_CU_LIMIT_DISC)) {
    return data.readUInt32LE(8);
  }
  return null;
}

export function connectionFor(network: SolanaNetwork): Connection {
  return new Connection(rpcUrl(network), 'confirmed');
}
