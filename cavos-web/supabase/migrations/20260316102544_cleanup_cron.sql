-- Requires pg_cron extension (enabled on Supabase Pro+ from Database > Extensions)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Daily cleanup of expired email verification tokens at 02:00 UTC
SELECT cron.schedule(
  'cleanup-expired-verification-tokens',
  '0 2 * * *',
  $$DELETE FROM public.email_verification_tokens WHERE expires_at < NOW()$$
);
