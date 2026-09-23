import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePasskeyWrap } from './passkeyWraps';

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64url');
const credential = b64(new Uint8Array(16).fill(1));
const wrap = (() => {
    const bytes = new Uint8Array(61).fill(2);
    bytes[0] = 1;
    return b64(bytes);
})();

describe('parsePasskeyWrap', () => {
    it('accepts a v1 wrap and a credential id', () => {
        assert.deepEqual(parsePasskeyWrap({ credential_id: credential, wrapped_dek: wrap }), {
            credentialId: credential,
            wrappedDek: wrap,
        });
    });

    it('rejects a wrap of the wrong size or version', () => {
        const short = b64(new Uint8Array(60).fill(1));
        const v2 = b64(new Uint8Array(61).fill(2));
        for (const wrapped_dek of [short, v2, 'not base64url!', 42, undefined]) {
            assert.ok('error' in parsePasskeyWrap({ credential_id: credential, wrapped_dek }));
        }
    });

    it('rejects a credential id that is not one', () => {
        const tooShort = b64(new Uint8Array(8));
        const tooLong = b64(new Uint8Array(1024));
        for (const credential_id of [tooShort, tooLong, 'a+b/c=', null]) {
            assert.ok('error' in parsePasskeyWrap({ credential_id, wrapped_dek: wrap }));
        }
    });
});
