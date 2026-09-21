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

/** Solana's per-transaction ceiling, and the default when none is requested. */
const MAX_TX_COMPUTE_UNITS = 1_400_000;
const DEFAULT_CU_PER_INSTRUCTION = 200_000;

export const MAX_SPONSORED_COMPUTE_UNITS = 1_000_000;
/** Priority fee is charged on the REQUESTED unit limit, so it is bounded up front. */
export const MAX_SPONSORED_PRIORITY_FEE_LAMPORTS = 1_000_000;
/** Each costs the relayer ~0.002 SOL of rent. */
export const MAX_SPONSORED_ATA_CREATIONS = 2;

const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
const ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

// ComputeBudget encodes a 1-byte discriminant followed by a little-endian payload.
const CU_LIMIT_IX = 2; // u32, 5 bytes total
const CU_PRICE_IX = 3; // u64, 9 bytes total

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * The relayer signs as fee payer, and a fee payer is always a signer — so any
 * instruction naming it as authority is self-authorizing. Rather than enumerate
 * the instructions that could spend it (the reason `CreateAccount` slipped past
 * an earlier `Transfer`-only check), the relayer may not appear in an
 * instruction at all, with one exception: funding a token account for someone
 * else, which is what makes a zero-SOL user able to receive SPL tokens.
 */
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
  const userSigned = tx.signatures.some((s) => s.signature && !s.publicKey.equals(relayer));
  if (!userSigned) {
    return { ok: false, reason: 'native transaction is missing the user signature' };
  }

  const allowed = new Set<string>([
    SYSTEM_PROGRAM_ID,
    COMPUTE_BUDGET_PROGRAM_ID,
    ...SAFE_CPI_PROGRAM_IDS,
    ...appAllowedPrograms,
  ]);

  let requestedCu: number | null = null;
  let unitPrice = 0n;
  let ataCreations = 0;

  for (const ix of tx.instructions) {
    const pid = ix.programId.toBase58();

    if (pid === COMPUTE_BUDGET_PROGRAM_ID) {
      const data = Buffer.from(ix.data);
      if (data.length === 5 && data[0] === CU_LIMIT_IX) requestedCu = data.readUInt32LE(1);
      else if (data.length === 9 && data[0] === CU_PRICE_IX) unitPrice = data.readBigUInt64LE(1);
      continue;
    }

    if (!allowed.has(pid)) {
      return { ok: false, reason: `top-level instruction to non-whitelisted program ${pid}` };
    }

    if (ix.keys.some((k) => k.pubkey.equals(relayer))) {
      if (!isRelayerFundedTokenAccount(ix, pid, relayer)) {
        return { ok: false, reason: 'instruction would spend from the relayer' };
      }
      if (++ataCreations > MAX_SPONSORED_ATA_CREATIONS) {
        return {
          ok: false,
          reason: `more than ${MAX_SPONSORED_ATA_CREATIONS} relayer-funded token accounts`,
        };
      }
    }
  }

  const effectiveCu =
    requestedCu ??
    Math.min(tx.instructions.length * DEFAULT_CU_PER_INSTRUCTION, MAX_TX_COMPUTE_UNITS);
  if (effectiveCu > MAX_SPONSORED_COMPUTE_UNITS) {
    return {
      ok: false,
      reason: `requested compute units ${effectiveCu} exceed sponsored cap ${MAX_SPONSORED_COMPUTE_UNITS}`,
    };
  }

  const priorityFee = (BigInt(effectiveCu) * unitPrice + 999_999n) / 1_000_000n;
  if (priorityFee > BigInt(MAX_SPONSORED_PRIORITY_FEE_LAMPORTS)) {
    return {
      ok: false,
      reason: `priority fee ${priorityFee} lamports exceeds sponsored cap ${MAX_SPONSORED_PRIORITY_FEE_LAMPORTS}`,
    };
  }

  return { ok: true };
}

/**
 * An Associated Token Account create, paid for by the relayer and owned by
 * someone else. Data is empty (Create), [0] (Create) or [1] (CreateIdempotent);
 * [2] is RecoverNested, which moves tokens and is never sponsored.
 */
function isRelayerFundedTokenAccount(
  ix: { data: Buffer; keys: { pubkey: PublicKey }[] },
  programId: string,
  relayer: PublicKey,
): boolean {
  if (programId !== ASSOCIATED_TOKEN_PROGRAM_ID) return false;
  const data = Buffer.from(ix.data);
  const isCreate = data.length === 0 || (data.length === 1 && (data[0] === 0 || data[0] === 1));
  if (!isCreate) return false;
  return (
    (ix.keys[0]?.pubkey.equals(relayer) ?? false) &&
    !ix.keys.slice(1).some((k) => k.pubkey.equals(relayer))
  );
}

export function connectionFor(network: SolanaNetwork): Connection {
  return new Connection(rpcUrl(network), 'confirmed');
}
