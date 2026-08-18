import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BASE_RESERVE_STROOPS,
  accountMinBalanceStroops,
  estimateReservedStroops,
  reservedDeltaStroops,
} from './reserves';

const BASE = DEFAULT_BASE_RESERVE_STROOPS;

describe('estimateReservedStroops', () => {
  it('locks nothing for a fee-bump', () => {
    assert.equal(estimateReservedStroops({ operations: [] } as never, 'fee-bump'), 0);
  });

  it('counts createAccount as two entries', () => {
    const tx = { operations: [{ type: 'createAccount' }] } as never;
    assert.equal(estimateReservedStroops(tx, 'create'), 2 * BASE);
  });

  it('counts a create + signer + two data entries', () => {
    const tx = {
      operations: [
        { type: 'beginSponsoringFutureReserves' },
        { type: 'createAccount' },
        { type: 'setOptions', signer: { ed25519PublicKey: 'GAAA' } },
        { type: 'manageData', value: Buffer.from('x') },
        { type: 'manageData', value: Buffer.from('y') },
        { type: 'endSponsoringFutureReserves' },
      ],
    } as never;
    // 2 + 1 + 1 + 1 = 5
    assert.equal(estimateReservedStroops(tx, 'create'), 5 * BASE);
  });

  it('does not count a data-entry clear as a lock', () => {
    const tx = { operations: [{ type: 'manageData', value: null }] } as never;
    assert.equal(estimateReservedStroops(tx, 'sponsored-data'), 0);
  });

  it('counts a changeTrust as one entry', () => {
    const tx = { operations: [{ type: 'changeTrust' }] } as never;
    assert.equal(estimateReservedStroops(tx, 'sponsored-data'), BASE);
  });
});

describe('reservedDeltaStroops', () => {
  it('uses Horizon num_sponsoring, never negative', () => {
    assert.equal(reservedDeltaStroops(0, 5), 5 * BASE);
    assert.equal(reservedDeltaStroops(5, 5), 0);
    assert.equal(reservedDeltaStroops(5, 3), 0);
  });
});

describe('accountMinBalanceStroops', () => {
  it('is (2 + subentries + sponsoring - sponsored) × base', () => {
    assert.equal(accountMinBalanceStroops(0, 0, 0), 2 * BASE);
    assert.equal(accountMinBalanceStroops(1, 4, 0), 7 * BASE);
    assert.equal(accountMinBalanceStroops(0, 4, 4), 2 * BASE);
  });
});
