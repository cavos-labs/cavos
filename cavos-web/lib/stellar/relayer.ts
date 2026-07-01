/**
 * Stellar sponsoring relayer — server-side transaction source + fee payer for
 * Cavos device-account (Soroban) transactions.
 *
 * On Stellar the account is a *contract*, which cannot be a transaction source,
 * so the relayer's own G-account is the source AND fee payer. It ONLY pays fees;
 * it never holds user funds and is not a custodian. User assets live in their
 * device-account contracts, controlled solely by P-256 device keys (verified
 * on-chain by `secp256r1_verify` inside `__check_auth`).
 *
 * Security model: the relayer never signs blindly. The dangerous move on Stellar
 * is a token transfer whose `from` is the relayer's own account — because the
 * relayer's tx signature (SourceAccount credentials) would authorize it. So the
 * gate below co-signs ONLY:
 *   - `factory.deploy(...)` (deploy a new account), or
 *   - `account.add_signer/remove_signer(...)` on a contract account, or
 *   - a SEP-41 `transfer(from, to, amount)` whose `from` is a CONTRACT address
 *     (a device account), never the relayer's G-account.
 * Every value-moving auth is therefore a device-signed Address credential; the
 * relayer's signature only pays the fee. Even a fully abused endpoint can lose at
 * most the relayer's bounded hot float, never user funds.
 */
import {
  Address,
  Horizon,
  Operation,
  TransactionBuilder,
  scValToNative,
  xdr,
  rpc,
  type Transaction,
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

export function rpcUrlFor(network: StellarNetwork): string {
  if (network === 'stellar-mainnet') {
    return (
      process.env.STELLAR_MAINNET_RPC_URL ??
      'https://soroban-rpc.mainnet.stellar.gateway.fm'
    );
  }
  return process.env.STELLAR_TESTNET_RPC_URL ?? 'https://soroban-testnet.stellar.org';
}

/** Deployed `cavos-account-factory` id (override via env for other deployments). */
export function factoryId(network: StellarNetwork): string {
  if (network === 'stellar-mainnet') {
    return process.env.STELLAR_FACTORY_ID_MAINNET ?? '';
  }
  return (
    process.env.STELLAR_FACTORY_ID_TESTNET ??
    'CBRJO52DFWDEZB73IGFAQUVX57CVPPOHEPLNPDXSQKE4SOJ3DVZNQNDO'
  );
}

export function serverFor(network: StellarNetwork): rpc.Server {
  const url = rpcUrlFor(network);
  return new rpc.Server(url, { allowHttp: url.startsWith('http://') });
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

/**
 * Account-management functions the relayer will sponsor on a contract account.
 * `add_signer_via_passkey` is authorized purely by an embedded WebAuthn assertion
 * (no device signature), which lets a user add a device from a fresh browser — it
 * only ever ADDS a signer to the account, never moves funds, so it is as safe to
 * sponsor as `add_signer`. `add_approver`/`remove_approver` are device-signed.
 */
const ACCOUNT_FUNCTIONS = new Set([
  'add_signer',
  'remove_signer',
  'add_approver',
  'remove_approver',
  'add_signer_via_passkey',
]);

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * Reject any transaction the relayer should not sponsor. Enforces:
 *  - the transaction source is the relayer (it only ever pays its own fees);
 *  - exactly one operation, and it is an InvokeContract host function;
 *  - the target is the factory `deploy`, an account `add_signer/remove_signer`,
 *    or a `transfer` whose `from` is a CONTRACT (never the relayer's G-account).
 */
export function validateSponsoredTransaction(
  tx: Transaction,
  relayerPublicKey: string,
  network: StellarNetwork,
): ValidationResult {
  if (tx.source !== relayerPublicKey) {
    return { ok: false, reason: 'transaction source must be the Cavos relayer' };
  }
  if (tx.operations.length !== 1) {
    return { ok: false, reason: 'exactly one operation is allowed' };
  }
  const op = tx.operations[0] as Operation.InvokeHostFunction;
  if (op.type !== 'invokeHostFunction') {
    return { ok: false, reason: `operation ${op.type} is not sponsorable` };
  }
  // An op-level source override must not be anything but the relayer.
  if (op.source && op.source !== relayerPublicKey) {
    return { ok: false, reason: 'operation source override is not allowed' };
  }
  if (op.func.switch() !== xdr.HostFunctionType.hostFunctionTypeInvokeContract()) {
    return { ok: false, reason: 'only contract invocations are sponsorable' };
  }

  const ic = op.func.invokeContract();
  const contract = Address.fromScAddress(ic.contractAddress()).toString();
  const fn = ic.functionName().toString();
  const args = ic.args();

  // 1) Factory deploy.
  if (contract === factoryId(network) && fn === 'deploy') {
    return { ok: true };
  }
  // 2) Account signer management (on a contract account).
  if (contract.startsWith('C') && ACCOUNT_FUNCTIONS.has(fn)) {
    return { ok: true };
  }
  // 3) SEP-41 transfer OUT of a device account: `from` must be a contract, so the
  //    relayer's account can never be the spender (which would drain it).
  if (fn === 'transfer') {
    let from: string;
    try {
      from = scValToNative(args[0]) as string;
    } catch {
      return { ok: false, reason: 'could not decode transfer `from`' };
    }
    if (typeof from !== 'string' || !from.startsWith('C')) {
      return { ok: false, reason: 'transfer `from` must be a contract account' };
    }
    if (from === relayerPublicKey) {
      return { ok: false, reason: 'relayer cannot be the transfer source' };
    }
    return { ok: true };
  }

  return { ok: false, reason: `function ${fn} on ${contract} is not sponsorable` };
}

/** Parse a base64 transaction envelope for `network`. */
export function parseTransaction(xdrBase64: string, network: StellarNetwork): Transaction {
  return TransactionBuilder.fromXDR(xdrBase64, passphraseFor(network)) as Transaction;
}

// The relayer signer (source/fee payer) is Turnkey-backed and HSM-held — see
// lib/stellar/signer.ts. No env-held secret key path exists by design.
