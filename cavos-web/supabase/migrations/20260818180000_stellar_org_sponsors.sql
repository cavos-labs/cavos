-- Per-org Stellar sponsor accounts + reserve/withdraw ledger.
--
-- Each organization gets its own G-account, derived off-server from the
-- relayer seed (SEP-0005 path m/44'/148'/{index}'). This table stores only
-- the public key and the derivation index — never a secret.
--
-- org_stellar_gas.balance_stroops is available (spendable / withdrawable).
-- reserved_stroops is XLM locked as beginSponsoringFutureReserves on that
-- org's G-account. withdrawn_stroops is lifetime withdrawals.

ALTER TABLE public.org_stellar_gas
  ADD COLUMN IF NOT EXISTS reserved_stroops BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withdrawn_stroops BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.stellar_sponsor_counters (
  network     TEXT PRIMARY KEY,
  next_index  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.org_stellar_sponsors (
  org_id             UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  network            TEXT NOT NULL CHECK (network IN ('stellar-mainnet', 'stellar-testnet')),
  public_key         TEXT NOT NULL,
  derivation_index   INTEGER NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, network),
  UNIQUE (network, derivation_index),
  UNIQUE (network, public_key)
);

CREATE INDEX IF NOT EXISTS idx_org_stellar_sponsors_public
  ON public.org_stellar_sponsors (network, public_key);

ALTER TABLE public.org_stellar_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can view stellar sponsors"
  ON public.org_stellar_sponsors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = org_stellar_sponsors.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages stellar sponsors"
  ON public.org_stellar_sponsors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allocate the next derivation index for a network. First org on a network
-- gets index 1 (not 0 — 0 is reserved as "unassigned").
CREATE OR REPLACE FUNCTION public.next_stellar_sponsor_index(p_network TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  n INTEGER;
BEGIN
  INSERT INTO public.stellar_sponsor_counters (network, next_index)
  VALUES (p_network, 2)
  ON CONFLICT (network) DO UPDATE
    SET next_index = public.stellar_sponsor_counters.next_index + 1
  RETURNING next_index - 1 INTO n;
  RETURN n;
END;
$$;

-- Move available → reserved. Fails (returns false) if the org cannot cover it.
CREATE OR REPLACE FUNCTION public.lock_stellar_reserves(
  p_org_id UUID,
  p_amount_stroops BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_amount_stroops < 0 THEN
    RAISE EXCEPTION 'lock_stellar_reserves: amount must be >= 0';
  END IF;
  IF p_amount_stroops = 0 THEN
    RETURN TRUE;
  END IF;

  UPDATE public.org_stellar_gas
     SET balance_stroops = balance_stroops - p_amount_stroops,
         reserved_stroops = reserved_stroops + p_amount_stroops,
         updated_at = NOW()
   WHERE org_id = p_org_id
     AND balance_stroops >= p_amount_stroops;

  RETURN FOUND;
END;
$$;

-- reserved → available (sponsorship revoked). No-op on zero.
CREATE OR REPLACE FUNCTION public.release_stellar_reserves(
  p_org_id UUID,
  p_amount_stroops BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_amount_stroops <= 0 THEN
    RETURN;
  END IF;
  UPDATE public.org_stellar_gas
     SET reserved_stroops = GREATEST(reserved_stroops - p_amount_stroops, 0),
         balance_stroops = balance_stroops + p_amount_stroops,
         updated_at = NOW()
   WHERE org_id = p_org_id;
END;
$$;

-- Debit available for a withdrawal. Fails if it would overdraw.
CREATE OR REPLACE FUNCTION public.withdraw_stellar_gas(
  p_org_id UUID,
  p_amount_stroops BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_amount_stroops <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.org_stellar_gas
     SET balance_stroops = balance_stroops - p_amount_stroops,
         withdrawn_stroops = withdrawn_stroops + p_amount_stroops,
         updated_at = NOW()
   WHERE org_id = p_org_id
     AND balance_stroops >= p_amount_stroops;

  RETURN FOUND;
END;
$$;

CREATE TABLE IF NOT EXISTS public.stellar_gas_withdrawals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  destination     TEXT NOT NULL,
  amount_stroops  BIGINT NOT NULL,
  tx_hash         TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stellar_gas_withdrawals_org
  ON public.stellar_gas_withdrawals (org_id, created_at DESC);

ALTER TABLE public.stellar_gas_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can view stellar gas withdrawals"
  ON public.stellar_gas_withdrawals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = stellar_gas_withdrawals.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages stellar gas withdrawals"
  ON public.stellar_gas_withdrawals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
