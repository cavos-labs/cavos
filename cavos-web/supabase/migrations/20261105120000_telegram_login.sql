ALTER TABLE public.app_environments
  ADD COLUMN IF NOT EXISTS telegram_bot_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_client_secret_ciphertext TEXT;

ALTER TABLE public.app_environments
  DROP CONSTRAINT IF EXISTS app_environments_telegram_bot;
ALTER TABLE public.app_environments
  ADD CONSTRAINT app_environments_telegram_bot CHECK (
    (telegram_bot_id IS NULL) = (telegram_client_secret_ciphertext IS NULL)
  );

ALTER TABLE public.app_environments
  DROP CONSTRAINT IF EXISTS app_environments_telegram_bot_id_format;
ALTER TABLE public.app_environments
  ADD CONSTRAINT app_environments_telegram_bot_id_format CHECK (
    telegram_bot_id IS NULL OR telegram_bot_id ~ '^[1-9][0-9]{0,19}$'
  );

ALTER TABLE public.app_environments
  DROP CONSTRAINT IF EXISTS app_environments_social_recovery_provider_check;
ALTER TABLE public.app_environments
  ADD CONSTRAINT app_environments_social_recovery_provider_check
  CHECK (social_recovery_provider IN ('google', 'apple', 'email', 'github', 'telegram'));

ALTER TABLE public.social_recovery_enrollments
  DROP CONSTRAINT IF EXISTS social_recovery_enrollments_provider_check;
ALTER TABLE public.social_recovery_enrollments
  ADD CONSTRAINT social_recovery_enrollments_provider_check
  CHECK (provider IN ('google', 'apple', 'email', 'github', 'telegram'));

ALTER TABLE public.social_recovery_sessions
  DROP CONSTRAINT IF EXISTS social_recovery_sessions_provider_check;
ALTER TABLE public.social_recovery_sessions
  ADD CONSTRAINT social_recovery_sessions_provider_check
  CHECK (provider IN ('google', 'apple', 'email', 'github', 'telegram'));
