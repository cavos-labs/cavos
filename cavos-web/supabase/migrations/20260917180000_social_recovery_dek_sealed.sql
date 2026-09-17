-- Native Ed25519 enroll seals a MasterDEK in the existing Nitro record.
-- That wrap is complete without an on-chain confirm, so persist marks those
-- rows dek_sealed. Lookup of a second chain or a new device uses this flag
-- plus identity_commitment rather than inventing a second DEK.

ALTER TABLE public.social_recovery_enrollments
  ADD COLUMN IF NOT EXISTS dek_sealed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.social_recovery_sessions
  ADD COLUMN IF NOT EXISTS dek_enroll BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_social_recovery_dek_identity
  ON public.social_recovery_enrollments (environment_id, identity_commitment)
  WHERE dek_sealed;

UPDATE public.social_recovery_enrollments AS enrollment
SET dek_sealed = TRUE
FROM public.wallets AS wallet
WHERE enrollment.wallet_id = wallet.id
  AND enrollment.onchain_status = 'active'
  AND wallet.network LIKE 'stellar-%';
