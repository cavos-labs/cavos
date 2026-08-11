-- Start Confidential Space while the user is completing OAuth, then atomically
-- bind the already-attested worker to the resulting wallet recovery session.
-- Unclaimed rows have no wallet, provider credential, encrypted job, or secret.

ALTER TABLE public.social_recovery_sessions
  ALTER COLUMN wallet_id DROP NOT NULL,
  ALTER COLUMN action DROP NOT NULL,
  ALTER COLUMN auth_challenge_hash DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS prewarm_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS prewarm_request_hash TEXT,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

ALTER TABLE public.social_recovery_sessions
  DROP CONSTRAINT IF EXISTS social_recovery_sessions_shape;
ALTER TABLE public.social_recovery_sessions
  ADD CONSTRAINT social_recovery_sessions_shape CHECK (
    (
      wallet_id IS NULL AND
      action IS NULL AND
      auth_challenge_hash IS NULL AND
      prewarm_token_hash IS NOT NULL
    ) OR (
      wallet_id IS NOT NULL AND
      action IS NOT NULL AND
      auth_challenge_hash IS NOT NULL AND
      prewarm_token_hash IS NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_social_recovery_unclaimed_prewarm
  ON public.social_recovery_sessions(environment_id, created_at DESC)
  WHERE wallet_id IS NULL AND status IN ('starting', 'ready');

CREATE INDEX IF NOT EXISTS idx_social_recovery_prewarm_request
  ON public.social_recovery_sessions(prewarm_request_hash, created_at DESC)
  WHERE wallet_id IS NULL;
