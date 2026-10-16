/**
 * The `nonce` Google and Apple sign into an id_token.
 *
 * Every app signs in through the same Cavos OAuth client, so a token's `aud`
 * says nothing about which app asked for it. The nonce is the one value the
 * relying party chooses and the provider signs, so the app goes there:
 *
 *     <app uuid>.<base64url(SHA-256(login secret))>
 *
 * The second half is what `@cavos/kit` sends: the hash of a secret that never
 * leaves the client except inside a job encrypted to the recovery enclave
 * (OpenID Connect Core §15.5.2; the transform is PKCE's S256, RFC 7636 §4.2).
 * The first half is added here, after the app and its redirect are validated,
 * and checked wherever a token is accepted: by the enclave against the sealed
 * policy, and by `verifyUserToken` against the app of the request.
 *
 * A UUID contains no dot, so the app half cannot be forged from the client's.
 */
const CLIENT_NONCE = /^[A-Za-z0-9_-]{43}$/;

/**
 * What `@cavos/react` sends: Poseidon(session key, valid_until, randomness) as
 * hex. The legacy account contract parses the token's nonce as exactly this
 * value, so it cannot carry the app, and is sent to the provider unchanged.
 * Such a token names no app, so `nonceNamesApp` refuses it everywhere it is
 * checked. Remove once no legacy account signs in.
 */
const LEGACY_STARKNET_NONCE = /^0x[0-9a-f]{1,63}$/;

/** The nonce to send to the provider, or null when the client's half is malformed. */
export function bindNonceToApp(appId: string, clientNonce: string): string | null {
  if (CLIENT_NONCE.test(clientNonce)) return `${appId}.${clientNonce}`;
  return LEGACY_STARKNET_NONCE.test(clientNonce) ? clientNonce : null;
}

/** Whether a token's nonce says it was issued to a login started by `appId`. */
export function nonceNamesApp(nonce: unknown, appId: string): boolean {
  return typeof nonce === 'string' && nonce.startsWith(`${appId}.`);
}
