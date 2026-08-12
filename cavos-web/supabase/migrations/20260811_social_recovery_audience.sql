-- Let an app use its own OAuth client for social recovery.
--
-- The enclave verifies an id_token against the policy it is handed, and seals
-- that policy into the recovery record — nothing in the enclave is tied to
-- Cavos's own OAuth client. Until now the control plane always built the policy
-- from the global GOOGLE_CLIENT_ID / APPLE_CLIENT_ID, so only tokens minted for
-- Cavos's client could ever verify. Apps that run their own authentication had
-- no way in: their tokens carry their own `aud`.
--
-- Storing the audience here, rather than accepting it per request, is the point:
-- it is registered by the app owner, and the control plane injects it at
-- enrolment. A compromised frontend cannot swap in an audience of its own.
--
-- NULL keeps the current behaviour (Cavos's client).

ALTER TABLE public.app_environments
  ADD COLUMN IF NOT EXISTS social_recovery_audience TEXT;

COMMENT ON COLUMN public.app_environments.social_recovery_audience IS
  'OAuth client ID (id_token `aud`) accepted for social recovery in this environment. '
  'Set when the app authenticates users with its own Google/Apple client. '
  'NULL uses the Cavos client. Changing it does not affect wallets already '
  'enrolled: the enclave enforces the policy sealed at enrolment.';
