-- Stellar gas metering — per-org prepaid XLM balance (stroops).
--
-- Same shape as Solana (org_solana_gas, 20260625_solana_gas.sql): Stellar's
-- relayer lives in cavos-web and has no on-chain gas tank, so this is a pure
-- off-chain ledger in stroops. Orgs deposit XLM to the Cavos relayer G-account
-- (carrying a native MEMO_TEXT `cavos:gas:<org_id>` for attribution); deposits
-- credit the org; each relayed Soroban tx debits the real `feeCharged` the
-- relayer spent. Cavos's relayer float ≈ sum of balances.
--
-- Mirrors the RLS shape of org_solana_gas: org owners read their own row;
-- service_role (API routes) does all writes.

-- ── Balance ledger ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_stellar_gas (
  org_id                   UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  balance_stroops          BIGINT NOT NULL DEFAULT 0,
  total_deposited_stroops  BIGINT NOT NULL DEFAULT 0,
  total_consumed_stroops   BIGINT NOT NULL DEFAULT 0,
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.org_stellar_gas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can view stellar gas"
  ON public.org_stellar_gas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = org_stellar_gas.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages stellar gas"
  ON public.org_stellar_gas FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Deposit log (verified on-chain payments, deduped by tx hash) ────────────
CREATE TABLE IF NOT EXISTS public.stellar_gas_deposits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tx_hash         TEXT NOT NULL UNIQUE,
  amount_stroops  BIGINT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'confirmed',
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stellar_gas_deposits_org ON public.stellar_gas_deposits(org_id);

ALTER TABLE public.stellar_gas_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can view stellar gas deposits"
  ON public.stellar_gas_deposits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = stellar_gas_deposits.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages stellar gas deposits"
  ON public.stellar_gas_deposits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Atomic credit: record deposit (deduped) + bump balance in one tx ────────
-- Returns TRUE if credited, FALSE if the tx hash was already recorded.
CREATE OR REPLACE FUNCTION public.credit_stellar_gas(
  p_org_id UUID,
  p_amount_stroops BIGINT,
  p_tx_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.stellar_gas_deposits (org_id, tx_hash, amount_stroops)
  VALUES (p_org_id, p_tx_hash, p_amount_stroops)
  ON CONFLICT (tx_hash) DO NOTHING;

  IF NOT FOUND THEN
    RETURN FALSE; -- duplicate tx hash, no credit applied
  END IF;

  INSERT INTO public.org_stellar_gas (org_id, balance_stroops, total_deposited_stroops)
  VALUES (p_org_id, p_amount_stroops, p_amount_stroops)
  ON CONFLICT (org_id) DO UPDATE
    SET balance_stroops = public.org_stellar_gas.balance_stroops + EXCLUDED.balance_stroops,
        total_deposited_stroops = public.org_stellar_gas.total_deposited_stroops + EXCLUDED.total_deposited_stroops,
        updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- ── Atomic debit: subtract consumed stroops (clamped at 0) ─────────────────
CREATE OR REPLACE FUNCTION public.debit_stellar_gas(
  p_org_id UUID,
  p_amount_stroops BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.org_stellar_gas (org_id, balance_stroops, total_consumed_stroops)
  VALUES (p_org_id, 0, p_amount_stroops)
  ON CONFLICT (org_id) DO UPDATE
    SET balance_stroops = GREATEST(public.org_stellar_gas.balance_stroops - p_amount_stroops, 0),
        total_consumed_stroops = public.org_stellar_gas.total_consumed_stroops + p_amount_stroops,
        updated_at = NOW();
END;
$$;
