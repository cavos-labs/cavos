-- Recovery support: mark which device signer is a self-custodial backup signer.
--
-- When a user runs setupRecovery(), the kit derives a deterministic secp256r1
-- key from their recovery code and registers it on-chain via add_signer. This
-- migration lets the backend mirror that fact so the UI can tell whether an
-- account already has a backup configured (the recovery CODE itself is never
-- stored — only a boolean that a backup signer exists for this wallet).
--
-- The column is advisory: the on-chain signer set is always authoritative. It
-- exists purely so the host page can show "Set up recovery" only when needed
-- and "Recovery enabled" otherwise, without an extra chain read.

ALTER TABLE public.wallet_devices
  ADD COLUMN IF NOT EXISTS is_backup BOOLEAN NOT NULL DEFAULT FALSE;

-- One backup signer per wallet at most — there's no value in several derived
-- from the same code, and it keeps the "has backup?" read unambiguous.
CREATE UNIQUE INDEX IF NOT EXISTS wallet_devices_one_backup_per_wallet
  ON public.wallet_devices (wallet_id)
  WHERE is_backup = TRUE;
