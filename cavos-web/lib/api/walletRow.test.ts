import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { insertWalletRow } from './walletRow';

const identity = {
    app_id: 'app-1',
    environment_id: 'env-1',
    user_social_id: 'user-1',
    network: 'sepolia',
};

/**
 * Minimal stand-in for the supabase query builder: `insert(...).select(...).single()`
 * and the chained `.eq(...).maybeSingle()` select.
 */
function fakeAdmin(opts: {
    insert: { data?: unknown; error?: { code: string } };
    existing?: { data?: unknown; error?: unknown };
}) {
    const calls: string[] = [];
    const admin = {
        from() {
            return {
                insert(row: unknown) {
                    calls.push('insert');
                    void row;
                    return {
                        select: () => ({ single: async () => opts.insert }),
                    };
                },
                select() {
                    calls.push('select');
                    const chain: any = {
                        eq: () => chain,
                        maybeSingle: async () => opts.existing ?? { data: null, error: null },
                    };
                    return chain;
                },
            };
        },
    };
    return { admin, calls };
}

describe('insertWalletRow', () => {
    it('creates the row when the identity is unclaimed', async () => {
        const row = { id: 'w1', address: '0xaaa', network: 'sepolia', updated_at: 't' };
        const { admin, calls } = fakeAdmin({ insert: { data: row } });
        const result = await insertWalletRow(admin, identity, { address: '0xaaa' });
        assert.deepEqual(result, { status: 'created', row });
        assert.deepEqual(calls, ['insert']);
    });

    it('returns the existing address on a unique violation', async () => {
        const existing = { id: 'w1', address: '0xfirst', network: 'sepolia', updated_at: 't' };
        const { admin } = fakeAdmin({
            insert: { error: { code: '23505' } },
            existing: { data: existing },
        });
        const result = await insertWalletRow(admin, identity, { address: '0xsecond' });
        assert.equal(result.status, 'exists');
        assert.equal(result.status === 'exists' && result.row.address, '0xfirst');
    });

    it('surfaces a non-conflict database error', async () => {
        const { admin } = fakeAdmin({ insert: { error: { code: '42501' } } });
        const result = await insertWalletRow(admin, identity, { address: '0xaaa' });
        assert.equal(result.status, 'error');
    });

    it('errors when the conflict came from another identity holding the address', async () => {
        const { admin } = fakeAdmin({
            insert: { error: { code: '23505' } },
            existing: { data: null },
        });
        const result = await insertWalletRow(admin, identity, { address: '0xtaken' });
        assert.equal(result.status, 'error');
    });
});
