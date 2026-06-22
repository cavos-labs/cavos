-- org_subscriptions: per-org billing state. Replaces user_subscriptions (per-user,
-- Stripe) which is dropped in 20260621_drop_legacy_usage.sql. Billing entity is the
-- organization — aligns with org_gas_balances and organization_api_keys.
--
-- See docs/BILLING_AND_DB_SPEC.md §4 for the full schema rationale.
-- plan_tier is free text so 'custom' contracts (set manually, billed out-of-band)
-- reuse the same column; onvo_* columns stay NULL for custom orgs.

CREATE TABLE IF NOT EXISTS public.org_subscriptions (
  org_id                UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_tier             TEXT NOT NULL DEFAULT 'free',    -- 'free' | 'pro' | 'custom'
  status                TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'past_due' | 'canceled'
  onvo_customer_id      TEXT,                            -- NULL for 'custom' (billed out-of-band)
  onvo_subscription_id  TEXT,                            -- NULL for 'custom'
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN NOT NULL DEFAULT false,
  custom_wallet_limit   INTEGER,                         -- NULL = unlimited; only meaningful for 'custom'
  custom_contract_ref   TEXT,                            -- internal reference to the signed contract
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill every existing org as free/active. New orgs are expected to get a row
-- via the dashboard on first billing-status read; this guarantees every current
-- org resolves to a concrete plan in orgPlan() without special-casing NULLs.
INSERT INTO public.org_subscriptions (org_id, plan_tier, status)
SELECT id, 'free', 'active' FROM public.organizations
ON CONFLICT (org_id) DO NOTHING;

-- Wallet-count lookup index for the billing query
-- (SELECT COUNT(*) FROM wallets WHERE app_id IN (<apps of org>)).
-- idx_wallets_app_id already exists from 20251120_analytics.sql; this is an
-- idempotent safety net so the billing module can rely on the index name
-- wallets_app_id_idx regardless of migration order on fresh vs existing DBs.
CREATE INDEX IF NOT EXISTS wallets_app_id_idx ON public.wallets(app_id);

-- updated_at trigger, matching the convention from 20250119_initial_schema.
CREATE TRIGGER set_org_subscriptions_updated_at
  BEFORE UPDATE ON public.org_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
