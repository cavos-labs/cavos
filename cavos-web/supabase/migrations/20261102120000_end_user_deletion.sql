-- End-user recovery opt-out and account deletion, scoped to (app, environment, user).

CREATE TABLE IF NOT EXISTS public.recovery_opt_outs (
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  environment_id UUID NOT NULL REFERENCES public.app_environments(id) ON DELETE CASCADE,
  user_social_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (app_id, environment_id, user_social_id)
);

ALTER TABLE public.recovery_opt_outs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_enclave_recovery(
  p_app UUID,
  p_env UUID,
  p_sub TEXT,
  p_enabled BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM 1 FROM public.wallets
    WHERE app_id = p_app AND environment_id = p_env AND user_social_id = p_sub
    FOR UPDATE;

  IF p_enabled THEN
    DELETE FROM public.recovery_opt_outs
      WHERE app_id = p_app AND environment_id = p_env AND user_social_id = p_sub;
  ELSE
    INSERT INTO public.recovery_opt_outs (app_id, environment_id, user_social_id)
      VALUES (p_app, p_env, p_sub)
      ON CONFLICT DO NOTHING;
    DELETE FROM public.social_recovery_sessions
      WHERE wallet_id IN (
        SELECT id FROM public.wallets
        WHERE app_id = p_app AND environment_id = p_env AND user_social_id = p_sub
      );
    DELETE FROM public.social_recovery_enrollments
      WHERE wallet_id IN (
        SELECT id FROM public.wallets
        WHERE app_id = p_app AND environment_id = p_env AND user_social_id = p_sub
      );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_end_user(
  p_app UUID,
  p_env UUID,
  p_sub TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_ids UUID[];
  v_deleted INTEGER;
BEGIN
  SELECT COALESCE(array_agg(id), ARRAY[]::UUID[]) INTO v_wallet_ids FROM (
    SELECT id FROM public.wallets
    WHERE app_id = p_app AND environment_id = p_env AND user_social_id = p_sub
    FOR UPDATE
  ) locked;

  DELETE FROM public.social_recovery_sessions WHERE wallet_id = ANY(v_wallet_ids);
  DELETE FROM public.social_recovery_enrollments WHERE wallet_id = ANY(v_wallet_ids);
  DELETE FROM public.cavos_events WHERE wallet_id = ANY(v_wallet_ids);
  DELETE FROM public.passkey_dek_wraps
    WHERE app_id = p_app AND environment_id = p_env AND user_social_id = p_sub;
  DELETE FROM public.recovery_opt_outs
    WHERE app_id = p_app AND environment_id = p_env AND user_social_id = p_sub;
  DELETE FROM public.wallets
    WHERE app_id = p_app AND environment_id = p_env AND user_social_id = p_sub;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_recovery_opt_out()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_app UUID;
  v_env UUID;
  v_sub TEXT;
BEGIN
  SELECT app_id, environment_id, user_social_id INTO v_app, v_env, v_sub
    FROM public.wallets WHERE id = NEW.wallet_id FOR SHARE;
  IF EXISTS (
    SELECT 1 FROM public.recovery_opt_outs
    WHERE app_id = v_app AND environment_id = v_env AND user_social_id = v_sub
  ) THEN
    RAISE EXCEPTION 'recovery_revoked';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_recovery_opt_out ON public.social_recovery_enrollments;
CREATE TRIGGER trg_enforce_recovery_opt_out
  BEFORE INSERT OR UPDATE ON public.social_recovery_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_recovery_opt_out();

REVOKE ALL ON FUNCTION public.set_enclave_recovery(UUID, UUID, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_enclave_recovery(UUID, UUID, TEXT, BOOLEAN) TO service_role;
REVOKE ALL ON FUNCTION public.delete_end_user(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_end_user(UUID, UUID, TEXT) TO service_role;
