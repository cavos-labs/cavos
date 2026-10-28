import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bundleAssetName, findBundleAssetUrl, isValidPcr0 } from './releases';

const pcr0 = 'ab'.repeat(48);

describe('isValidPcr0', () => {
  it('accepts 96 lowercase hex characters', () => {
    assert.equal(isValidPcr0(pcr0), true);
  });

  it('rejects wrong length, uppercase and non-hex', () => {
    assert.equal(isValidPcr0(pcr0.slice(1)), false);
    assert.equal(isValidPcr0(pcr0 + 'a'), false);
    assert.equal(isValidPcr0(pcr0.toUpperCase()), false);
    assert.equal(isValidPcr0('g'.repeat(96)), false);
    assert.equal(isValidPcr0(`${pcr0.slice(2)}../`), false);
    assert.equal(isValidPcr0(''), false);
  });
});

describe('findBundleAssetUrl', () => {
  const releases = [
    { assets: [{ name: 'enclave.eif', url: 'https://api/eif' }] },
    { assets: [{ name: `enclave-${'cd'.repeat(48)}.sigstore.json`, url: 'https://api/other' }] },
    {},
    { assets: [{ name: bundleAssetName(pcr0), url: 'https://api/match' }] },
  ];

  it('returns the url of the exactly named asset', () => {
    assert.equal(findBundleAssetUrl(releases, pcr0), 'https://api/match');
  });

  it('returns null when no release carries the bundle', () => {
    assert.equal(findBundleAssetUrl(releases, 'ef'.repeat(48)), null);
    assert.equal(findBundleAssetUrl([], pcr0), null);
  });
});
