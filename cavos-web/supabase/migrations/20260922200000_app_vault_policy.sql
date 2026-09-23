-- What the Cavos vault signs for this app without asking, and what it does
-- with everything else. Read by /api/vault/policy; null means the defaults.
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS vault_policy JSONB;
