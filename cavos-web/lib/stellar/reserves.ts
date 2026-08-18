/**
 * How much XLM a sponsored Stellar tx will lock on the sponsor.
 *
 * Stellar min-balance is (2 + subentries + num_sponsoring - num_sponsored) ×
 * base_reserve. When we fully sponsor a new account we pick up:
 *   - 2 × base_reserve for the account itself
 *   - 1 × base_reserve per extra signer
 *   - 1 × base_reserve per data entry / trustline
 *
 * The pre-submit estimate is a conservative upper bound used to 402 before
 * we touch Horizon. After submit we lock the *exact* Δ num_sponsoring ×
 * base_reserve from the sponsor account.
 */
import type { FeeBumpTransaction, Transaction } from '@stellar/stellar-sdk';

/** Protocol-18 default; overwritten by the latest ledger when Horizon is up. */
export const DEFAULT_BASE_RESERVE_STROOPS = 5_000_000; // 0.5 XLM

/** Buffer we require on top of a reserve estimate so the fee itself is covered. */
export const FEE_BUFFER_STROOPS = 2_000_000; // 0.2 XLM

export async function fetchBaseReserveStroops(server: {
  ledgers: () => any;
}): Promise<number> {
  try {
    const page = await server.ledgers().order('desc').limit(1).call();
    const raw = page.records[0]?.base_reserve_in_stroops;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    /* fall through */
  }
  return DEFAULT_BASE_RESERVE_STROOPS;
}

export function stroopsFromXlm(amount: string | number): number {
  return Math.round(Number(amount) * 10_000_000);
}

/**
 * Conservative reserve lock for a create or sponsored-data envelope.
 * Fee-bumps lock nothing (the inner source pays its own new subentries,
 * unless those are themselves sponsored — those go through sponsored-data).
 */
export function estimateReservedStroops(
  tx: Transaction | FeeBumpTransaction,
  kind: 'create' | 'fee-bump' | 'sponsored-data' | 'trustline',
  baseReserveStroops: number = DEFAULT_BASE_RESERVE_STROOPS,
): number {
  if (kind === 'fee-bump') return 0;
  if ('innerTransaction' in tx) return 0;

  let entries = 0;
  for (const op of tx.operations) {
    switch (op.type) {
      case 'createAccount':
        entries += 2;
        break;
      case 'manageData': {
        const md = op as { value?: Buffer | string | null };
        // Clearing a data entry releases a reserve; don't count it as a lock.
        if (md.value != null && md.value !== '') entries += 1;
        break;
      }
      case 'changeTrust':
        entries += 1;
        break;
      case 'setOptions': {
        const so = op as { signer?: { ed25519PublicKey?: string; key?: string } };
        if (so.signer) entries += 1;
        break;
      }
      default:
        break;
    }
  }
  return entries * baseReserveStroops;
}

/** Exact lock from the sponsor's Horizon account, before vs after submit. */
export function reservedDeltaStroops(
  numSponsoringBefore: number,
  numSponsoringAfter: number,
  baseReserveStroops: number = DEFAULT_BASE_RESERVE_STROOPS,
): number {
  const delta = numSponsoringAfter - numSponsoringBefore;
  return Math.max(0, delta) * baseReserveStroops;
}

/**
 * The mirror of `reservedDeltaStroops`: what the sponsor stopped sponsoring.
 * Closing a trustline drops `num_sponsoring`, and without this the XLM would
 * stay locked in the ledger long after the network released it.
 */
export function releasedDeltaStroops(
  numSponsoringBefore: number,
  numSponsoringAfter: number,
  baseReserveStroops: number = DEFAULT_BASE_RESERVE_STROOPS,
): number {
  const delta = numSponsoringBefore - numSponsoringAfter;
  return Math.max(0, delta) * baseReserveStroops;
}

/** Spendable XLM on a sponsor account (cannot withdraw below this). */
export function accountMinBalanceStroops(
  numSubentries: number,
  numSponsoring: number,
  numSponsored: number,
  baseReserveStroops: number = DEFAULT_BASE_RESERVE_STROOPS,
): number {
  return (2 + numSubentries + numSponsoring - numSponsored) * baseReserveStroops;
}
