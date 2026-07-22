-- Run HTTP-backed maintenance from Supabase instead of paid Vercel Cron.
-- Secrets are stored in Supabase Vault and resolved only when each job runs.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.configure_cavos_http_crons(
  p_app_url TEXT,
  p_cron_secret TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, cron, net
AS $$
DECLARE
  app_url_secret_id UUID;
  cron_secret_id UUID;
  normalized_url TEXT := rtrim(p_app_url, '/');
BEGIN
  IF normalized_url !~ '^https://[^/].*' THEN
    RAISE EXCEPTION 'p_app_url must be an HTTPS origin';
  END IF;
  IF length(p_cron_secret) < 24 THEN
    RAISE EXCEPTION 'p_cron_secret must contain at least 24 characters';
  END IF;

  SELECT id INTO app_url_secret_id FROM vault.secrets WHERE name = 'cavos_app_url';
  IF app_url_secret_id IS NULL THEN
    PERFORM vault.create_secret(normalized_url, 'cavos_app_url', 'Cavos dashboard origin used by pg_cron');
  ELSE
    PERFORM vault.update_secret(app_url_secret_id, normalized_url, 'cavos_app_url', 'Cavos dashboard origin used by pg_cron');
  END IF;

  SELECT id INTO cron_secret_id FROM vault.secrets WHERE name = 'cavos_cron_secret';
  IF cron_secret_id IS NULL THEN
    PERFORM vault.create_secret(p_cron_secret, 'cavos_cron_secret', 'Bearer secret for Cavos cron endpoints');
  ELSE
    PERFORM vault.update_secret(cron_secret_id, p_cron_secret, 'cavos_cron_secret', 'Bearer secret for Cavos cron endpoints');
  END IF;

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('cavos-webhook-retries', 'cavos-sync-jwks');

  PERFORM cron.schedule(
    'cavos-webhook-retries',
    '*/5 * * * *',
    $job$
      SELECT net.http_get(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cavos_app_url') || '/api/cron/webhook-retries',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cavos_cron_secret')
        ),
        timeout_milliseconds := 30000
      );
    $job$
  );

  PERFORM cron.schedule(
    'cavos-sync-jwks',
    '0 0 * * *',
    $job$
      SELECT net.http_get(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cavos_app_url') || '/api/cron/sync-jwks',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cavos_cron_secret')
        ),
        timeout_milliseconds := 60000
      );
    $job$
  );
END;
$$;

REVOKE ALL ON FUNCTION public.configure_cavos_http_crons(TEXT, TEXT) FROM PUBLIC;

COMMENT ON FUNCTION public.configure_cavos_http_crons(TEXT, TEXT) IS
  'One-time setup: SELECT public.configure_cavos_http_crons(''https://dashboard.example.com'', ''same value as CRON_SECRET'');';
