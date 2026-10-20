-- STRK20 private-transfer settings per network for the Cavos vault. Read by
-- /api/vault/policy and the gas webhook; null means privacy is off.
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS vault_privacy JSONB;
