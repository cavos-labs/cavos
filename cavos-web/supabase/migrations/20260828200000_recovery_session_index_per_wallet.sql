-- One recovery session per credential PER WALLET, in the index too.
--
-- #170 scoped the replay check to the wallet in the route, but left this index
-- keyed on the challenge alone. So the check passed and the INSERT did not: a
-- login enrolled whichever chain raced there first, and the others came back
-- 23505, which the route reports as `auth_credential_replayed` — the same
-- message as the deliberate refusal above it, for the opposite reason.
--
-- A session holds a wallet on every configured chain and each needs its own
-- enrolment from the one login the user performed. Under the enclave's
-- five-minute freshness rule there is no second credential to give the rest.
--
-- Single use still holds where it matters: a credential cannot open a second
-- live or successful session for a wallet it already opened one for, and every
-- wallet it can reach belongs to its own subject.
DROP INDEX IF EXISTS idx_social_recovery_challenge_single_use;

CREATE UNIQUE INDEX idx_social_recovery_challenge_single_use
  ON public.social_recovery_sessions(auth_challenge_hash, wallet_id)
  WHERE status IN ('ready', 'processing', 'completed');
