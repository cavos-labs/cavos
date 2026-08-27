-- One address per (app, environment, user, network).
--
-- The address is no longer derived from identity + appSalt, so there is no such
-- thing as a salt-rotation sibling row. The first device to register names the
-- wallet; later logins look that single row up.
--
-- No backfill: pre-existing identity-derived rows keep whatever they have. They
-- are abandoned demo wallets and nothing in production depends on them.

ALTER TABLE public.wallets
  DROP CONSTRAINT IF EXISTS wallets_app_environment_user_network_address_key;

-- Salt-rotation siblings would block the new unique key. Keep the earliest row
-- per identity (the "first device" by definition) and drop the rest; these are
-- abandoned identity-derived demo wallets.
DELETE FROM public.wallets w
USING public.wallets keep
WHERE keep.app_id = w.app_id
  AND keep.environment_id = w.environment_id
  AND keep.user_social_id = w.user_social_id
  AND keep.network = w.network
  AND (keep.created_at, keep.id) < (w.created_at, w.id);

ALTER TABLE public.wallets
  ADD CONSTRAINT wallets_app_environment_user_network_key
  UNIQUE (app_id, environment_id, user_social_id, network);

DROP INDEX IF EXISTS idx_wallets_identity_network_updated;
