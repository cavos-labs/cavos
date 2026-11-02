import { ed25519 } from '@noble/curves/ed25519';
import { PublicKey } from '@solana/web3.js';
import { StrKey } from '@stellar/stellar-sdk';
import { CallData, ec, hash } from 'starknet';
import { signOAuthState, verifyOAuthState } from '@/lib/oauth/state';

export type ConsentAction = 'delete_account' | 'disable_recovery' | 'enable_recovery';
export type ConsentChain = 'solana' | 'stellar' | 'starknet';

/** A signature over the consent message by one of the user's wallet spend keys. */
export interface ConsentProof {
    chain: ConsentChain;
    public_key: string;
    signature: string[];
}

interface ConsentScope {
    appId: string;
    environmentId: string;
    sub: string;
    action: ConsentAction;
    state: 'on' | 'off';
}

const CONSENT_MAX_AGE_MS = 5 * 60_000;

/** The OpenZeppelin AccountUpgradeable v3.0.0 class every Cavos Starknet wallet deploys, as in `@cavos/kit`. */
const OZ_ACCOUNT_CLASS_HASH = '0x01d1777db36cdd06dd62cfde77b1b6ae06412af95d57a13dc40ac77b8a702381';

/** The counterfactual address of a Cavos Starknet wallet for a stark public key, computed as the kit does. */
function starknetAddress(publicKey: string): string {
    return hash.calculateContractAddressFromHash(publicKey, OZ_ACCOUNT_CLASS_HASH, CallData.compile({ publicKey }), 0);
}

/** Signs a short-lived challenge bound to the user, action and current recovery state. */
export function issueConsentChallenge(scope: ConsentScope): string {
    return signOAuthState({
        kind: 'end_user_consent',
        app_id: scope.appId,
        environment_id: scope.environmentId,
        sub: scope.sub,
        action: scope.action,
        state: scope.state,
    });
}

/** Throws unless the challenge is fresh, authentic and matches every field of `expected`. */
export function readConsentChallenge(challenge: string, expected: ConsentScope): void {
    const payload = verifyOAuthState<{
        kind?: string;
        app_id?: string;
        environment_id?: string;
        sub?: string;
        action?: string;
        state?: string;
        issued_at?: number;
    }>(challenge, CONSENT_MAX_AGE_MS);
    if (
        payload.kind !== 'end_user_consent' ||
        payload.app_id !== expected.appId ||
        payload.environment_id !== expected.environmentId ||
        payload.sub !== expected.sub ||
        payload.action !== expected.action ||
        payload.state !== expected.state
    ) {
        throw new Error('Consent challenge mismatch');
    }
}

/** The exact text the wallet key signs. */
export function consentMessage(challenge: string): string {
    return `Cavos Consent:\n${challenge.length}\n${challenge}`;
}

/** The chain a wallet network belongs to. */
export function chainOfNetwork(network: string): ConsentChain {
    if (network.startsWith('solana-')) return 'solana';
    if (network.startsWith('stellar-')) return 'stellar';
    return 'starknet';
}

function isHex(value: unknown, length?: number): value is string {
    return typeof value === 'string' && /^[0-9a-f]+$/.test(value) && (length === undefined || value.length === length);
}

function hexToBytes(value: string): Uint8Array {
    return Uint8Array.from(Buffer.from(value, 'hex'));
}

function ownsAddress(chain: ConsentChain, address: string, wallets: { network: string; address: string }[]): boolean {
    return wallets.some((wallet) => {
        if (chainOfNetwork(wallet.network) !== chain) return false;
        if (chain !== 'starknet') return wallet.address === address;
        try {
            return BigInt(wallet.address) === BigInt(address);
        } catch {
            return false;
        }
    });
}

function verifyEd25519(proof: ConsentProof, message: string, wallets: { network: string; address: string }[]): boolean {
    const [signature] = proof.signature;
    if (!isHex(proof.public_key, 64) || !isHex(signature, 128)) return false;
    const publicKey = hexToBytes(proof.public_key);
    const address =
        proof.chain === 'solana' ? new PublicKey(publicKey).toBase58() : StrKey.encodeEd25519PublicKey(Buffer.from(publicKey));
    if (!ownsAddress(proof.chain, address, wallets)) return false;
    return ed25519.verify(hexToBytes(signature), new TextEncoder().encode(message), publicKey);
}

function verifyStark(proof: ConsentProof, message: string, wallets: { network: string; address: string }[]): boolean {
    const [r, s] = proof.signature;
    if (!isHex(proof.public_key, 130) || !proof.public_key.startsWith('04')) return false;
    if (proof.signature.length !== 2 || !/^0x[0-9a-f]+$/i.test(r) || !/^0x[0-9a-f]+$/i.test(s)) return false;
    const xHex = proof.public_key.slice(2, 66);
    const address = starknetAddress(`0x${xHex}`);
    if (!ownsAddress('starknet', address, wallets)) return false;
    const digest = hash.starknetKeccak(message).toString(16).padStart(64, '0');
    return ec.starkCurve.verify(
        new ec.starkCurve.Signature(BigInt(r), BigInt(s)),
        digest,
        proof.public_key,
    );
}

/**
 * True when the proof is a valid signature over the consent message by a key
 * whose derived address is one of the user's wallets. Never throws.
 */
export function verifyConsentProof(
    proof: unknown,
    challenge: string,
    wallets: { network: string; address: string }[],
): boolean {
    try {
        if (!proof || typeof proof !== 'object') return false;
        const candidate = proof as ConsentProof;
        if (!Array.isArray(candidate.signature) || candidate.signature.some((part) => typeof part !== 'string')) return false;
        const message = consentMessage(challenge);
        if (candidate.chain === 'solana' || candidate.chain === 'stellar') {
            return verifyEd25519(candidate, message, wallets);
        }
        if (candidate.chain === 'starknet') return verifyStark(candidate, message, wallets);
        return false;
    } catch {
        return false;
    }
}
