/**
 * SEP-10 client_domain signing utilities.
 *
 * The signing key (STELLAR_SEP10_SIGNING_SEED) is an org auth key for
 * client_domain verification. It is NOT a user-control seed, NOT cv:ct, NOT
 * Nitro. Cavos never signs user payments with this key.
 */
import { Keypair, TransactionBuilder, type Transaction, type FeeBumpTransaction } from '@stellar/stellar-sdk';

export const SEP10_TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

export interface Sep10SignRequest {
  transaction: string;
  network_passphrase: string;
}

export interface Sep10SignResult {
  ok: true;
  transaction: string;
  network_passphrase: string;
}

export interface Sep10SignError {
  ok: false;
  error: string;
  status: number;
}

export type Sep10ValidationResult = Sep10SignResult | Sep10SignError;

export function validateSep10Request(
  body: Sep10SignRequest,
  allowedPassphrase: string = SEP10_TESTNET_PASSPHRASE,
): Sep10SignError | { ok: true; tx: Transaction } {
  const { transaction: xdr, network_passphrase: passphrase } = body;

  if (typeof xdr !== 'string' || typeof passphrase !== 'string') {
    return {
      ok: false,
      error: 'Invalid request body. Expected: { transaction: string, network_passphrase: string }',
      status: 400,
    };
  }

  if (passphrase !== allowedPassphrase) {
    return {
      ok: false,
      error: `Invalid network_passphrase. Expected: "${allowedPassphrase}"`,
      status: 400,
    };
  }

  let parsed: Transaction | FeeBumpTransaction;
  try {
    parsed = TransactionBuilder.fromXDR(xdr, passphrase);
  } catch {
    return {
      ok: false,
      error: 'Invalid transaction XDR',
      status: 400,
    };
  }

  if ('innerTransaction' in parsed) {
    return {
      ok: false,
      error: 'Fee-bump transactions are not supported for SEP-10',
      status: 400,
    };
  }

  const tx = parsed as Transaction;

  if (tx.sequence !== '0') {
    return {
      ok: false,
      error: 'Invalid transaction: sequence number must be 0 for SEP-10 challenges',
      status: 400,
    };
  }

  return { ok: true, tx };
}

export function signSep10Transaction(
  tx: Transaction,
  signingSecret: string,
  passphrase: string,
): Sep10SignResult {
  const signer = Keypair.fromSecret(signingSecret);
  tx.sign(signer);
  return {
    ok: true,
    transaction: tx.toEnvelope().toXDR('base64'),
    network_passphrase: passphrase,
  };
}
