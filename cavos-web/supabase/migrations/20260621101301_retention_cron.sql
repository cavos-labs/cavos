-- Data retention via pg_cron (BILLING_AND_DB_SPEC.md §11). Replaces the narrow
-- 20260316_cleanup_cron.sql job with the full set of ephemeral-row sweeps. With
-- the wallet-count model there is no MAU aggregate to recompute; these jobs only
-- prune append-only ephemeral/log rows so indexes don't bloat forever.
--
-- Debug windows (7 / 30 / 90 days): never delete the instant a row expires —
-- support needs a window to investigate "my code never arrived" reports.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Retire the old single-purpose job; its work is now covered (with a 7-day debug
-- window) by cleanup-expired-ephemeral-rows below. unschedule is wrapped so this
-- migration is idempotent and safe on a DB where the job was never created.
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-expired-verification-tokens');
EXCEPTION WHEN OTHERS THEN
  -- job didn't exist; nothing to do
  NULL;
END $$;

-- Ephemeral auth/request rows. Daily at 04:00 UTC.
SELECT cron.schedule(
  'cleanup-expired-ephemeral-rows',
  '0 4 * * *',
  $$
    -- OTP codes: expired OR already used. 7-day debug window.
    DELETE FROM public.email_otp_codes
    WHERE (expires_at < now() OR used_at IS NOT NULL)
      AND created_at < now() - interval '7 days';

    -- Email verification tokens: expired OR verified. 7-day debug window.
    DELETE FROM public.email_verification_tokens
    WHERE (expires_at < now() OR verified_at IS NOT NULL)
      AND created_at < now() - interval '7 days';

    -- Device-addition requests in a terminal state. 30-day window.
    DELETE FROM public.device_addition_requests
    WHERE status IN ('approved', 'rejected', 'expired')
      AND created_at < now() - interval '30 days';
  $$
);

-- transactions is a pure count log (PII stripped in 20260316_remove_analytics_pii.sql).
-- The 7-day chart never needs more than a week; 90 days is a generous per-wallet
-- history cap. Adjust if a customer ever needs longer retention.
SELECT cron.schedule(
  'cleanup-old-transactions',
  '0 4 * * *',
  $$
    DELETE FROM public.transactions
    WHERE created_at < now() - interval '90 days';
  $$
);
