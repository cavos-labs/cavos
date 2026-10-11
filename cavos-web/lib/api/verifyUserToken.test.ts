import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import * as jose from 'jose';
import { verifyUserToken, isUserOfApp, bearerToken } from './verifyUserToken';

const GOOGLE = 'https://accounts.google.com';

let sign: (claims: jose.JWTPayload, opts?: { expired?: boolean }) => Promise<string>;
let keys: jose.JWTVerifyGetKey;

before(async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
    keys = (() => publicKey) as unknown as jose.JWTVerifyGetKey;
    sign = (claims, opts) =>
        new jose.SignJWT(claims)
            .setProtectedHeader({ alg: 'RS256' })
            .setIssuedAt()
            .setExpirationTime(opts?.expired ? '-1h' : '1h')
            .sign(privateKey);
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

    it("accepts Firebase's ID token from an email-link login", async () => {
        process.env.FIREBASE_PROJECT_ID = 'cavos-test';
        const token = await sign({ iss: 'https://securetoken.google.com/cavos-test', aud: 'cavos-test', sub: 'uid-1' });
        assert.equal((await verifyUserToken(req(token), () => keys))?.sub, 'uid-1');
    });

    it('rejects a Firebase token from another project', async () => {
        process.env.FIREBASE_PROJECT_ID = 'cavos-test';
        const token = await sign({ iss: 'https://securetoken.google.com/other', aud: 'other', sub: 'uid-1' });
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

    it('does not check the app of an email token', async () => {
        process.env.FIREBASE_PROJECT_ID = 'cavos-test';
        const token = await sign({ iss: 'https://securetoken.google.com/cavos-test', aud: 'cavos-test', sub: 'uid-1' });
        assert.equal(isUserOfApp(await verifyUserToken(req(token), () => keys), 'uid-1', APP), true);
    });
});
