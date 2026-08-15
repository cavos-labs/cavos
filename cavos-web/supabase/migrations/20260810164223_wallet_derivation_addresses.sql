-- Deterministic chain adapters derive wallet addresses from identity + appSalt.
-- Rotating appSalt intentionally creates a different wallet, so the registry
-- must preserve both rows instead of overwriting the previous address (and its
-- device/recovery records) for the same user and network.

ALTER TABLE public.wallets
  DROP CONSTRAINT IF EXISTS wallets_app_environment_user_network_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wallets_app_environment_user_network_address_key'
  ) THEN
    ALTER TABLE public.wallets
      ADD CONSTRAINT wallets_app_environment_user_network_address_key
      UNIQUE (app_id, environment_id, user_social_id, network, address);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wallets_identity_network_updated
  ON public.wallets(app_id, environment_id, user_social_id, network, updated_at DESC);
