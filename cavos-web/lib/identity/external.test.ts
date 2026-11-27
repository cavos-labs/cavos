import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPublicHttpsUrl, parseExternalIdentity } from './external';

describe('parseExternalIdentity', () => {
    const valid = { issuer: 'https://auth.app.test', jwksUrl: 'https://auth.app.test/.well-known/jwks.json' };

    it('reads an issuer, its keys URL and an optional audience', () => {
        assert.deepEqual(parseExternalIdentity(valid), { ok: true, identity: valid });
        assert.deepEqual(parseExternalIdentity({ ...valid, audience: ' app ' }), {
            ok: true,
            identity: { ...valid, audience: 'app' },
        });
    });

    it('clears the provider when every field is empty', () => {
        assert.deepEqual(parseExternalIdentity({ issuer: '', jwksUrl: ' ', audience: null }), { ok: true, identity: null });
    });

    it('needs both the issuer and the keys URL', () => {
        assert.equal(parseExternalIdentity({ issuer: valid.issuer }).ok, false);
        assert.equal(parseExternalIdentity({ jwksUrl: valid.jwksUrl }).ok, false);
        assert.equal(parseExternalIdentity({ audience: 'app' }).ok, false);
    });

    it('refuses an issuer Cavos signs users in with', () => {
        for (const issuer of [
            'https://accounts.google.com',
            'accounts.google.com',
            'https://appleid.apple.com',
            'https://enclave.cavos.xyz',
            'https://enclave.cavos.xyz/github',
            'https://cavos.app/firebase',
        ]) {
            assert.equal(parseExternalIdentity({ ...valid, issuer }).ok, false, issuer);
        }
    });

    it('refuses a value that is not text', () => {
        assert.equal(parseExternalIdentity({ ...valid, audience: 3 }).ok, false);
    });
});

describe('isPublicHttpsUrl', () => {
    it('accepts a public https address', () => {
        assert.ok(isPublicHttpsUrl('https://example.clerk.accounts.dev/.well-known/jwks.json'));
    });

    it('refuses anything a server should not be sent to fetch', () => {
        for (const url of [
            'http://auth.app.test/jwks',
            'https://127.0.0.1/jwks',
            'https://169.254.169.254/latest/meta-data',
            'https://[::1]/jwks',
            'https://localhost/jwks',
            'https://intranet/jwks',
            'https://db.internal/jwks',
            'https://printer.local/jwks',
            'https://user:pass@auth.app.test/jwks',
            'file:///etc/passwd',
            'not a url',
        ]) {
            assert.equal(isPublicHttpsUrl(url), false, url);
        }
    });
});
