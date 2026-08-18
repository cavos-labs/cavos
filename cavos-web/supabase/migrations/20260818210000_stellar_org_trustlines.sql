-- Per-org allowlist of classic Stellar assets the relayer will sponsor a
-- trustline for.
--
-- A trustline is a subentry, so every one opened locks a base reserve from that
-- org's sponsor account. An ungated `changeTrust` is therefore a way to drain
-- the org's pot one asset at a time, and this table is the bound: the relay
-- refuses to sponsor a trustline for an asset that is not listed here. Closing a
-- trustline releases a reserve rather than consuming one, so it is allowed for
-- any asset and needs no row.
--
-- Mirrors the RLS shape of org_stellar_sponsors: org owners read their own rows;
-- service_role (API routes) does all writes.

CREATE TABLE IF NOT EXISTS public.org_stellar_trustlines (
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  network       TEXT NOT NULL CHECK (network IN ('stellar-mainnet', 'stellar-testnet')),
  -- Classic asset codes are 1..12 alphanumeric; anything else cannot name an
  -- asset, so it is rejected here rather than at the relay.
  asset_code    TEXT NOT NULL CHECK (asset_code ~ '^[A-Za-z0-9]{1,12}$'),
  asset_issuer  TEXT NOT NULL CHECK (asset_issuer ~ '^G[A-Z2-7]{55}$'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, network, asset_code, asset_issuer)
);

-- The relay reads the whole list for one (org, network) on every trustline
-- request; the primary key already leads with those two columns.

ALTER TABLE public.org_stellar_trustlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org owners can view stellar trustlines" ON public.org_stellar_trustlines;
CREATE POLICY "Org owners can view stellar trustlines"
  ON public.org_stellar_trustlines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = org_stellar_trustlines.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages stellar trustlines" ON public.org_stellar_trustlines;
CREATE POLICY "Service role manages stellar trustlines"
  ON public.org_stellar_trustlines FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
