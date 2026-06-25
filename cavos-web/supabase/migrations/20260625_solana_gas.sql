-- Solana gas metering — per-org prepaid SOL balance (lamports).
--
-- Unlike Starknet (org_gas_balances, backed by an on-chain GasTank in STRK),
-- Solana has no on-chain gas tank: the relayer lives in cavos-web. So this is a
-- pure off-chain ledger in lamports. Orgs deposit SOL to the Cavos relayer
-- address; deposits credit the org; each relayed tx debits the real lamports the
-- relayer spent (fee + rent). Cavos's relayer float ≈ sum of balances.
--
-- Mirrors the RLS shape of org_gas_balances (20260217_gas_balance.sql): org
-- owners read their own row; service_role (API routes) does all writes.

-- ── Balance ledger ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_solana_gas (
  org_id                    UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  balance_lamports          BIGINT NOT NULL DEFAULT 0,
  total_deposited_lamports  BIGINT NOT NULL DEFAULT 0,
  total_consumed_lamports   BIGINT NOT NULL DEFAULT 0,
  updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.org_solana_gas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can view solana gas"
  ON public.org_solana_gas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = org_solana_gas.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages solana gas"
  ON public.org_solana_gas FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Deposit log (verified on-chain transfers, deduped by signature) ─────────
CREATE TABLE IF NOT EXISTS public.solana_gas_deposits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  signature       TEXT NOT NULL UNIQUE,
  amount_lamports BIGINT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'confirmed',
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solana_gas_deposits_org ON public.solana_gas_deposits(org_id);

ALTER TABLE public.solana_gas_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can view solana gas deposits"
  ON public.solana_gas_deposits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = solana_gas_deposits.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages solana gas deposits"
  ON public.solana_gas_deposits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Atomic credit: record deposit (deduped) + bump balance in one tx ────────
-- Returns TRUE if credited, FALSE if the signature was already recorded.
CREATE OR REPLACE FUNCTION public.credit_solana_gas(
  p_org_id UUID,
  p_amount_lamports BIGINT,
  p_signature TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.solana_gas_deposits (org_id, signature, amount_lamports)
  VALUES (p_org_id, p_signature, p_amount_lamports)
  ON CONFLICT (signature) DO NOTHING;

  IF NOT FOUND THEN
    RETURN FALSE; -- duplicate signature, no credit applied
  END IF;

  INSERT INTO public.org_solana_gas (org_id, balance_lamports, total_deposited_lamports)
  VALUES (p_org_id, p_amount_lamports, p_amount_lamports)
  ON CONFLICT (org_id) DO UPDATE
    SET balance_lamports = public.org_solana_gas.balance_lamports + EXCLUDED.balance_lamports,
        total_deposited_lamports = public.org_solana_gas.total_deposited_lamports + EXCLUDED.total_deposited_lamports,
        updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- ── Atomic debit: subtract consumed lamports (clamped at 0) ────────────────
CREATE OR REPLACE FUNCTION public.debit_solana_gas(
  p_org_id UUID,
  p_amount_lamports BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.org_solana_gas (org_id, balance_lamports, total_consumed_lamports)
  VALUES (p_org_id, 0, p_amount_lamports)
  ON CONFLICT (org_id) DO UPDATE
    SET balance_lamports = GREATEST(public.org_solana_gas.balance_lamports - p_amount_lamports, 0),
        total_consumed_lamports = public.org_solana_gas.total_consumed_lamports + p_amount_lamports,
        updated_at = NOW();
END;
$$;
