-- Hardware-isolated social recovery. Provider selection is environment-scoped:
-- each environment exposes exactly one of google/apple/email or no social
-- recovery at all. Raw OIDC tokens and recovery keys are never stored here.

ALTER TABLE public.app_environments
  ADD COLUMN IF NOT EXISTS social_recovery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS social_recovery_provider TEXT
    CHECK (social_recovery_provider IN ('google', 'apple', 'email')),
  ADD COLUMN IF NOT EXISTS social_recovery_delay_seconds INTEGER NOT NULL DEFAULT 0
    CHECK (social_recovery_delay_seconds >= 0 AND social_recovery_delay_seconds <= 2592000);

ALTER TABLE public.app_environments DROP CONSTRAINT IF EXISTS app_environments_social_recovery_policy;
ALTER TABLE public.app_environments ADD CONSTRAINT app_environments_social_recovery_policy CHECK (
  (NOT social_recovery_enabled) OR social_recovery_provider IS NOT NULL
);

CREATE TABLE IF NOT EXISTS public.social_recovery_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  environment_id UUID NOT NULL REFERENCES public.app_environments(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'email')),
  delay_seconds INTEGER NOT NULL
    CHECK (delay_seconds >= 0 AND delay_seconds <= 2592000),
  identity_commitment TEXT NOT NULL CHECK (identity_commitment ~ '^0x[0-9a-f]{64}$'),
  policy_hash TEXT NOT NULL CHECK (policy_hash ~ '^0x[0-9a-f]{64}$'),
  recovery_pubkey_compressed TEXT NOT NULL,
  recovery_pub_x TEXT NOT NULL,
  recovery_pub_y TEXT NOT NULL,
  sealed_record TEXT NOT NULL,
  onchain_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (onchain_status IN ('pending', 'active', 'disabled')),
  enrollment_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wallet_id)
);
CREATE INDEX IF NOT EXISTS idx_social_recovery_enrollment_environment
  ON public.social_recovery_enrollments(environment_id);

CREATE TABLE IF NOT EXISTS public.social_recovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  environment_id UUID NOT NULL REFERENCES public.app_environments(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('enroll', 'recover')),
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'email')),
  delay_seconds INTEGER NOT NULL
    CHECK (delay_seconds >= 0 AND delay_seconds <= 2592000),
  -- SHA-256 of the token fingerprint supplied by the browser. The raw token
  -- remains inside the browser-to-enclave encrypted channel.
  auth_challenge_hash TEXT NOT NULL UNIQUE
    CHECK (auth_challenge_hash ~ '^[0-9a-f]{64}$'),
  status TEXT NOT NULL DEFAULT 'starting'
    CHECK (status IN ('starting', 'ready', 'processing', 'completed', 'failed', 'expired')),
  bootstrap_token_hash TEXT NOT NULL,
  workload_token_hash TEXT,
  vm_instance_name TEXT NOT NULL,
  vm_instance_id TEXT,
  vm_deleted_at TIMESTAMPTZ,
  ephemeral_public_key TEXT,
  attestation_nonce TEXT,
  attestation_claims JSONB,
  encrypted_job JSONB,
  result JSONB,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);
CREATE INDEX IF NOT EXISTS idx_social_recovery_sessions_wallet_created
  ON public.social_recovery_sessions(wallet_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_recovery_one_live_session
  ON public.social_recovery_sessions(wallet_id, action)
  WHERE status IN ('starting', 'ready', 'processing');

ALTER TABLE public.social_recovery_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_recovery_sessions ENABLE ROW LEVEL SECURITY;

-- Intentionally no browser-facing RLS policies. Routes use the service role and
-- return only the fields required by the SDK; sealed records are KMS ciphertext.

CREATE OR REPLACE FUNCTION public.expire_social_recovery_sessions()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.social_recovery_sessions
  SET status = 'expired', error_code = COALESCE(error_code, 'session_expired')
  WHERE expires_at <= NOW() AND status IN ('starting', 'ready', 'processing');
  DELETE FROM public.social_recovery_sessions
  WHERE expires_at <= NOW() - INTERVAL '24 hours';
END;
$$;

SELECT cron.schedule(
  'expire-social-recovery-sessions',
  '*/5 * * * *',
  $$SELECT public.expire_social_recovery_sessions()$$
)
WHERE NOT EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'expire-social-recovery-sessions'
);
