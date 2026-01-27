/**
 * Circuit Input Generator for zkLogin
 *
 * Transforms a JWT and ephemeral session data into the format required
 * by the zkLogin circuit.
 */

import { poseidon } from 'poseidon-lite';

// Circuit parameters (must match zkLoginMain.circom instantiation)
const MAX_HEADER_LEN = 102;
const MAX_PADDED_UNSIGNED_JWT_LEN = 1984;
const MAX_KC_NAME_LEN = 32;
const MAX_KC_VALUE_LEN = 96;
const MAX_EXT_KC_LEN = 128;
const MAX_AUD_VALUE_LEN = 145;
const MAX_WHITE_SPACE_LEN = 8;
const MAX_EXT_ISS_LENGTH = 52;

// Extended claim lengths
const MAX_EXT_NONCE_LENGTH = 44; // 7 + 29 + 2 + maxWhiteSpaceLen
const MAX_EXT_EV_LENGTH = 55; // 16 + 29 + 2 + maxWhiteSpaceLen
const MAX_EXT_AUD_LENGTH = 160; // 5 + 147 + 2 + maxWhiteSpaceLen

export interface CircuitInputParams {
  jwt: string;
  ephPublicKey: [string, string]; // Split 256-bit key into two 128-bit parts
  maxBlock: string;
  randomness: string;
  salt: string;
}

export interface CircuitInput {
  all_inputs_hash: string;
  padded_unsigned_jwt: string[];
  payload_start_index: string;
  num_sha2_blocks: string;
  payload_len: string;
  signature: string[];
  modulus: string[];
  ext_kc: string[];
  ext_kc_length: string;
  kc_index_b64: string;
  kc_length_b64: string;
  kc_name_length: string;
  kc_colon_index: string;
  kc_value_index: string;
  kc_value_length: string;
  ext_nonce: string[];
  ext_nonce_length: string;
  nonce_index_b64: string;
  nonce_length_b64: string;
  nonce_colon_index: string;
  nonce_value_index: string;
  eph_public_key: string[];
  max_epoch: string;
  jwt_randomness: string;
  ext_ev: string[];
  ext_ev_length: string;
  ev_index_b64: string;
  ev_length_b64: string;
  ev_name_length: string;
  ev_colon_index: string;
  ev_value_index: string;
  ev_value_length: string;
  ext_aud: string[];
  ext_aud_length: string;
  aud_index_b64: string;
  aud_length_b64: string;
  aud_colon_index: string;
  aud_value_index: string;
  aud_value_length: string;
  iss_index_b64: string;
  iss_length_b64: string;
  salt: string;
}

/**
 * Parse a JWT and return its parts
 */
function parseJWT(jwt: string): { header: string; payload: string; signature: string } {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  return {
    header: parts[0],
    payload: parts[1],
    signature: parts[2],
  };
}

/**
 * Base64URL decode to bytes
 */
function base64UrlDecode(str: string): Uint8Array {
  // Add padding if needed
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = Buffer.from(base64, 'base64');
  return new Uint8Array(binary);
}

/**
 * Decode JWT payload to JSON
 */
function decodePayload(payloadB64: string): Record<string, unknown> {
  const decoded = base64UrlDecode(payloadB64);
  return JSON.parse(new TextDecoder().decode(decoded));
}

/**
 * Convert bytes to array of decimal strings
 */
function bytesToDecimalArray(bytes: Uint8Array, targetLength: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < targetLength; i++) {
    result.push((i < bytes.length ? bytes[i] : 0).toString());
  }
  return result;
}

/**
 * Add SHA-256 padding to unsigned JWT
 */
function addSHA256Padding(unsignedJwt: string): { paddedBytes: Uint8Array; numBlocks: number } {
  const bytes = new TextEncoder().encode(unsignedJwt);
  const bitLength = bytes.length * 8;

  // Calculate padding length
  // Message needs to be padded to 512-bit (64 bytes) boundary
  // After adding 1 byte (0x80) and 8 bytes (length), we need to pad to 64-byte boundary
  let paddingLength = 64 - ((bytes.length + 9) % 64);
  if (paddingLength === 64) paddingLength = 0;

  const totalLength = bytes.length + 1 + paddingLength + 8;
  const numBlocks = totalLength / 64;

  const padded = new Uint8Array(totalLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80; // Add 1 bit followed by zeros

  // Add length in bits as big-endian 64-bit integer
  const view = new DataView(padded.buffer);
  view.setBigUint64(totalLength - 8, BigInt(bitLength), false);

  return { paddedBytes: padded, numBlocks };
}

/**
 * Find a claim in the base64-encoded payload
 * Returns the start index and length of the extended claim in base64
 */
function findClaimInB64(
  payloadB64: string,
  claimName: string,
  payloadStartIndex: number
): { indexB64: number; lengthB64: number; extClaim: string; claimValue: string } {
  // Decode payload to find the claim
  const payload = decodePayload(payloadB64);
  const claimValue = payload[claimName];

  if (claimValue === undefined) {
    throw new Error(`Claim "${claimName}" not found in JWT payload`);
  }

  // Build the extended claim string
  const claimValueStr =
    typeof claimValue === 'string' ? `"${claimValue}"` : String(claimValue);
  const extClaim = `"${claimName}":${claimValueStr}`;

  // Decode payload to search for the claim position
  const payloadDecoded = new TextDecoder().decode(base64UrlDecode(payloadB64));

  // Find the position in the decoded payload
  const posInDecoded = payloadDecoded.indexOf(`"${claimName}":`);
  if (posInDecoded === -1) {
    throw new Error(`Could not find claim "${claimName}" in decoded payload`);
  }

  // Now we need to find the corresponding position in the base64 string
  // This is complex because base64 encoding groups 3 bytes into 4 characters
  // We need to find the base64-encoded position

  // Simple approach: search for the base64-encoded version
  // The claim might span multiple base64 blocks, so we need to find
  // where it starts in the b64 string

  // For now, use a heuristic: the b64 position is roughly (decoded_pos * 4 / 3)
  // But we need exact positioning, so let's search
  const payloadBytes = base64UrlDecode(payloadB64);
  const claimBytes = new TextEncoder().encode(`"${claimName}":`);

  // Find the byte position of the claim in the decoded payload
  let bytePos = -1;
  for (let i = 0; i <= payloadBytes.length - claimBytes.length; i++) {
    let match = true;
    for (let j = 0; j < claimBytes.length; j++) {
      if (payloadBytes[i + j] !== claimBytes[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      bytePos = i;
      break;
    }
  }

  if (bytePos === -1) {
    throw new Error(`Could not find byte position of claim "${claimName}"`);
  }

  // Calculate b64 position: we need to find which b64 character corresponds
  // to this byte position. In b64, every 3 bytes become 4 characters.
  // The b64 index for byte position is: floor(bytePos / 3) * 4
  const b64StartIndex = Math.floor(bytePos / 3) * 4;

  // Find the end of the claim value
  let endBytePos = bytePos;
  const valueStr = JSON.stringify(claimValue);
  const fullClaimBytes = new TextEncoder().encode(`"${claimName}":${valueStr}`);
  endBytePos = bytePos + fullClaimBytes.length;

  // Add comma or brace at the end
  if (endBytePos < payloadBytes.length && payloadBytes[endBytePos] === 44) {
    // comma
    endBytePos++;
  }

  const b64EndIndex = Math.ceil(endBytePos / 3) * 4;
  const lengthB64 = b64EndIndex - b64StartIndex;

  // Get the actual b64-encoded claim
  const extClaimB64 = payloadB64.slice(b64StartIndex, b64EndIndex);

  return {
    indexB64: payloadStartIndex + b64StartIndex,
    lengthB64,
    extClaim: extClaim + (endBytePos < payloadBytes.length ? ',' : '}'),
    claimValue: typeof claimValue === 'string' ? claimValue : JSON.stringify(claimValue),
  };
}

/**
 * Parse extended claim to get component positions
 */
function parseExtClaim(extClaim: string): {
  nameLength: number;
  colonIndex: number;
  valueIndex: number;
  valueLength: number;
} {
  const colonIndex = extClaim.indexOf(':');
  const nameLength = colonIndex; // includes quotes

  // Find value start (skip any whitespace after colon)
  let valueIndex = colonIndex + 1;
  while (valueIndex < extClaim.length && extClaim[valueIndex] === ' ') {
    valueIndex++;
  }

  // Find value end (handle quoted strings vs numbers/booleans)
  let valueEnd: number;
  if (extClaim[valueIndex] === '"') {
    // String value - find closing quote
    valueEnd = extClaim.indexOf('"', valueIndex + 1) + 1;
  } else {
    // Non-string value - find comma or end brace
    valueEnd = valueIndex;
    while (
      valueEnd < extClaim.length &&
      extClaim[valueEnd] !== ',' &&
      extClaim[valueEnd] !== '}'
    ) {
      valueEnd++;
    }
  }

  const valueLength = valueEnd - valueIndex;

  return {
    nameLength,
    colonIndex,
    valueIndex,
    valueLength,
  };
}

/**
 * Convert base64url signature to RSA signature limbs (32 x 64-bit little-endian)
 */
function signatureToLimbs(signatureB64: string): string[] {
  const sigBytes = base64UrlDecode(signatureB64);
  if (sigBytes.length !== 256) {
    throw new Error(`Expected 256-byte RSA signature, got ${sigBytes.length}`);
  }

  // Convert to 32 x 64-bit limbs (little-endian)
  const limbs: string[] = [];
  for (let i = 0; i < 32; i++) {
    const start = (31 - i) * 8; // Start from the end (little-endian)
    let limb = 0n;
    for (let j = 0; j < 8; j++) {
      limb |= BigInt(sigBytes[start + j]) << BigInt(j * 8);
    }
    limbs.push(limb.toString());
  }
  return limbs;
}

/**
 * Convert RSA modulus to limbs (32 x 64-bit little-endian)
 */
function modulusToLimbs(n: string): string[] {
  // n is a base64url-encoded big-endian integer
  const nBytes = base64UrlDecode(n);

  // Pad to 256 bytes if needed
  const padded = new Uint8Array(256);
  padded.set(nBytes, 256 - nBytes.length);

  // Convert to 32 x 64-bit limbs (little-endian)
  const limbs: string[] = [];
  for (let i = 0; i < 32; i++) {
    const start = (31 - i) * 8;
    let limb = 0n;
    for (let j = 0; j < 8; j++) {
      limb |= BigInt(padded[start + j]) << BigInt(j * 8);
    }
    limbs.push(limb.toString());
  }
  return limbs;
}

/**
 * Pad extended claim to target length
 */
function padExtClaim(extClaim: string, targetLength: number): string[] {
  const bytes = new TextEncoder().encode(extClaim);
  return bytesToDecimalArray(bytes, targetLength);
}

/**
 * Compute all_inputs_hash using Poseidon
 */
function computeAllInputsHash(
  ephPublicKey: [string, string],
  addressSeed: string,
  maxEpoch: string,
  issB64F: string,
  issIndexMod4: string,
  headerF: string,
  modulusF: string
): string {
  const inputs = [
    BigInt(ephPublicKey[0]),
    BigInt(ephPublicKey[1]),
    BigInt(addressSeed),
    BigInt(maxEpoch),
    BigInt(issB64F),
    BigInt(issIndexMod4),
    BigInt(headerF),
    BigInt(modulusF),
  ];

  const hash = poseidon(inputs);
  return hash.toString();
}

/**
 * Hash bytes to a field element using Poseidon
 */
function hashBytesToField(bytes: Uint8Array): string {
  // Split bytes into 31-byte chunks and hash each
  const chunks: bigint[] = [];
  for (let i = 0; i < bytes.length; i += 31) {
    const chunk = bytes.slice(i, Math.min(i + 31, bytes.length));
    let chunkBigInt = 0n;
    for (let j = 0; j < chunk.length; j++) {
      chunkBigInt = (chunkBigInt << 8n) | BigInt(chunk[j]);
    }
    chunks.push(chunkBigInt);
  }

  if (chunks.length === 0) return '0';
  if (chunks.length === 1) return chunks[0].toString();

  const hash = poseidon(chunks);
  return hash.toString();
}

/**
 * Compute address seed from key claim value and salt
 */
function computeAddressSeed(
  kcNameF: string,
  kcValueF: string,
  audValueF: string,
  salt: string
): string {
  const hashedSalt = poseidon([BigInt(salt)]);
  const addressSeed = poseidon([
    BigInt(kcNameF),
    BigInt(kcValueF),
    BigInt(audValueF),
    hashedSalt,
  ]);
  return addressSeed.toString();
}

/**
 * Generate circuit inputs from JWT and session data
 */
export async function generateCircuitInputs(
  params: CircuitInputParams,
  googleJwks: { keys: { kid: string; n: string; e: string }[] }
): Promise<CircuitInput> {
  const { jwt, ephPublicKey, maxBlock, randomness, salt } = params;

  // Parse JWT
  const { header: headerB64, payload: payloadB64, signature: signatureB64 } = parseJWT(jwt);

  // Decode header to get kid
  const headerDecoded = JSON.parse(
    new TextDecoder().decode(base64UrlDecode(headerB64))
  );
  const kid = headerDecoded.kid;

  // Find the public key
  const jwk = googleJwks.keys.find((k) => k.kid === kid);
  if (!jwk) {
    throw new Error(`JWK with kid "${kid}" not found`);
  }

  // Build unsigned JWT (header.payload)
  const unsignedJwt = `${headerB64}.${payloadB64}`;

  // Add SHA-256 padding
  const { paddedBytes, numBlocks } = addSHA256Padding(unsignedJwt);

  // Calculate payload start index (header length + 1 for the dot)
  const payloadStartIndex = headerB64.length + 1;

  // Find claims in the JWT
  const subClaim = findClaimInB64(payloadB64, 'sub', payloadStartIndex);
  const nonceClaim = findClaimInB64(payloadB64, 'nonce', payloadStartIndex);
  const audClaim = findClaimInB64(payloadB64, 'aud', payloadStartIndex);

  // For email_verified, we use the nonce claim as a placeholder if not using email
  const evClaim = findClaimInB64(payloadB64, 'nonce', payloadStartIndex);

  // Find iss claim for revealing
  const issClaim = findClaimInB64(payloadB64, 'iss', payloadStartIndex);

  // Parse extended claims for component positions
  const subParsed = parseExtClaim(subClaim.extClaim);
  const nonceParsed = parseExtClaim(nonceClaim.extClaim);
  const audParsed = parseExtClaim(audClaim.extClaim);
  const evParsed = parseExtClaim(evClaim.extClaim);

  // Convert signature and modulus to limbs
  const signatureLimbs = signatureToLimbs(signatureB64);
  const modulusLimbs = modulusToLimbs(jwk.n);

  // Hash various components
  const headerBytes = new TextEncoder().encode(headerB64);
  const headerF = hashBytesToField(headerBytes);

  const modulusBytes = base64UrlDecode(jwk.n);
  const modulusF = hashBytesToField(modulusBytes);

  // Hash issuer base64
  const issB64 = payloadB64.slice(
    issClaim.indexB64 - payloadStartIndex,
    issClaim.indexB64 - payloadStartIndex + issClaim.lengthB64
  );
  const issB64Bytes = new TextEncoder().encode(issB64);
  const issB64F = hashBytesToField(issB64Bytes);

  const issIndexMod4 = (issClaim.indexB64 - payloadStartIndex) % 4;

  // Hash key claim name and value
  const kcNameBytes = new TextEncoder().encode('sub'); // Using 'sub' as key claim
  const kcNameF = hashBytesToField(kcNameBytes);

  const kcValueBytes = new TextEncoder().encode(subClaim.claimValue);
  const kcValueF = hashBytesToField(kcValueBytes);

  // Hash aud value
  const audValueBytes = new TextEncoder().encode(audClaim.claimValue);
  const audValueF = hashBytesToField(audValueBytes);

  // Compute address seed
  const addressSeed = computeAddressSeed(kcNameF, kcValueF, audValueF, salt);

  // Compute all_inputs_hash
  const allInputsHash = computeAllInputsHash(
    ephPublicKey,
    addressSeed,
    maxBlock,
    issB64F,
    issIndexMod4.toString(),
    headerF,
    modulusF
  );

  return {
    all_inputs_hash: allInputsHash,
    padded_unsigned_jwt: bytesToDecimalArray(paddedBytes, MAX_PADDED_UNSIGNED_JWT_LEN),
    payload_start_index: payloadStartIndex.toString(),
    num_sha2_blocks: numBlocks.toString(),
    payload_len: payloadB64.length.toString(),
    signature: signatureLimbs,
    modulus: modulusLimbs,

    // Sub claim (key claim)
    ext_kc: padExtClaim(subClaim.extClaim, MAX_EXT_KC_LEN),
    ext_kc_length: subClaim.extClaim.length.toString(),
    kc_index_b64: subClaim.indexB64.toString(),
    kc_length_b64: subClaim.lengthB64.toString(),
    kc_name_length: subParsed.nameLength.toString(),
    kc_colon_index: subParsed.colonIndex.toString(),
    kc_value_index: subParsed.valueIndex.toString(),
    kc_value_length: subParsed.valueLength.toString(),

    // Nonce claim
    ext_nonce: padExtClaim(nonceClaim.extClaim, MAX_EXT_NONCE_LENGTH),
    ext_nonce_length: nonceClaim.extClaim.length.toString(),
    nonce_index_b64: nonceClaim.indexB64.toString(),
    nonce_length_b64: nonceClaim.lengthB64.toString(),
    nonce_colon_index: nonceParsed.colonIndex.toString(),
    nonce_value_index: nonceParsed.valueIndex.toString(),

    // Ephemeral key and session
    eph_public_key: ephPublicKey,
    max_epoch: maxBlock,
    jwt_randomness: randomness,

    // Email verified (using nonce as placeholder)
    ext_ev: padExtClaim(evClaim.extClaim, MAX_EXT_EV_LENGTH),
    ext_ev_length: evClaim.extClaim.length.toString(),
    ev_index_b64: evClaim.indexB64.toString(),
    ev_length_b64: evClaim.lengthB64.toString(),
    ev_name_length: evParsed.nameLength.toString(),
    ev_colon_index: evParsed.colonIndex.toString(),
    ev_value_index: evParsed.valueIndex.toString(),
    ev_value_length: evParsed.valueLength.toString(),

    // Aud claim
    ext_aud: padExtClaim(audClaim.extClaim, MAX_EXT_AUD_LENGTH),
    ext_aud_length: audClaim.extClaim.length.toString(),
    aud_index_b64: audClaim.indexB64.toString(),
    aud_length_b64: audClaim.lengthB64.toString(),
    aud_colon_index: audParsed.colonIndex.toString(),
    aud_value_index: audParsed.valueIndex.toString(),
    aud_value_length: audParsed.valueLength.toString(),

    // Issuer
    iss_index_b64: issClaim.indexB64.toString(),
    iss_length_b64: issClaim.lengthB64.toString(),

    // Salt
    salt,
  };
}

/**
 * Fetch Google's JWKS
 */
export async function fetchGoogleJWKS(): Promise<{
  keys: { kid: string; n: string; e: string; kty: string; alg: string }[];
}> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!response.ok) {
    throw new Error('Failed to fetch Google JWKS');
  }
  return response.json();
}
