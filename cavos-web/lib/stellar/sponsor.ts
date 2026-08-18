/**
 * Per-org Stellar sponsor G-account.
 *
 * Public key + derivation index live in `org_stellar_sponsors`. The secret is
 * derived in-process from STELLAR_RELAYER_SECRET via SEP-0005 and never stored.
 */
import { Keypair } from '@stellar/stellar-sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { deriveStellarAccount } from './hd';
import { LocalStellarSigner, type StellarRelayerSigner, masterSeedFor } from './signer';
import { horizonServerFor, type StellarNetwork } from './relayer';

export interface OrgSponsor {
  orgId: string;
  network: StellarNetwork;
  publicKey: string;
  derivationIndex: number;
}

function signerFromKeypair(kp: Keypair): StellarRelayerSigner {
  return new LocalStellarSigner(kp);
}

function deriveFor(network: StellarNetwork, index: number): Keypair {
  return deriveStellarAccount(masterSeedFor(network), index);
}

/**
 * Return the org's sponsor row, allocating the next derivation index on first
 * call. Verifies the stored public key still matches the seed + index — a
 * mismatch means the DB row was tampered with or the seed rotated.
 */
export async function ensureOrgSponsor(
  orgId: string,
  network: StellarNetwork,
): Promise<OrgSponsor> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('org_stellar_sponsors')
    .select('public_key, derivation_index')
    .eq('org_id', orgId)
    .eq('network', network)
    .maybeSingle();

  if (existing) {
    const kp = deriveFor(network, existing.derivation_index);
    if (kp.publicKey() !== existing.public_key) {
      throw new Error(
        `stellar sponsor key mismatch for org ${orgId} on ${network}: ` +
          `stored ${existing.public_key} != derived ${kp.publicKey()}`,
      );
    }
    return {
      orgId,
      network,
      publicKey: existing.public_key,
      derivationIndex: existing.derivation_index,
    };
  }

  const { data: index, error: idxErr } = await admin.rpc('next_stellar_sponsor_index', {
    p_network: network,
  });
  if (idxErr || index == null) {
    throw new Error(`failed to allocate stellar sponsor index: ${idxErr?.message ?? 'null'}`);
  }
  const derivationIndex = Number(index);
  const kp = deriveFor(network, derivationIndex);

  const { error: insErr } = await admin.from('org_stellar_sponsors').insert({
    org_id: orgId,
    network,
    public_key: kp.publicKey(),
    derivation_index: derivationIndex,
  });

  if (insErr) {
    // Lost the insert race — another request allocated for this org.
    const { data: raced } = await admin
      .from('org_stellar_sponsors')
      .select('public_key, derivation_index')
      .eq('org_id', orgId)
      .eq('network', network)
      .single();
    if (!raced) throw new Error(`failed to insert stellar sponsor: ${insErr.message}`);
    const racedKp = deriveFor(network, raced.derivation_index);
    if (racedKp.publicKey() !== raced.public_key) {
      throw new Error(`stellar sponsor key mismatch for org ${orgId} on ${network}`);
    }
    return {
      orgId,
      network,
      publicKey: raced.public_key,
      derivationIndex: raced.derivation_index,
    };
  }

  return { orgId, network, publicKey: kp.publicKey(), derivationIndex };
}

export async function getOrgSponsorSigner(
  orgId: string,
  network: StellarNetwork,
): Promise<{ sponsor: OrgSponsor; signer: StellarRelayerSigner }> {
  const sponsor = await ensureOrgSponsor(orgId, network);
  const kp = deriveFor(network, sponsor.derivationIndex);
  return { sponsor, signer: signerFromKeypair(kp) };
}

/** Horizon account for a sponsor, or null if it has not been created yet. */
export async function loadSponsorAccount(network: StellarNetwork, publicKey: string) {
  try {
    return await horizonServerFor(network).loadAccount(publicKey);
  } catch (e) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw e;
  }
}

/** Testnet only: friendbot-fund a brand-new sponsor so creates can land. */
export async function ensureTestnetFunded(publicKey: string): Promise<void> {
  const existing = await loadSponsorAccount('stellar-testnet', publicKey);
  if (existing) return;
  const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`friendbot failed (${res.status}): ${body}`);
  }
}

export function numSponsoringOf(account: { num_sponsoring?: number } | null): number {
  return Number(account?.num_sponsoring ?? 0);
}

export function accountCounts(account: object) {
  const a = account as Record<string, unknown>;
  return {
    subentries: Number(a.subentry_count ?? a.subentryCount ?? 0),
    sponsoring: Number(a.num_sponsoring ?? a.numSponsoring ?? 0),
    sponsored: Number(a.num_sponsored ?? a.numSponsored ?? 0),
  };
}
