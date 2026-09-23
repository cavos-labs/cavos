/**
 * Input rules for `/api/passkey-wraps`. A wrap is a wallet DEK encrypted under
 * a passkey's PRF by the kit; the server only checks its shape, never its content.
 */

/** version(1) || nonce(12) || AES-256-GCM(32-byte DEK)(48). */
const WRAP_BYTES = 61;
const WRAP_VERSION = 0x01;
/** WebAuthn credential ids are at most 1023 bytes; real ones are 16 or more. */
const CREDENTIAL_MIN_BYTES = 16;
const CREDENTIAL_MAX_BYTES = 1023;
/** Enough for every passkey a person keeps; a cap on what one login can store. */
export const MAX_WRAPS_PER_USER = 10;

export type PasskeyWrapInput = { credentialId: string; wrappedDek: string };

export function parsePasskeyWrap(body: {
    credential_id?: unknown;
    wrapped_dek?: unknown;
}): PasskeyWrapInput | { error: string } {
    const credential = base64UrlBytes(body.credential_id);
    if (!credential || credential.length < CREDENTIAL_MIN_BYTES || credential.length > CREDENTIAL_MAX_BYTES) {
        return { error: 'credential_id must be a base64url WebAuthn credential id' };
    }
    const wrap = base64UrlBytes(body.wrapped_dek);
    if (!wrap || wrap.length !== WRAP_BYTES || wrap[0] !== WRAP_VERSION) {
        return { error: 'wrapped_dek must be a base64url v1 passkey wrap' };
    }
    return { credentialId: body.credential_id as string, wrappedDek: body.wrapped_dek as string };
}

function base64UrlBytes(value: unknown): Buffer | null {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
    return Buffer.from(value, 'base64url');
}
