-- Every enclave release seals under a root key only its own image can unwrap,
-- and nothing is migrated between releases. A sealed record can therefore be
-- opened only by the release that sealed it, so each record says which one
-- that was, and each session says which release's enclave it was opened on.

ALTER TABLE public.social_recovery_enrollments
  ADD COLUMN IF NOT EXISTS enclave_release INTEGER CHECK (enclave_release > 0);

ALTER TABLE public.social_recovery_sessions
  ADD COLUMN IF NOT EXISTS enclave_release INTEGER CHECK (enclave_release > 0);

-- Every record so far was sealed under the one KMS key that predates
-- per-release keys, and that key is sealed to the image of release 4.
UPDATE public.social_recovery_enrollments
SET enclave_release = 4
WHERE enclave_release IS NULL;

-- A record sealed again by a newer release replaces the one before it. The old
-- one is kept, because the release that sealed it can still open it and
-- nothing else proves the wallet recoverable until the new record is used.
CREATE TABLE IF NOT EXISTS public.social_recovery_superseded_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL
    REFERENCES public.social_recovery_enrollments(id) ON DELETE CASCADE,
  sealed_record TEXT NOT NULL,
  enclave_release INTEGER,
  superseded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_recovery_superseded_enrollment
  ON public.social_recovery_superseded_records(enrollment_id);

-- No policies, as on the enrolments themselves: only the service role reads it.
ALTER TABLE public.social_recovery_superseded_records ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.keep_superseded_recovery_record()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.social_recovery_superseded_records
    (enrollment_id, sealed_record, enclave_release)
  VALUES (OLD.id, OLD.sealed_record, OLD.enclave_release);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_keep_superseded_recovery_record ON public.social_recovery_enrollments;
CREATE TRIGGER trg_keep_superseded_recovery_record
  BEFORE UPDATE OF sealed_record ON public.social_recovery_enrollments
  FOR EACH ROW
  WHEN (OLD.sealed_record IS DISTINCT FROM NEW.sealed_record)
  EXECUTE FUNCTION public.keep_superseded_recovery_record();
