-- One address per (app, environment, user, network).
--
-- The address is no longer derived from identity + appSalt: the first device
-- signer names it, and this table is the source of truth for later logins.
--
-- Every row with a `user_social_id` was written by @cavos/kit <= 0.1.9 and
-- points at an account of the old shape — a permissionless `initialize`, an
-- identity-derived salt, the pre-pivot Stellar master key. None of them are
-- reachable under the new contracts, and serving one to the new SDK hands the
-- user a wallet it can never sign for. They are deleted rather than kept and
-- filtered: a row nothing may ever read is not a record, it is a trap.
--
-- The frozen @cavos/react SDK writes through /api/analytics/wallet, which never
-- sets `user_social_id`. Those rows are untouched, and with them the wallet
-- counts every react integration bills on.

ALTER TABLE public.wallets
  DROP CONSTRAINT IF EXISTS wallets_app_environment_user_network_address_key;

-- Runs exactly once, before any v2 row exists — which is the only moment
-- `user_social_id IS NOT NULL` cleanly separates the old model from the new.
DELETE FROM public.wallets WHERE user_social_id IS NOT NULL;

-- Salt rotation used to create a sibling row per salt, so `address` was part of
-- the old key. Under the new model an identity has exactly one wallet, and this
-- constraint is what makes the POST insert-only: the index decides who won the
-- claim race, not the application code.
ALTER TABLE public.wallets
  ADD CONSTRAINT wallets_app_environment_user_network_key
  UNIQUE (app_id, environment_id, user_social_id, network);

-- Only existed for the GET's `ORDER BY updated_at DESC LIMIT 1`, which is gone.
DROP INDEX IF EXISTS idx_wallets_identity_network_updated;
