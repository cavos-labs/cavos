-- Drop the pg_net HTTP jobs. Each one got a Cloudflare 403 on every call, so
-- none of them has done anything, and none is needed:
--   - cavos-sync-jwks: JWKS sync runs from GitHub Actions (sync-jwks.yml).
--   - cavos-webhook-retries: no webhook endpoints exist.
--   - cavos-social-recovery-cleanup: its route was removed with the move to
--     Nitro, which has no VMs to clean up. Abandoned sessions are still expired
--     by expire-social-recovery-sessions, in SQL.
--
-- They were also the bulk of the database: net._http_response had grown to
-- 232 MB on disk for ~150 live rows, and cron.job_run_details to 45 MB.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN (
  'cavos-webhook-retries',
  'cavos-sync-jwks',
  'cavos-social-recovery-cleanup'
);

-- Calling it would schedule the jobs again.
DROP FUNCTION IF EXISTS public.configure_cavos_http_crons(TEXT, TEXT);

-- Nothing else calls net.*. This also drops net._http_response.
DROP EXTENSION IF EXISTS pg_net;

-- pg_cron never prunes its own run history; ~1,100 rows a day accumulated
-- since March. Every run in it succeeded, so there is nothing to keep.
TRUNCATE cron.job_run_details;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'prune-cron-run-details';
SELECT cron.schedule(
  'prune-cron-run-details',
  '30 3 * * *',
  $job$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'$job$
);
