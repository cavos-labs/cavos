/**
 * Stellar sponsoring relayer — server-side fee payer + reserve sponsor for the
 * Cavos classic `G…` multisig account (the Soroban `C…` device-account path was
 * removed). The relayer ONLY pays fees / sponsors reserves; it never holds user
 * funds and is not a custodian. The account's control key (envelope-encrypted in
 * the account's own data entries) is the sole signer of value-moving transactions.
 *
 * Two gates (see `validateClassicCreate` / `validateClassicFeeBump` below):
 *   - CREATE: relayer is the tx source + sponsor; only sponsorship + account-setup
 *     ops, a 0-balance createAccount, and `cv:`-namespaced data. It cannot be
 *     drained into the new account.
 *   - FEE-BUMP: the user's control-signed inner tx (source = their `G…`) is wrapped
 *     in a fee-bump whose fee source is the relayer — it pays only the fee and is
 *     never a source of any inner op, so it can't move user funds.
 */
import {
  Horizon,
  Operation,
  TransactionBuilder,
  type Transaction,
  type FeeBumpTransaction,
} from '@stellar/stellar-sdk';

export type StellarNetwork = 'stellar-testnet' | 'stellar-mainnet';

export function isSupportedStellarNetwork(n: string): n is StellarNetwork {
  return n === 'stellar-testnet' || n === 'stellar-mainnet';
}

export function passphraseFor(network: StellarNetwork): string {
  return network === 'stellar-mainnet'
    ? 'Public Global Stellar Network ; September 2015'
    : 'Test SDF Network ; September 2015';
}

/** Horizon URL — used to verify classic XLM deposits (memo + payment ops), which
 *  the Soroban rpc doesn't expose as cleanly as Horizon does. */
export function horizonUrlFor(network: StellarNetwork): string {
  if (network === 'stellar-mainnet') {
    return process.env.STELLAR_MAINNET_HORIZON_URL ?? 'https://horizon.stellar.org';
  }
  return process.env.STELLAR_TESTNET_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
}

export function horizonServerFor(network: StellarNetwork): Horizon.Server {
  const url = horizonUrlFor(network);
  return new Horizon.Server(url, { allowHttp: url.startsWith('http://') });
}

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

// ───────────────────────────── classic-G relayer ────────────────────────────
//
// The classic-Stellar (`G…`) multisig account (see @cavos/kit chains/stellar-
// classic) is a *classic* account, not a contract, so the relayer plays two
// roles, each with its own gate:
//   - CREATE: relayer is the tx source + fee payer AND sponsors the new account's
//     reserves. Only sponsorship + account-setup ops are allowed, the new account
//     is created with a 0 starting balance (relayer can't be drained into it),
//     and every data key is under the `cv:` namespace.
//   - FEE-BUMP: the user's control-signed inner tx (source = their `G…`) is
//     wrapped in a fee-bump whose fee source is the relayer. The relayer pays only
//     the fee; it is never a source of any inner op, so it can't move user funds.

/** Ops the relayer will sponsor inside a classic create. Anything else (payment,
 *  accountMerge, path payment, …) is rejected so the relayer can't be drained. */
const CLASSIC_CREATE_OP_TYPES = new Set([
  'beginSponsoringFutureReserves',
  'endSponsoringFutureReserves',
  'createAccount',
  'manageData',
  'setOptions',
]);

/** Upper bound on ops in a create — bounds how many reserves the relayer sponsors
 *  in one tx (create + control signer + a handful of `cv:` entries). */
const CLASSIC_CREATE_MAX_OPS = 16;

/** Parse a base64 envelope that may be a plain OR a fee-bump transaction. */
export function parseAnyTransaction(
  xdrBase64: string,
  network: StellarNetwork,
): Transaction | FeeBumpTransaction {
  return TransactionBuilder.fromXDR(xdrBase64, passphraseFor(network));
}

/**
 * Gate a classic account-creation transaction. Enforces:
 *  - source is the relayer (it pays the fee + sponsors reserves);
 *  - only sponsorship / account-setup ops, at most `CLASSIC_CREATE_MAX_OPS`;
 *  - exactly one `createAccount` with startingBalance "0", and its destination is
 *    the single non-relayer op source (the new account);
 *  - the sponsored id matches that new account;
 *  - a `setOptions` that zeroes the master weight (our account model);
 *  - every `manageData` key is under the `cv:` namespace.
 */
export function validateClassicCreate(tx: Transaction, relayerPublicKey: string): ValidationResult {
  if (tx.source !== relayerPublicKey) {
    return { ok: false, reason: 'transaction source must be the Cavos relayer' };
  }
  if (tx.operations.length === 0 || tx.operations.length > CLASSIC_CREATE_MAX_OPS) {
    return { ok: false, reason: `create must have 1..${CLASSIC_CREATE_MAX_OPS} operations` };
  }

  let newAccount: string | undefined;
  let sawCreate = false;
  let sawMasterZero = false;

  for (const op of tx.operations) {
    if (!CLASSIC_CREATE_OP_TYPES.has(op.type)) {
      return { ok: false, reason: `operation ${op.type} is not allowed in a sponsored create` };
    }
    if (op.type === 'createAccount') {
      const ca = op as Operation.CreateAccount;
      if (ca.source && ca.source !== relayerPublicKey) {
        return { ok: false, reason: 'createAccount source must be the relayer' };
      }
      if (ca.startingBalance !== '0' && Number(ca.startingBalance) !== 0) {
        return { ok: false, reason: 'createAccount starting balance must be 0 (reserves are sponsored)' };
      }
      if (sawCreate) return { ok: false, reason: 'only one createAccount is allowed' };
      sawCreate = true;
      newAccount = ca.destination;
    }
  }

  if (!sawCreate || !newAccount) return { ok: false, reason: 'create must contain a createAccount op' };
  if (!newAccount.startsWith('G')) return { ok: false, reason: 'new account must be a classic G address' };
  if (newAccount === relayerPublicKey) return { ok: false, reason: 'new account cannot be the relayer' };

  for (const op of tx.operations) {
    // Non-relayer-sourced ops must all belong to the one new account.
    if (op.type !== 'createAccount' && op.type !== 'beginSponsoringFutureReserves') {
      if (op.source && op.source !== newAccount) {
        return { ok: false, reason: 'account-setup ops must be sourced by the new account' };
      }
    }
    if (op.type === 'beginSponsoringFutureReserves') {
      const b = op as Operation.BeginSponsoringFutureReserves;
      if (b.source && b.source !== relayerPublicKey) {
        return { ok: false, reason: 'beginSponsoring source must be the relayer' };
      }
      if (b.sponsoredId !== newAccount) {
        return { ok: false, reason: 'sponsored id must be the new account' };
      }
    }
    if (op.type === 'manageData') {
      const md = op as Operation.ManageData;
      if (!md.name.startsWith('cv:')) {
        return { ok: false, reason: `data key ${md.name} is outside the cv: namespace` };
      }
    }
    if (op.type === 'setOptions') {
      const so = op as Operation.SetOptions;
      if (Number(so.masterWeight) === 0) sawMasterZero = true;
    }
  }

  if (!sawMasterZero) {
    return { ok: false, reason: 'create must zero the master weight (Cavos account model)' };
  }
  return { ok: true };
}

/**
 * Gate a classic fee-bump. The relayer only pays the fee, so the safety property
 * is simply that the relayer is never the source of the inner tx or any inner op
 * (which would let it be the spender). Enforces:
 *  - fee source is the relayer;
 *  - inner source is a `G…` account that is NOT the relayer;
 *  - no inner op is sourced by the relayer.
 * Fee abuse is bounded by rate limiting + gas metering, not this gate.
 */
export function validateClassicFeeBump(
  fb: FeeBumpTransaction,
  relayerPublicKey: string,
): ValidationResult {
  if (fb.feeSource !== relayerPublicKey) {
    return { ok: false, reason: 'fee source must be the Cavos relayer' };
  }
  const inner = fb.innerTransaction;
  if (inner.source === relayerPublicKey) {
    return { ok: false, reason: 'inner transaction source cannot be the relayer' };
  }
  if (!inner.source.startsWith('G')) {
    return { ok: false, reason: 'inner transaction source must be a classic G account' };
  }
  for (const op of inner.operations) {
    if (op.source === relayerPublicKey) {
      return { ok: false, reason: 'no inner operation may be sourced by the relayer' };
    }
  }
  return { ok: true };
}

// The relayer signer (source/fee payer) is a local Ed25519 key loaded from the
// environment — see lib/stellar/signer.ts.
