-- Move the sponsored-trustline allowlist from the org to the app.
--
-- The org is who *pays* — the reserve comes out of that org's sponsor account —
-- but it is not who the list describes. Wallets are derived per app (appSalt,
-- app_id), so which assets a wallet may hold is a property of the product, not
-- of the billing account: two apps under one org have no reason to share it.
-- The list landed on the org only because that is where the Stellar sponsor
-- already lived.
--
-- Existing rows are carried over to every app of their org, which is exactly
-- what the per-org list meant.

CREATE TABLE IF NOT EXISTS public.app_stellar_trustlines (
  app_id        UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  network       TEXT NOT NULL CHECK (network IN ('stellar-mainnet', 'stellar-testnet')),
  -- Classic asset codes are 1..12 alphanumeric; anything else cannot name an
  -- asset, so it is rejected here rather than at the relay.
  asset_code    TEXT NOT NULL CHECK (asset_code ~ '^[A-Za-z0-9]{1,12}$'),
  asset_issuer  TEXT NOT NULL CHECK (asset_issuer ~ '^G[A-Z2-7]{55}$'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (app_id, network, asset_code, asset_issuer)
);

ALTER TABLE public.app_stellar_trustlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org owners can view stellar trustlines" ON public.app_stellar_trustlines;
CREATE POLICY "Org owners can view stellar trustlines"
  ON public.app_stellar_trustlines FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM public.apps
        JOIN public.organizations ON organizations.id = apps.organization_id
       WHERE apps.id = app_stellar_trustlines.app_id
         AND organizations.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages stellar trustlines" ON public.app_stellar_trustlines;
CREATE POLICY "Service role manages stellar trustlines"
  ON public.app_stellar_trustlines FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Carry over whatever the org-keyed table holds. A per-org entry authorised the
-- asset for every app of that org, so that is what it becomes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'org_stellar_trustlines'
  ) THEN
    INSERT INTO public.app_stellar_trustlines (app_id, network, asset_code, asset_issuer, created_at)
    SELECT apps.id, t.network, t.asset_code, t.asset_issuer, t.created_at
      FROM public.org_stellar_trustlines t
      JOIN public.apps ON apps.organization_id = t.org_id
    ON CONFLICT DO NOTHING;

    DROP TABLE public.org_stellar_trustlines;
  END IF;
END $$;
