-- Keep one empty, independently-attested Confidential Space workload ready.
-- A pool row contains no app, wallet, identity, provider credential, encrypted
-- job, or recovery secret. It is atomically reserved before OAuth and remains
-- a one-session/one-VM workload after reservation.

ALTER TABLE public.social_recovery_sessions
  ALTER COLUMN app_id DROP NOT NULL,
  ALTER COLUMN environment_id DROP NOT NULL,
  ALTER COLUMN provider DROP NOT NULL,
  ALTER COLUMN delay_seconds DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS pool_slot BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ;

ALTER TABLE public.social_recovery_sessions
  DROP CONSTRAINT IF EXISTS social_recovery_sessions_shape;
ALTER TABLE public.social_recovery_sessions
  ADD CONSTRAINT social_recovery_sessions_shape CHECK (
    (
      pool_slot AND
      wallet_id IS NULL AND
      app_id IS NULL AND
      environment_id IS NULL AND
      action IS NULL AND
      provider IS NULL AND
      delay_seconds IS NULL AND
      auth_challenge_hash IS NULL AND
      prewarm_token_hash IS NULL
    ) OR (
      NOT pool_slot AND
      app_id IS NOT NULL AND
      environment_id IS NOT NULL AND
      provider IS NOT NULL AND
      delay_seconds IS NOT NULL AND
      (
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
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_social_recovery_warm_pool
  ON public.social_recovery_sessions(status, expires_at)
  WHERE pool_slot AND wallet_id IS NULL;

-- Serialize pool maintenance so concurrent cron/request callbacks cannot create
-- more billable VMs than the configured target.
CREATE OR REPLACE FUNCTION public.reserve_social_recovery_pool_slot(
  p_id UUID,
  p_bootstrap_token_hash TEXT,
  p_vm_instance_name TEXT,
  p_expires_at TIMESTAMPTZ,
  p_target_size INTEGER DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  live_count INTEGER;
BEGIN
  IF p_target_size < 1 OR p_target_size > 4 THEN
    RAISE EXCEPTION 'invalid warm-pool target';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('cavos-social-recovery-warm-pool'));
  UPDATE public.social_recovery_sessions
  SET status = 'failed', error_code = 'pool_start_timeout'
  WHERE pool_slot
    AND wallet_id IS NULL
    AND status = 'starting'
    AND created_at < NOW() - INTERVAL '3 minutes';
  SELECT count(*) INTO live_count
  FROM public.social_recovery_sessions
  WHERE pool_slot
    AND wallet_id IS NULL
    AND status IN ('starting', 'ready')
    AND expires_at > NOW() + INTERVAL '10 minutes';
  IF live_count >= p_target_size THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.social_recovery_sessions (
    id,
    wallet_id,
    app_id,
    environment_id,
    action,
    provider,
    delay_seconds,
    auth_challenge_hash,
    bootstrap_token_hash,
    prewarm_token_hash,
    vm_instance_name,
    pool_slot,
    expires_at
  ) VALUES (
    p_id,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    p_bootstrap_token_hash,
    NULL,
    p_vm_instance_name,
    TRUE,
    p_expires_at
  );
  RETURN p_id;
END;
$$;

-- Reserve a fully booted worker for this browser before OAuth. SKIP LOCKED
-- makes simultaneous logins claim distinct workers without double assignment.
CREATE OR REPLACE FUNCTION public.claim_social_recovery_pool_slot(
  p_app_id UUID,
  p_environment_id UUID,
  p_provider TEXT,
  p_delay_seconds INTEGER,
  p_claim_token_hash TEXT,
  p_request_hash TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS TABLE(id UUID, status TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_id UUID;
BEGIN
  SELECT s.id INTO selected_id
  FROM public.social_recovery_sessions s
  WHERE s.pool_slot
    AND s.wallet_id IS NULL
    AND s.status = 'ready'
    AND s.expires_at > NOW() + INTERVAL '5 minutes'
  ORDER BY s.ready_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF selected_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.social_recovery_sessions s
  SET pool_slot = FALSE,
      app_id = p_app_id,
      environment_id = p_environment_id,
      provider = p_provider,
      delay_seconds = p_delay_seconds,
      prewarm_token_hash = p_claim_token_hash,
      prewarm_request_hash = p_request_hash,
      reserved_at = NOW(),
      expires_at = p_expires_at
  WHERE s.id = selected_id
  RETURNING s.id, s.status, s.expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_social_recovery_pool_slot(UUID, TEXT, TEXT, TIMESTAMPTZ, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_social_recovery_pool_slot(UUID, UUID, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_social_recovery_pool_slot(UUID, TEXT, TEXT, TIMESTAMPTZ, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_social_recovery_pool_slot(UUID, UUID, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ) TO service_role;

-- Supabase Cron calls this route every minute using the existing Vault values.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'cavos-social-recovery-warm-pool';

SELECT cron.schedule(
  'cavos-social-recovery-warm-pool',
  '* * * * *',
  $job$
    SELECT net.http_get(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cavos_app_url') || '/api/cron/social-recovery-pool',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cavos_cron_secret')
      ),
      timeout_milliseconds := 300000
    );
  $job$
);
