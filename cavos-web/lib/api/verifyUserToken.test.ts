import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import * as jose from 'jose';
import { verifyUserToken, isSubject, bearerToken } from './verifyUserToken';

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
        assert.equal(await verifyUserToken(req(token), () => keys), 'user-1');
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
});

describe('bearerToken', () => {
    it('reads only the Bearer scheme', () => {
        assert.equal(bearerToken(req('abc')), 'abc');
        const basic = new Request('https://cavos.xyz/', { headers: { authorization: 'Basic abc' } });
        assert.equal(bearerToken(basic), null);
    });
});

describe('isSubject', () => {
    it('requires an exact match', () => {
        assert.equal(isSubject('user-1', 'user-1'), true);
        assert.equal(isSubject('user-1', 'user-2'), false);
        assert.equal(isSubject(null, 'user-1'), false);
        assert.equal(isSubject('user-1', undefined), false);
    });
});
