-- An app that signs its users in itself registers its identity provider here.
-- The vault and the wallet registry accept that provider's tokens for the
-- environment, verified against the keys at identity_jwks_url.
ALTER TABLE public.app_environments
  ADD COLUMN IF NOT EXISTS identity_issuer TEXT,
  ADD COLUMN IF NOT EXISTS identity_jwks_url TEXT,
  ADD COLUMN IF NOT EXISTS identity_audience TEXT;

ALTER TABLE public.app_environments
  DROP CONSTRAINT IF EXISTS app_environments_identity_provider;
ALTER TABLE public.app_environments
  ADD CONSTRAINT app_environments_identity_provider CHECK (
    (identity_issuer IS NULL) = (identity_jwks_url IS NULL)
    AND (identity_audience IS NULL OR identity_issuer IS NOT NULL)
    AND (identity_jwks_url IS NULL OR identity_jwks_url ~ '^https://')
  );

COMMENT ON COLUMN public.app_environments.identity_issuer IS
  'The iss of the tokens the app''s own identity provider signs. NULL when Cavos signs the users in.';
COMMENT ON COLUMN public.app_environments.identity_jwks_url IS
  'Where that provider publishes its signing keys (JWKS).';
COMMENT ON COLUMN public.app_environments.identity_audience IS
  'The aud those tokens must carry. NULL accepts any audience from the issuer.';
