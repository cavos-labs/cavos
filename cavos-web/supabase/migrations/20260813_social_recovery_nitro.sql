-- Social recovery moves from Google Confidential Space to an AWS Nitro Enclave.
--
-- The old design booted one Confidential Space VM per session. Measured in
-- production, that cost 49–134 seconds of VM boot for ~2 seconds of work, and
-- ~9% of sessions failed outright because no zone had SEV capacity. The Nitro
-- enclave is long-lived, so a session is now two synchronous calls and there is
-- no VM lifecycle to track.
--
-- This migration removes the columns, indexes and functions that existed only
-- to orchestrate those VMs. It is not cosmetic: `bootstrap_token_hash` and
-- `vm_instance_name` are NOT NULL, and the new session route does not supply
-- them, so the application cannot insert a session until this runs.
--
-- Social recovery has no production users — 13 enrolments exist, all from
-- testing — so this is a clean break with no data to migrate.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Enrolments sealed by Google Cloud KMS cannot be opened by the enclave.
-- ---------------------------------------------------------------------------
-- Sealed records are ciphertext under a GCP KMS key. The Nitro enclave derives
-- its record keys from a root key held in AWS KMS and has no way to read them.
-- Leaving these rows would let a user reach `recover` and fail at the last
-- step, after signing in; deleting them means the wallet reports "not enrolled"
-- and re-enrols on next login, which is the honest state.
DELETE FROM public.social_recovery_enrollments;

-- Sessions referencing that world are equally meaningless.
DELETE FROM public.social_recovery_sessions;

-- ---------------------------------------------------------------------------
-- 2. Let a failed attempt be retried with the same credential.
-- ---------------------------------------------------------------------------
-- `auth_challenge_hash` was UNIQUE across every row, so a session that died —
-- a closed tab, an unavailable enclave, any transport error — permanently
-- burned that ID token. The browser's retry got `auth_credential_replayed` and
-- the user had to go back through the identity provider.
--
-- Single use is still enforced, but only against sessions that are live or
-- succeeded. A terminal failure releases the challenge, so the natural retry
-- works. This was a real defect in the old design, not something Nitro
-- introduced; it is fixed here because the same migration touches the table.
ALTER TABLE public.social_recovery_sessions
  DROP CONSTRAINT IF EXISTS social_recovery_sessions_auth_challenge_hash_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_recovery_challenge_single_use
  ON public.social_recovery_sessions(auth_challenge_hash)
  WHERE status IN ('ready', 'processing', 'completed');

-- ---------------------------------------------------------------------------
-- 3. Drop the warm-pool and prewarm machinery.
-- ---------------------------------------------------------------------------
-- A pool of pre-booted VMs only made sense because booting took a minute.
DROP FUNCTION IF EXISTS public.reserve_social_recovery_pool_slot(
  UUID, TEXT, TEXT, TIMESTAMPTZ, INTEGER
);
DROP FUNCTION IF EXISTS public.claim_social_recovery_pool_slot(
  UUID, UUID, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ
);

DROP INDEX IF EXISTS public.idx_social_recovery_warm_pool;
DROP INDEX IF EXISTS public.idx_social_recovery_unclaimed_prewarm;
DROP INDEX IF EXISTS public.idx_social_recovery_prewarm_request;

-- ---------------------------------------------------------------------------
-- 4. Collapse the row shape back to one case.
-- ---------------------------------------------------------------------------
-- `social_recovery_sessions_shape` existed to describe three kinds of row: an
-- empty pool slot, a reserved-but-unclaimed prewarm, and a real session. Seven
-- columns were made nullable to allow the first two. Neither exists any more,
-- so the constraint collapses into ordinary NOT NULL declarations — which is
-- integrity recovered, not just cleanup: a session with no wallet or no action
-- was never meaningful, it was only tolerated for the pool.
ALTER TABLE public.social_recovery_sessions
  DROP CONSTRAINT IF EXISTS social_recovery_sessions_shape;

-- ---------------------------------------------------------------------------
-- 5. Drop the VM lifecycle columns.
-- ---------------------------------------------------------------------------
-- `encrypted_job` and `ephemeral_public_key` went too: the job used to be
-- parked here for a booting VM to poll for, and the channel key relayed
-- alongside it. Both now live in a single request/response, and the browser
-- takes the channel key from inside the attestation document rather than from
-- a database column.
ALTER TABLE public.social_recovery_sessions
  DROP COLUMN IF EXISTS bootstrap_token_hash,
  DROP COLUMN IF EXISTS workload_token_hash,
  DROP COLUMN IF EXISTS vm_instance_name,
  DROP COLUMN IF EXISTS vm_instance_id,
  DROP COLUMN IF EXISTS vm_deleted_at,
  DROP COLUMN IF EXISTS pool_slot,
  DROP COLUMN IF EXISTS reserved_at,
  DROP COLUMN IF EXISTS claimed_at,
  DROP COLUMN IF EXISTS prewarm_token_hash,
  DROP COLUMN IF EXISTS prewarm_request_hash,
  DROP COLUMN IF EXISTS ready_at,
  DROP COLUMN IF EXISTS encrypted_job,
  DROP COLUMN IF EXISTS ephemeral_public_key,
  DROP COLUMN IF EXISTS attestation_nonce,
  DROP COLUMN IF EXISTS attestation_claims;

-- Every session now has all of these. Safe to enforce because the table was
-- emptied above.
ALTER TABLE public.social_recovery_sessions
  ALTER COLUMN wallet_id SET NOT NULL,
  ALTER COLUMN app_id SET NOT NULL,
  ALTER COLUMN environment_id SET NOT NULL,
  ALTER COLUMN action SET NOT NULL,
  ALTER COLUMN provider SET NOT NULL,
  ALTER COLUMN delay_seconds SET NOT NULL,
  ALTER COLUMN auth_challenge_hash SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 6. Retire the 'starting' status.
-- ---------------------------------------------------------------------------
-- It meant "a VM is booting". Sessions are now created ready, in one call.
ALTER TABLE public.social_recovery_sessions
  ALTER COLUMN status SET DEFAULT 'ready';

ALTER TABLE public.social_recovery_sessions
  DROP CONSTRAINT IF EXISTS social_recovery_sessions_status_check;

ALTER TABLE public.social_recovery_sessions
  ADD CONSTRAINT social_recovery_sessions_status_check
  CHECK (status IN ('ready', 'processing', 'completed', 'failed', 'expired'));

-- The one-live-session guard referenced 'starting'.
DROP INDEX IF EXISTS public.idx_social_recovery_one_live_session;
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_recovery_one_live_session
  ON public.social_recovery_sessions(wallet_id, action)
  WHERE status IN ('ready', 'processing');

-- Sessions are short-lived now that nothing has to boot first.
ALTER TABLE public.social_recovery_sessions
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '10 minutes');

-- ---------------------------------------------------------------------------
-- 7. The expiry job no longer knows about 'starting'.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_social_recovery_sessions()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.social_recovery_sessions
  SET status = 'expired', error_code = COALESCE(error_code, 'session_expired')
  WHERE expires_at <= NOW() AND status IN ('ready', 'processing');
  DELETE FROM public.social_recovery_sessions
  WHERE expires_at <= NOW() - INTERVAL '24 hours';
END;
$$;

COMMIT;
