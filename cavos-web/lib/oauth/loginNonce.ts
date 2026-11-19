/**
 * The `nonce` Google and Apple sign into an id_token.
 *
 * Every app signs in through the same Cavos OAuth client, so a token's `aud`
 * says nothing about which app asked for it. The nonce is the one value the
 * relying party chooses and the provider signs, so the app goes there:
 *
 *     <app uuid>.<base64url(SHA-256(login public key))>
 *
 * The second half is what `@cavos/kit` sends: the hash of the public half of a
 * key pair it holds without being able to export it. The recovery enclave only
 * accepts the token inside a job encrypted with that key, so the token is
 * useless to anyone else (the proof-of-possession binding of RFC 9449, carried
 * in the OpenID Connect nonce). The first half is added here, after the app and its redirect are validated,
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

/** Whether a value has the shape of the half of the nonce a client sends. */
export function isClientNonce(value: unknown): value is string {
  return typeof value === 'string' && CLIENT_NONCE.test(value);
}

/** The nonce to send to the provider, or null when the client's half is malformed. */
export function bindNonceToApp(appId: string, clientNonce: string): string | null {
  if (CLIENT_NONCE.test(clientNonce)) return `${appId}.${clientNonce}`;
  return LEGACY_STARKNET_NONCE.test(clientNonce) ? clientNonce : null;
}

/** Whether a token's nonce says it was issued to a login started by `appId`. */
export function nonceNamesApp(nonce: unknown, appId: string): boolean {
  return typeof nonce === 'string' && nonce.startsWith(`${appId}.`);
}
