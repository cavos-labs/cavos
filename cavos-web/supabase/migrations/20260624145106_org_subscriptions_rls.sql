-- Enable RLS on org_subscriptions. Without it the table is exposed to anyone via
-- the Data API (anon key). Mirrors the org_gas_balances policy set in
-- 20260217_gas_balance.sql: org owners read their own row, service_role (API
-- routes) does all writes.

ALTER TABLE public.org_subscriptions ENABLE ROW LEVEL SECURITY;

-- Org owners can view their own subscription
CREATE POLICY "Org owners can view subscription"
  ON public.org_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = org_subscriptions.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

-- Service role full access (used by API routes / billing module)
CREATE POLICY "Service role manages subscriptions"
  ON public.org_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
