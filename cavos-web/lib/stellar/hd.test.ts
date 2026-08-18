import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { slip0010CkdHardened, slip0010Master, deriveStellarAccount } from './hd';

// SLIP-0010 ed25519 test vector (seed 00010203…0f).
// https://github.com/satoshilabs/slips/blob/master/slip-0010.md

describe('slip0010', () => {
  const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');

  it('matches the SLIP-0010 master key', () => {
    const { key, chain } = slip0010Master(seed);
    assert.equal(
      key.toString('hex'),
      '2b4be7f19ee27bbf30c667b642d5f4aa69fd169872f8fc3059c08ebae2eb19e7',
    );
    assert.equal(
      chain.toString('hex'),
      '90046a93de5380a72b5e45010748567d5ea02bbf6522f979e05c0d8d8ca9fffb',
    );
  });

  it('matches the SLIP-0010 m/0\' child', () => {
    const master = slip0010Master(seed);
    const child = slip0010CkdHardened(master.key, master.chain, 0);
    assert.equal(
      child.key.toString('hex'),
      '68e0fe46dfb67e368c75379acec591dad19df3cde26e63b93a8e704f1dade7a3',
    );
    assert.equal(
      child.chain.toString('hex'),
      '8b59aa11380b624e81507a27fedda59fea6d0b779a778918a2fd3590e16e9c69',
    );
  });

  it('refuses index 0 for org accounts', () => {
    assert.throws(() => deriveStellarAccount(seed, 0), /accountIndex must be >= 1/);
  });

  it('derives distinct Stellar G-addresses per index', () => {
    const a = deriveStellarAccount(seed, 1);
    const b = deriveStellarAccount(seed, 2);
    assert.notEqual(a.publicKey(), b.publicKey());
    assert.match(a.publicKey(), /^G[A-Z2-7]{55}$/);
    // Stable across calls.
    assert.equal(deriveStellarAccount(seed, 1).publicKey(), a.publicKey());
  });
});
