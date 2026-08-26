import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeAppSalt } from './appSalt';

describe('computeAppSalt', () => {
  const baseSalt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  it('produces consistent salts for the same UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const salt1 = computeAppSalt(uuid, baseSalt);
    const salt2 = computeAppSalt(uuid, baseSalt);
    assert.equal(salt1, salt2, 'Same UUID should produce identical salts');
  });

  it('produces different salts for different UUIDs', () => {
    const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
    const uuid2 = '660e8400-e29b-41d4-a716-446655440001';
    const salt1 = computeAppSalt(uuid1, baseSalt);
    const salt2 = computeAppSalt(uuid2, baseSalt);
    assert.notEqual(salt1, salt2, 'Different UUIDs should produce different salts');
  });

  it('produces different salts for different base salts', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const baseSalt2 = '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';
    const salt1 = computeAppSalt(uuid, baseSalt);
    const salt2 = computeAppSalt(uuid, baseSalt2);
    assert.notEqual(salt1, salt2, 'Different base salts should produce different salts');
  });

  it('returns a hex string', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const salt = computeAppSalt(uuid, baseSalt);
    assert.match(salt, /^0x[0-9a-f]+$/i, 'Salt should be a hex string');
  });

  it('always uses the canonical apps.id UUID for deterministic wallet addresses', () => {
    const canonicalUuid = '550e8400-e29b-41d4-a716-446655440000';
    const salt = computeAppSalt(canonicalUuid, baseSalt);
    assert.ok(salt.length > 0, 'Salt computation with canonical UUID should succeed');
  });
});

describe('salt canonicalization requirement', () => {
  it('requires UUID format - cav_... public_id must be resolved first', () => {
    const baseSalt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const publicId = 'cav_abc123def456';

    assert.throws(
      () => computeAppSalt(publicId, baseSalt),
      /Cannot convert.*to a BigInt|Invalid/i,
      'computeAppSalt rejects non-UUID identifiers; cav_... public_ids must be resolved to apps.id first'
    );
  });

  it('demonstrates that two different UUIDs produce different salts (same app via different routes)', () => {
    const baseSalt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const canonicalUuid = '550e8400-e29b-41d4-a716-446655440000';
    const differentUuid = '660e8400-e29b-41d4-a716-446655440001';

    const saltFromCanonical = computeAppSalt(canonicalUuid, baseSalt);
    const saltFromDifferent = computeAppSalt(differentUuid, baseSalt);

    assert.notEqual(
      saltFromCanonical,
      saltFromDifferent,
      'Different UUIDs produce different salts - this is why we must always resolve to canonical apps.id'
    );
  });

  it('ensures the same canonical UUID always produces the same salt', () => {
    const baseSalt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const canonicalUuid = '550e8400-e29b-41d4-a716-446655440000';

    const salt1 = computeAppSalt(canonicalUuid, baseSalt);
    const salt2 = computeAppSalt(canonicalUuid, baseSalt);

    assert.equal(
      salt1,
      salt2,
      'Same canonical apps.id must always produce the same salt for deterministic wallet addresses'
    );
  });
});
