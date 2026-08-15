-- Accept every identity provider, not one per environment.
--
-- The environment used to name a single provider, and the control plane built
-- the enclave policy from it regardless of how the user had actually signed in.
-- An app offering Google and Apple therefore gave recovery to whichever half
-- matched the setting, and handed the enclave a mismatched token for the other
-- half — which the enclave correctly refused, opaquely, as `request_failed`.
--
-- The provider is a property of the credential, not of the environment. It now
-- travels with the request, and the environment only decides *whose* tokens are
-- acceptable for each provider.
--
-- Nothing here reaches an enrolled wallet. The enclave seals the full policy at
-- enrolment and enforces the sealed copy on every later recovery, so a wallet
-- keeps the provider, issuer and audience it enrolled with no matter what this
-- table says afterwards.

-- One override per provider, because an app that runs its own authentication
-- has a different client for each: a Google client ID is not an Apple one. The
-- value is read per provider rather than blindly as an audience — for
-- google/apple it replaces the audience, and for email it is the Firebase
-- project id, which determines the issuer as well.
--
-- Empty object means "use Cavos's own clients for everything", which is what
-- every app that has not configured anything wants.
ALTER TABLE public.app_environments
  ADD COLUMN IF NOT EXISTS social_recovery_audiences JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Carry the single stored audience across, under the provider it was set for.
-- Skipping this would silently move those apps back onto Cavos's client, and
-- their users' tokens would stop verifying.
UPDATE public.app_environments
SET social_recovery_audiences =
  jsonb_build_object(social_recovery_provider, social_recovery_audience)
WHERE social_recovery_audience IS NOT NULL
  AND social_recovery_provider IS NOT NULL
  AND social_recovery_audiences = '{}'::jsonb;

-- Only the three providers the enclave knows how to verify, and only strings.
--
-- A CHECK cannot contain a subquery, so the two halves are expressed
-- differently. Removing the permitted keys and requiring nothing to remain is a
-- plain operator and says "no other keys" exactly. Checking that every value is
-- a string does need to walk the object, which is what the function is for —
-- CHECK accepts an immutable function where it will not accept a SELECT.
CREATE OR REPLACE FUNCTION public.jsonb_values_are_strings(value JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM jsonb_each(value) AS entry WHERE jsonb_typeof(entry.value) <> 'string'
  );
$$;

ALTER TABLE public.app_environments
  DROP CONSTRAINT IF EXISTS app_environments_social_recovery_audiences;
ALTER TABLE public.app_environments
  ADD CONSTRAINT app_environments_social_recovery_audiences CHECK (
    jsonb_typeof(social_recovery_audiences) = 'object'
    AND social_recovery_audiences - ARRAY['google', 'apple', 'email'] = '{}'::jsonb
    AND public.jsonb_values_are_strings(social_recovery_audiences)
  );

-- Enabling recovery no longer requires naming a provider: enabling it now means
-- all three are available.
ALTER TABLE public.app_environments
  DROP CONSTRAINT IF EXISTS app_environments_social_recovery_policy;

-- `social_recovery_provider` is deliberately left in place. It is no longer the
-- policy, but it is the fallback for SDK versions that predate this change and
-- do not send a provider with the session request — dropping it would break
-- every app that has not upgraded. It can go once those versions are out of
-- support, and not before.
COMMENT ON COLUMN public.app_environments.social_recovery_provider IS
  'Legacy: fallback provider for SDK versions that do not send one. Not the policy.';

COMMENT ON COLUMN public.app_environments.social_recovery_audiences IS
  'Per-provider client the enclave accepts tokens for. google/apple: OAuth client id (audience). email: Firebase project id (sets issuer and audience). Absent: Cavos''s own client.';
