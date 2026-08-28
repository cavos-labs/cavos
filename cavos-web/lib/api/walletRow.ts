/**
 * Insert-only registry write.
 *
 * The first device to register names the address. One row per
 * (app_id, environment_id, user_social_id, network); a later POST carrying a
 * different address lost the race and gets the existing one back. `address` is
 * never overwritten.
 */

export type WalletIdentity = {
    app_id: string;
    environment_id: string;
    user_social_id: string;
    network: string;
};

export type WalletRowResult =
    | { status: 'created'; row: { id: string; address: string; network: string; updated_at: string } }
    | { status: 'exists'; row: { id: string; address: string; network: string; updated_at: string } }
    | { status: 'error'; error: unknown };

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505';

type Admin = {
    from: (table: string) => any;
};

export async function insertWalletRow(
    admin: Admin,
    identity: WalletIdentity,
    row: Record<string, unknown>,
): Promise<WalletRowResult> {
    const { data, error } = await admin
        .from('wallets')
        .insert(row)
        .select('id, address, network, updated_at')
        .single();

    if (!error) return { status: 'created', row: data };
    if (error.code !== UNIQUE_VIOLATION) return { status: 'error', error };

    const existing = await admin
        .from('wallets')
        .select('id, address, network, updated_at')
        .eq('app_id', identity.app_id)
        .eq('environment_id', identity.environment_id)
        .eq('user_social_id', identity.user_social_id)
        .eq('network', identity.network)
        .maybeSingle();

    // The conflict can also come from the global UNIQUE(address, network) — the
    // address belongs to a different identity. No row of ours to return.
    if (existing.error || !existing.data) return { status: 'error', error: existing.error ?? error };
    return { status: 'exists', row: existing.data };
}
