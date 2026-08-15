-- Gas Balance & Deposits
-- On-chain GasTank mirror + deposit tracking for org gas sponsoring

-- Helper: generate a deterministic felt252 from org UUID
-- Uses left(sha256(uuid), 31 bytes) to fit in felt252 (< 2^251)
CREATE OR REPLACE FUNCTION public.generate_org_felt_id(org_id UUID)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT '0x' || left(encode(sha256(org_id::text::bytea), 'hex'), 62)
$$;

-- Cache of on-chain balance + aggregate stats
CREATE TABLE IF NOT EXISTS public.org_gas_balances (
  org_id          UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  balance_strk    NUMERIC(78,18) NOT NULL DEFAULT 0,
  org_felt_id     TEXT NOT NULL,
  total_deposited NUMERIC(78,18) NOT NULL DEFAULT 0,
  total_consumed  NUMERIC(78,18) NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gas_balances_felt ON public.org_gas_balances(org_felt_id);

ALTER TABLE public.org_gas_balances ENABLE ROW LEVEL SECURITY;

-- Org owners can view their own balance
CREATE POLICY "Org owners can view gas balance"
  ON public.org_gas_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = org_gas_balances.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

-- Service role full access (used by API routes)
CREATE POLICY "Service role manages gas balances"
  ON public.org_gas_balances FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Deposit log (verified on-chain transactions)
CREATE TABLE IF NOT EXISTS public.gas_deposits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tx_hash     TEXT NOT NULL UNIQUE,
  amount_strk NUMERIC(78,18) NOT NULL,
  fee_strk    NUMERIC(78,18) NOT NULL,
  net_strk    NUMERIC(78,18) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'confirmed',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gas_deposits_org ON public.gas_deposits(org_id);

ALTER TABLE public.gas_deposits ENABLE ROW LEVEL SECURITY;

-- Org owners can view their own deposits
CREATE POLICY "Org owners can view gas deposits"
  ON public.gas_deposits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = gas_deposits.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role manages gas deposits"
  ON public.gas_deposits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
