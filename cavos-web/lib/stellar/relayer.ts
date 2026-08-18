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
  Asset,
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

/** Max ops in a sponsored write (begin + a handful of account ops + end). */
const CLASSIC_SPONSORED_MAX_OPS = 12;

/** A classic asset the relayer is willing to sponsor a trustline for. */
export interface StellarAsset {
  code: string;
  issuer: string;
}

/** An operation as it comes off a parsed classic transaction. Taken from
 *  `Transaction` itself so the discriminated union stays in sync with the SDK. */
type ClassicOperation = Transaction['operations'][number];

/** The account-owned operations inside a `begin…end` sponsorship envelope. */
interface SponsoredEnvelope {
  /** The one account whose new subentries the relayer is sponsoring. */
  account: string;
  /** Everything between the begin and end ops. */
  inner: readonly ClassicOperation[];
}

/**
 * Check the shape shared by every sponsored write, independent of what the
 * account is allowed to write: the relayer sources and pays, exactly one account
 * is sponsored, and the envelope is properly closed. What may sit *inside*
 * differs per kind and is left to the caller — this establishes only that
 * whatever is inside belongs to that one account.
 */
function parseSponsoredEnvelope(
  tx: Transaction,
  relayerPublicKey: string,
): { ok: true; envelope: SponsoredEnvelope } | { ok: false; reason: string } {
  if (tx.source !== relayerPublicKey) {
    return { ok: false, reason: 'transaction source must be the Cavos relayer' };
  }
  const ops = tx.operations;
  if (ops.length < 3 || ops.length > CLASSIC_SPONSORED_MAX_OPS) {
    return { ok: false, reason: `a sponsored write must have 3..${CLASSIC_SPONSORED_MAX_OPS} operations` };
  }
  if (ops[0].type !== 'beginSponsoringFutureReserves') {
    return { ok: false, reason: 'first op must be beginSponsoringFutureReserves' };
  }
  if (ops[ops.length - 1].type !== 'endSponsoringFutureReserves') {
    return { ok: false, reason: 'last op must be endSponsoringFutureReserves' };
  }
  const begin = ops[0] as Operation.BeginSponsoringFutureReserves;
  if (begin.source && begin.source !== relayerPublicKey) {
    return { ok: false, reason: 'beginSponsoring source must be the relayer' };
  }
  const account = begin.sponsoredId;
  if (!account || !account.startsWith('G') || account === relayerPublicKey) {
    return { ok: false, reason: 'sponsored account must be a classic G address (not the relayer)' };
  }
  const end = ops[ops.length - 1] as Operation.EndSponsoringFutureReserves;
  if (end.source !== account) {
    return { ok: false, reason: 'endSponsoring must be sourced by the sponsored account' };
  }
  return { ok: true, envelope: { account, inner: ops.slice(1, -1) } };
}

/**
 * Gate a sponsored data write (adding a passkey/recovery factor or a device
 * slot): the relayer sponsors the reserve of the new subentries. Inside the
 * envelope the account may only gain `cv:` data entries and rotate its own
 * signers — never a payment, a createAccount, or a trustline.
 */
export function validateSponsoredData(tx: Transaction, relayerPublicKey: string): ValidationResult {
  const parsed = parseSponsoredEnvelope(tx, relayerPublicKey);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };
  const { account, inner } = parsed.envelope;

  for (const op of inner) {
    // Device revocation rotates the account's control key in the SAME
    // transaction that erases the revoked device's envelope entries — erasing
    // the wrap alone revokes nothing, since the evicted device may have cached
    // the control seed. That needs two setOptions ops (add the new weight-1
    // signer, then drop the old one), so they are allowed here alongside the
    // data writes.
    //
    // Only signer edits sourced by the sponsored account pass. Thresholds and
    // master weight must stay untouched: this validator's job is to bound what
    // the relayer will sponsor, and a transaction that could lower thresholds
    // or revive the master key is not something we pay to put on chain.
    if (op.type === 'setOptions') {
      const so = op as Operation.SetOptions;
      if (so.source !== account) {
        return { ok: false, reason: 'setOptions must be sourced by the sponsored account' };
      }
      if (!so.signer) {
        return { ok: false, reason: 'setOptions is only allowed to change a signer' };
      }
      // `== null` on purpose: the SDK leaves unset setOptions fields as `null`,
      // not `undefined`, so a strict `!== undefined` check would read every
      // absent field as present and reject the very transactions the SDK builds.
      const touchesAnythingElse = [
        so.masterWeight,
        so.lowThreshold,
        so.medThreshold,
        so.highThreshold,
        so.homeDomain,
        so.inflationDest,
        so.clearFlags,
        so.setFlags,
      ].some((field) => field != null);
      if (touchesAnythingElse) {
        return { ok: false, reason: 'setOptions may only change a signer in a sponsored data write' };
      }
      const signer = so.signer as { ed25519PublicKey?: string; weight?: number };
      if (!signer.ed25519PublicKey) {
        return { ok: false, reason: 'only ed25519 signers may be changed' };
      }
      if (signer.ed25519PublicKey === relayerPublicKey) {
        return { ok: false, reason: 'the relayer may not be added or removed as a signer' };
      }
      continue;
    }
    if (op.type !== 'manageData') {
      return { ok: false, reason: `operation ${op.type} is not allowed in a sponsored data write` };
    }
    const md = op as Operation.ManageData;
    if (md.source !== account) {
      return { ok: false, reason: 'manageData must be sourced by the sponsored account' };
    }
    if (!md.name.startsWith('cv:')) {
      return { ok: false, reason: `data key ${md.name} is outside the cv: namespace` };
    }
  }
  return { ok: true };
}

/**
 * Gate a sponsored trustline write. A trustline is a subentry, so the org's pot
 * pays a base reserve for every one opened — which makes an ungated `changeTrust`
 * a way to drain that pot one asset at a time. `allowed` is the org's dashboard
 * configuration and it is the whole defence: an asset that is not on it is not
 * sponsored, and without the relayer's signature the transaction has neither a
 * fee payer nor a sponsor.
 *
 * Closing a trustline (limit 0) releases a reserve instead of consuming one, so
 * it needs no entry on the list — an org that drops an asset must still be able
 * to let its accounts close the trustlines they already carry.
 */
export function validateClassicTrustline(
  tx: Transaction,
  relayerPublicKey: string,
  allowed: readonly StellarAsset[],
): ValidationResult {
  const parsed = parseSponsoredEnvelope(tx, relayerPublicKey);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };
  const { account, inner } = parsed.envelope;

  for (const op of inner) {
    if (op.type !== 'changeTrust') {
      return { ok: false, reason: `operation ${op.type} is not allowed in a trustline write` };
    }
    const ct = op as Operation.ChangeTrust;
    if (ct.source !== account) {
      return { ok: false, reason: 'changeTrust must be sourced by the sponsored account' };
    }
    // Liquidity-pool shares are a different beast — two trustlines plus a pool
    // entry — and nothing in the kit asks for them, so they stay out.
    if (!(ct.line instanceof Asset)) {
      return { ok: false, reason: 'only classic assets may be trusted' };
    }
    if (ct.line.isNative()) {
      return { ok: false, reason: 'XLM needs no trustline' };
    }
    if (Number(ct.limit) === 0) continue;
    const code = ct.line.getCode();
    const issuer = ct.line.getIssuer();
    if (!allowed.some((a) => a.code === code && a.issuer === issuer)) {
      return { ok: false, reason: `asset ${code} is not configured for this app` };
    }
  }
  return { ok: true };
}

// The relayer signer (source/fee payer) is a local Ed25519 key loaded from the
// environment — see lib/stellar/signer.ts.
