import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bindNonceToApp, nonceNamesApp } from './loginNonce';

const APP = '0f9d5a1c-3b2e-4c5a-8d7f-1a2b3c4d5e6f';
// RFC 7636 Appendix B: the S256 challenge of its example verifier.
const HASH = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

describe('bindNonceToApp', () => {
    it('prefixes the app onto the client hash', () => {
        assert.equal(bindNonceToApp(APP, HASH), `${APP}.${HASH}`);
    });

    it('refuses anything that is not a base64url SHA-256', () => {
        // In particular a value with a dot, which could otherwise smuggle a
        // second "app" into the nonce.
        assert.equal(bindNonceToApp(APP, `other-app.${HASH}`), null);
        assert.equal(bindNonceToApp(APP, HASH.slice(1)), null);
        assert.equal(bindNonceToApp(APP, `${HASH}=`), null);
        assert.equal(bindNonceToApp(APP, ''), null);
    });
});

describe('nonceNamesApp', () => {
    it('reads the app from the first half only', () => {
        assert.equal(nonceNamesApp(`${APP}.${HASH}`, APP), true);
        assert.equal(nonceNamesApp(`${APP}0.${HASH}`, APP), false);
        assert.equal(nonceNamesApp(`x.${APP}.${HASH}`, APP), false);
        assert.equal(nonceNamesApp(HASH, APP), false);
        assert.equal(nonceNamesApp(undefined, APP), false);
    });
});
