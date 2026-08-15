-- Phase E cleanup (BILLING_AND_DB_SPEC.md §4, §9). Drops the dead MAU/usage
-- machinery now that `wallets` is the single source of truth for usage and
-- `org_subscriptions` (20260621_org_subscriptions.sql) is the per-org billing
-- record. Run AFTER the org_subscriptions migration and AFTER the code that
-- reads org_subscriptions is deployed.
--
-- Verified zero code reads before dropping:
--   - increment_mau / app/api/usage/track  → route deleted in this change.
--   - increment_mau call in app/api/analytics/wallet → removed (usage is now
--     COUNT(wallets) for the org's apps).
--   - usage_metrics was read only by /api/apps/[id]/validate, which now reads
--     org_subscriptions + COUNT(wallets) instead.
--   - app_usage_metrics / active_wallets were write-only (fed by increment_mau).
--   - user_subscriptions (per-user, Stripe) → replaced by org_subscriptions.

-- 1. Signup trigger + function that seeded user_subscriptions. NOTE: only
--    `on_user_signup` is dropped. `on_auth_user_created` (handle_new_user, which
--    inserts into profiles) is KEPT — it is unrelated to billing.
DROP TRIGGER IF EXISTS on_user_signup ON auth.users;
DROP FUNCTION IF EXISTS public.assign_default_subscription();

-- 2. MAU RPC. Drop every historical signature (the (UUID,UUID,DATE) form was
--    superseded by (UUID,UUID,DATE,TEXT) in 20251205_fix_rpc_ambiguity.sql).
DROP FUNCTION IF EXISTS public.increment_mau(UUID, UUID, DATE, TEXT);
DROP FUNCTION IF EXISTS public.increment_mau(UUID, UUID, DATE);

-- 3. Dead / inert tables. Order: app_usage_metrics + active_wallets + usage_metrics
--    (MAU scratch/aggregates) then user_subscriptions (replaced by org_subscriptions).
DROP TABLE IF EXISTS public.app_usage_metrics;
DROP TABLE IF EXISTS public.active_wallets;
DROP TABLE IF EXISTS public.usage_metrics;
DROP TABLE IF EXISTS public.user_subscriptions;
