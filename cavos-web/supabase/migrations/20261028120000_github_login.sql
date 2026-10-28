ALTER TABLE public.app_environments
  ADD COLUMN IF NOT EXISTS github_client_id TEXT,
  ADD COLUMN IF NOT EXISTS github_client_secret_ciphertext TEXT;

ALTER TABLE public.app_environments
  DROP CONSTRAINT IF EXISTS app_environments_github_oauth_app;
ALTER TABLE public.app_environments
  ADD CONSTRAINT app_environments_github_oauth_app CHECK (
    (github_client_id IS NULL) = (github_client_secret_ciphertext IS NULL)
  );

ALTER TABLE public.app_environments
  DROP CONSTRAINT IF EXISTS app_environments_social_recovery_provider_check;
ALTER TABLE public.app_environments
  ADD CONSTRAINT app_environments_social_recovery_provider_check
  CHECK (social_recovery_provider IN ('google', 'apple', 'email', 'github'));

ALTER TABLE public.social_recovery_enrollments
  DROP CONSTRAINT IF EXISTS social_recovery_enrollments_provider_check;
ALTER TABLE public.social_recovery_enrollments
  ADD CONSTRAINT social_recovery_enrollments_provider_check
  CHECK (provider IN ('google', 'apple', 'email', 'github'));

ALTER TABLE public.social_recovery_sessions
  DROP CONSTRAINT IF EXISTS social_recovery_sessions_provider_check;
ALTER TABLE public.social_recovery_sessions
  ADD CONSTRAINT social_recovery_sessions_provider_check
  CHECK (provider IN ('google', 'apple', 'email', 'github'));
