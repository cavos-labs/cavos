-- OAuth/OIDC credentials must never travel in callback URLs. Store an encrypted
-- payload briefly and redirect with a random, hashed-at-rest, one-time code.
CREATE TABLE IF NOT EXISTS public.oauth_callback_codes (
  code_hash TEXT PRIMARY KEY CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  payload_ciphertext TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_callback_codes_expires_at
  ON public.oauth_callback_codes(expires_at);

ALTER TABLE public.oauth_callback_codes ENABLE ROW LEVEL SECURITY;
-- Intentionally no client policy. Only the service-role backend may access it.

COMMENT ON TABLE public.oauth_callback_codes IS
  'Encrypted OAuth callback payloads, exchanged atomically using two-minute one-time codes.';

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-oauth-callback-codes');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
SELECT cron.schedule(
  'cleanup-oauth-callback-codes',
  '*/5 * * * *',
  $$DELETE FROM public.oauth_callback_codes WHERE expires_at <= NOW();$$
);
