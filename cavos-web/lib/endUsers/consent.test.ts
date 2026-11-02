import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { ed25519 } from '@noble/curves/ed25519';
import { PublicKey } from '@solana/web3.js';
import { StrKey } from '@stellar/stellar-sdk';
import { ec, hash } from 'starknet';
import { starknetAddressFromPublicKey } from '@cavos/kit';
import {
    chainOfNetwork,
    consentMessage,
    issueConsentChallenge,
    readConsentChallenge,
    verifyConsentProof,
    type ConsentProof,
} from './consent';

const scope = { appId: 'app', environmentId: 'env', sub: 'user-1', action: 'disable_recovery', state: 'on' } as const;

before(() => {
    process.env.OAUTH_STATE_SECRET = 'consent-test-secret';
});

function hex(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('hex');
}

function edProof(chain: 'solana' | 'stellar', challenge: string) {
    const priv = ed25519.utils.randomPrivateKey();
    const pub = ed25519.getPublicKey(priv);
    const signature = ed25519.sign(new TextEncoder().encode(consentMessage(challenge)), priv);
    const address = chain === 'solana' ? new PublicKey(pub).toBase58() : StrKey.encodeEd25519PublicKey(Buffer.from(pub));
    const proof: ConsentProof = { chain, public_key: hex(pub), signature: [hex(signature)] };
    return { proof, address };
}

function starkProof(challenge: string) {
    const priv = ec.starkCurve.utils.randomPrivateKey();
    const pub = ec.starkCurve.getPublicKey(priv, false);
    const address = starknetAddressFromPublicKey(ec.starkCurve.getStarkKey(priv));
    const sig = ec.starkCurve.sign(hash.starknetKeccak(consentMessage(challenge)).toString(16), priv);
    const proof: ConsentProof = {
        chain: 'starknet',
        public_key: hex(pub),
        signature: [`0x${sig.r.toString(16)}`, `0x${sig.s.toString(16)}`],
    };
    return { proof, address };
}

describe('consent message', () => {
    it('has a fixed format', () => {
        assert.equal(consentMessage('abc'), 'Cavos Consent:\n3\nabc');
    });
});

describe('consent challenge', () => {
    it('round trips', () => {
        assert.doesNotThrow(() => readConsentChallenge(issueConsentChallenge(scope), scope));
    });

    it('rejects a different action, state or sub', () => {
        const challenge = issueConsentChallenge(scope);
        assert.throws(() => readConsentChallenge(challenge, { ...scope, action: 'delete_account' }));
        assert.throws(() => readConsentChallenge(challenge, { ...scope, state: 'off' }));
        assert.throws(() => readConsentChallenge(challenge, { ...scope, sub: 'user-2' }));
    });

    it('maps networks to chains', () => {
        assert.equal(chainOfNetwork('solana-devnet'), 'solana');
        assert.equal(chainOfNetwork('stellar-testnet'), 'stellar');
        assert.equal(chainOfNetwork('sepolia'), 'starknet');
    });
});

describe('consent proof', () => {
    const challenge = 'challenge-value';

    it('accepts a solana proof for an owned address', () => {
        const { proof, address } = edProof('solana', challenge);
        assert.equal(verifyConsentProof(proof, challenge, [{ network: 'solana-devnet', address }]), true);
    });

    it('accepts a stellar proof for an owned address', () => {
        const { proof, address } = edProof('stellar', challenge);
        assert.equal(verifyConsentProof(proof, challenge, [{ network: 'stellar-testnet', address }]), true);
    });

    it('accepts a starknet proof for an owned address', () => {
        const { proof, address } = starkProof(challenge);
        assert.equal(verifyConsentProof(proof, challenge, [{ network: 'sepolia', address }]), true);
    });

    it('rejects a proof for an address the user does not own', () => {
        const { proof } = edProof('solana', challenge);
        const other = edProof('solana', challenge);
        assert.equal(verifyConsentProof(proof, challenge, [{ network: 'solana-devnet', address: other.address }]), false);
        const stark = starkProof(challenge);
        const otherStark = starkProof(challenge);
        assert.equal(
            verifyConsentProof(stark.proof, challenge, [{ network: 'sepolia', address: otherStark.address }]),
            false,
        );
    });

    it('rejects an owned address on another chain', () => {
        const { proof, address } = edProof('solana', challenge);
        assert.equal(verifyConsentProof(proof, challenge, [{ network: 'stellar-testnet', address }]), false);
    });

    it('rejects a different challenge and a tampered signature', () => {
        const { proof, address } = edProof('solana', challenge);
        const wallets = [{ network: 'solana-devnet', address }];
        assert.equal(verifyConsentProof(proof, 'other', wallets), false);
        const flipped = proof.signature[0].replace(/^./, (c) => (c === '0' ? '1' : '0'));
        assert.equal(verifyConsentProof({ ...proof, signature: [flipped] }, challenge, wallets), false);
        const stark = starkProof(challenge);
        const starkWallets = [{ network: 'sepolia', address: stark.address }];
        assert.equal(verifyConsentProof(stark.proof, 'other', starkWallets), false);
    });

    it('returns false for malformed input', () => {
        assert.equal(verifyConsentProof(null, challenge, []), false);
        assert.equal(verifyConsentProof({ chain: 'solana', public_key: 'zz', signature: [] }, challenge, []), false);
    });
});
