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

/**
 * Program ids the relayer ALWAYS allows at the top level. These cannot move the
 * relayer's lamports and are required infrastructure: the secp256r1 precompile
 * (signature verify), the Cavos device-account program (the only thing that
 * moves user assets, gated by the device key), and ComputeBudget (fee/CU).
 */
function alwaysAllowedTopLevel(): Set<string> {
  return new Set([SECP256R1_PROGRAM_ID, deviceAccountProgramId(), COMPUTE_BUDGET_PROGRAM_ID]);
}

/**
 * Program ids whose CPI the relayer will sponsor for ANY app without explicit
 * allowlist. These are non-custodial primitives that cannot drain a wallet on
 * their own (a transfer needs an owner-signed authority) and are universally
 * needed for a usable wallet. An app's allowlist ADDS to this set.
 *
 *   System      — rent/lamport moves (rare; needed for ATA funding).
 *   SPL Token   — standard token transfers/approvals.
 *   Token-2022  — the extended token program (Token Extensions).
 *   Associated  — creating associated token accounts.
 */
export const SAFE_CPI_PROGRAM_IDS: string[] = [
  '11111111111111111111111111111111', // System
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb', // Token-2022
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Associated Token
];

/** Programs the relayer NEVER sponsors a CPI to, regardless of allowlist. */
const BLOCKED_CPI_PROGRAM_IDS: Set<string> = new Set([
  'BPFLoader2111111111111111111111111111111111', // program deploy/upgrade
  'BPFLoaderUpgradeab1e11111111111111111111111',
  'UpgradeableLoader11111111111111111111111111',
]);

/**
 * Max compute units a sponsored `execute` may request. Holgura para swaps/DeFi
 * sin abrir ventana de abuso: una tx normal consume <300k CU; esto acota el
 * coste por tx que Cavos bancariza. The relayer rejects a ComputeBudget request
 * above this, and (defence in depth) treats any tx that looks likely to exceed
 * it as suspect.
 */
export const MAX_SPONSORED_COMPUTE_UNITS = 1_000_000;

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * Reject any transaction the relayer should not sponsor. Enforces:
 *  - the fee payer is the relayer (so the relayer only ever pays its own fees);
 *  - every top-level instruction is infrastructure-only (precompile / Cavos /
 *    ComputeBudget) — NOTHING else runs at the top level;
 *  - at least one instruction is a real Cavos device-account call;
 *  - for every Cavos `execute` instruction, the CPI programs it embeds are in
 *    the app's allowlist (or the always-safe set), and none are blocked;
 *  - the requested compute budget is within the sponsored cap.
 *
 * `appAllowedPrograms` is the per-app allowlist from `apps.allowed_solana_programs`.
 */
export function validateSponsoredTransaction(
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

  const topLevel = alwaysAllowedTopLevel();
  const program = deviceAccountProgramId();
  const allowedCpi = new Set<string>([...SAFE_CPI_PROGRAM_IDS, ...appAllowedPrograms]);

  let hasDeviceCall = false;
  let requestedCu = 0;

  for (const ix of tx.instructions) {
    const pid = ix.programId.toBase58();

    // ComputeBudget inspection (cap sponsored CU).
    if (pid === COMPUTE_BUDGET_PROGRAM_ID) {
      const cu = parseComputeUnitLimit(ix.data);
      if (cu !== null) requestedCu = Math.max(requestedCu, cu);
      continue;
    }

    // Top level must be infrastructure only.
    if (!topLevel.has(pid)) {
      return { ok: false, reason: `top-level instruction to non-whitelisted program ${pid}` };
    }

    if (pid === program) {
      hasDeviceCall = true;
      // Inspect the inner CPI targets of a Cavos `execute` against the allowlist.
      const disc = ix.data.subarray(0, 8);
      if (equalsDiscriminator(disc, 'execute')) {
        const inner = deserializeExecuteProgramIds(ix.data);
        for (const innerPid of inner) {
          if (BLOCKED_CPI_PROGRAM_IDS.has(innerPid)) {
            return { ok: false, reason: `execute targets blocked program ${innerPid}` };
          }
          if (!allowedCpi.has(innerPid)) {
            return {
              ok: false,
              reason: `execute targets program ${innerPid} not in app allowlist`,
            };
          }
        }
      }
    }
  }

  if (!hasDeviceCall) {
    return { ok: false, reason: 'no cavos-device-account instruction present' };
  }
  if (requestedCu > MAX_SPONSORED_COMPUTE_UNITS) {
    return {
      ok: false,
      reason: `requested compute units ${requestedCu} exceed sponsored cap ${MAX_SPONSORED_COMPUTE_UNITS}`,
    };
  }
  return { ok: true };
}

/** ComputeBudget instruction discriminator (sha256("global:SetComputeUnitLimit")[..8]). */
const SET_CU_LIMIT_DISC = Buffer.from([0x20, 0xb5, 0xc0, 0x1c, 0xe2, 0x6e, 0x6d, 0xd6]);
function parseComputeUnitLimit(data: Buffer): number | null {
  // SetComputeUnitLimit: discriminator(8) + u32 LE units
  if (data.length === 12 && data.subarray(0, 8).equals(SET_CU_LIMIT_DISC)) {
    return data.readUInt32LE(8);
  }
  return null;
}

/** Compare an instruction data prefix against an anchor discriminator. */
function equalsDiscriminator(prefix: Buffer, name: string): boolean {
  // Anchor discriminator = sha256(`global:${name}`)[..8]
  const { createHash } = require('node:crypto');
  return prefix.equals(createHash('sha256').update(`global:${name}`).digest().subarray(0, 8));
}

/**
 * Extract the CPI program ids embedded in a Cavos `execute` instruction. The
 * wire format is: discriminator(8) + Borsh Vec<u8> = discriminator(8) +
 * u32_blob_len + blob, where blob = concat[ programId(32) + accounts(u32 +
 * N*(32+2)) + data(u32 + M) ]. The signed hash is over the inner blob only;
 * this parser skips the discriminator AND the vec length to read the blob.
 *
 * Returns every program_id across all embedded instructions.
 */
function deserializeExecuteProgramIds(data: Buffer): string[] {
  const pids: string[] = [];
  // discriminator(8) + Borsh Vec<u8> length(4) = 12 bytes before the blob.
  let off = 12;
  while (off < data.length) {
    if (off + 32 > data.length) break;
    pids.push(new PublicKey(data.subarray(off, off + 32)).toBase58());
    off += 32;
    // accounts vec: u32 len, then len * (32 pubkey + 2 bools)
    if (off + 4 > data.length) break;
    const accLen = data.readUInt32LE(off);
    off += 4 + accLen * (32 + 2);
    // data vec: u32 len, then len bytes
    if (off + 4 > data.length) break;
    const dataLen = data.readUInt32LE(off);
    off += 4 + dataLen;
  }
  return pids;
}

export function connectionFor(network: SolanaNetwork): Connection {
  return new Connection(rpcUrl(network), 'confirmed');
}
