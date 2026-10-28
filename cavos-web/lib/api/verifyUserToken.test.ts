import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import * as jose from 'jose';
import { verifyUserToken, isUserOfApp, bearerToken } from './verifyUserToken';

const GOOGLE = 'https://accounts.google.com';
const ENCLAVE = 'https://enclave.cavos.xyz';

let sign: (claims: jose.JWTPayload, opts?: { expired?: boolean }) => Promise<string>;
let keys: jose.JWTVerifyGetKey;
let signEnclave: (claims: jose.JWTPayload) => Promise<string>;
let enclaveKeys: jose.JWTVerifyGetKey;

before(async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
    keys = (() => publicKey) as unknown as jose.JWTVerifyGetKey;
    sign = (claims, opts) =>
        new jose.SignJWT(claims)
            .setProtectedHeader({ alg: 'RS256' })
            .setIssuedAt()
            .setExpirationTime(opts?.expired ? '-1h' : '1h')
            .sign(privateKey);

    const enclavePair = await jose.generateKeyPair('ES256');
    enclaveKeys = (() => enclavePair.publicKey) as unknown as jose.JWTVerifyGetKey;
    signEnclave = (claims) =>
        new jose.SignJWT(claims)
            .setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: 'enclave-test' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(enclavePair.privateKey);
});

function req(token?: string): Request {
    return new Request('https://cavos.xyz/api/wallets', {
        headers: token ? { authorization: `Bearer ${token}` } : {},
    });
}

describe('verifyUserToken', () => {
    before(() => {
        process.env.GOOGLE_CLIENT_ID = 'client-123';
    });

    it('returns the subject of a valid provider token', async () => {
        const token = await sign({ iss: GOOGLE, aud: 'client-123', sub: 'user-1' });
        assert.equal((await verifyUserToken(req(token), () => keys))?.sub, 'user-1');
    });

    it('rejects a missing token', async () => {
        assert.equal(await verifyUserToken(req(), () => keys), null);
    });

    it('rejects an unknown issuer', async () => {
        const token = await sign({ iss: 'https://evil.example', aud: 'client-123', sub: 'user-1' });
        assert.equal(await verifyUserToken(req(token), () => keys), null);
    });

    it('rejects a token minted for another audience', async () => {
        const token = await sign({ iss: GOOGLE, aud: 'someone-else', sub: 'user-1' });
        assert.equal(await verifyUserToken(req(token), () => keys), null);
    });

    it('rejects an expired token', async () => {
        const token = await sign({ iss: GOOGLE, aud: 'client-123', sub: 'user-1' }, { expired: true });
        assert.equal(await verifyUserToken(req(token), () => keys), null);
    });

    it('rejects garbage', async () => {
        assert.equal(await verifyUserToken(req('not-a-jwt'), () => keys), null);
    });

    it('accepts an enclave-issued email token', async () => {
        const token = await signEnclave({ iss: ENCLAVE, aud: 'cavos-email', sub: 'a'.repeat(64) });
        assert.equal((await verifyUserToken(req(token), () => enclaveKeys))?.sub, 'a'.repeat(64));
    });

    it('accepts an enclave-issued GitHub token', async () => {
        const token = await signEnclave({ iss: `${ENCLAVE}/github`, aud: 'cavos-github', sub: 'b'.repeat(64) });
        assert.equal((await verifyUserToken(req(token), () => enclaveKeys))?.sub, 'b'.repeat(64));
    });

    it('rejects a GitHub token carrying the email audience', async () => {
        const token = await signEnclave({ iss: `${ENCLAVE}/github`, aud: 'cavos-email', sub: 'b'.repeat(64) });
        assert.equal(await verifyUserToken(req(token), () => enclaveKeys), null);
    });

    it('rejects an enclave token minted for another audience', async () => {
        const token = await signEnclave({ iss: ENCLAVE, aud: 'someone-else', sub: 'a'.repeat(64) });
        assert.equal(await verifyUserToken(req(token), () => enclaveKeys), null);
    });

    it('rejects an enclave token signed by another key', async () => {
        const token = await signEnclave({ iss: ENCLAVE, aud: 'cavos-email', sub: 'a'.repeat(64) });
        assert.equal(await verifyUserToken(req(token), () => keys), null);
    });

    it("rejects Firebase's securetoken ID token", async () => {
        process.env.FIREBASE_PROJECT_ID = 'cavos-test';
        const token = await sign({ iss: 'https://securetoken.google.com/cavos-test', aud: 'cavos-test', sub: 'uid-1' });
        assert.equal(await verifyUserToken(req(token), () => keys), null);
    });
});

describe('bearerToken', () => {
    it('reads only the Bearer scheme', () => {
        assert.equal(bearerToken(req('abc')), 'abc');
        const basic = new Request('https://cavos.xyz/', { headers: { authorization: 'Basic abc' } });
        assert.equal(bearerToken(basic), null);
    });
});

describe('isUserOfApp', () => {
    const APP = '0f9d5a1c-3b2e-4c5a-8d7f-1a2b3c4d5e6f';
    const OTHER_APP = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
    const HASH = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
    const google = (nonce?: string) =>
        sign({ iss: GOOGLE, aud: 'client-123', sub: 'user-1', ...(nonce ? { nonce } : {}) })
            .then((token) => verifyUserToken(req(token), () => keys));

    it('requires the subject to match exactly', async () => {
        const user = await google(`${APP}.${HASH}`);
        assert.equal(isUserOfApp(user, 'user-1', APP), true);
        assert.equal(isUserOfApp(user, 'user-2', APP), false);
        assert.equal(isUserOfApp(user, undefined, APP), false);
        assert.equal(isUserOfApp(null, 'user-1', APP), false);
    });

    it('refuses a Google token issued to another app, or to no app', async () => {
        // The same person, the same audience, a login another app started.
        assert.equal(isUserOfApp(await google(`${OTHER_APP}.${HASH}`), 'user-1', APP), false);
        assert.equal(isUserOfApp(await google(), 'user-1', APP), false);
        // The app id as a mere prefix of a longer first half is not the app.
        assert.equal(isUserOfApp(await google(`${APP}0.${HASH}`), 'user-1', APP), false);
        assert.equal(isUserOfApp(await google(HASH), 'user-1', APP), false);
    });

    it('checks the app of an enclave email token by its nonce', async () => {
        const email = (nonce?: string) =>
            signEnclave({ iss: ENCLAVE, aud: 'cavos-email', sub: 'a'.repeat(64), ...(nonce ? { nonce } : {}) })
                .then((token) => verifyUserToken(req(token), () => enclaveKeys));
        const user = await email(`${APP}.${HASH}`);
        assert.equal(isUserOfApp(user, 'a'.repeat(64), APP), true);
        assert.equal(isUserOfApp(user, 'a'.repeat(64), OTHER_APP), false);
        assert.equal(isUserOfApp(await email(), 'a'.repeat(64), APP), false);
    });

    it('checks the app of an enclave GitHub token by its nonce', async () => {
        const github = (nonce?: string) =>
            signEnclave({ iss: `${ENCLAVE}/github`, aud: 'cavos-github', sub: 'b'.repeat(64), ...(nonce ? { nonce } : {}) })
                .then((token) => verifyUserToken(req(token), () => enclaveKeys));
        const user = await github(`${APP}.${HASH}`);
        assert.equal(isUserOfApp(user, 'b'.repeat(64), APP), true);
        assert.equal(isUserOfApp(user, 'b'.repeat(64), OTHER_APP), false);
        assert.equal(isUserOfApp(await github(), 'b'.repeat(64), APP), false);
    });
});
