-- Passkey restore for native Ed25519 wallets (Solana, Stellar). Each passkey a
-- user adds stores a copy of the wallet's DEK encrypted under a key derived from
-- the passkey's WebAuthn PRF output. The PRF never leaves the user's device, so
-- this table holds ciphertext Cavos cannot open. A new device downloads the
-- copy, asks the passkey for its PRF and decrypts it locally.

CREATE TABLE IF NOT EXISTS public.passkey_dek_wraps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  environment_id UUID NOT NULL REFERENCES public.app_environments(id) ON DELETE CASCADE,
  user_social_id TEXT NOT NULL,
  -- base64url WebAuthn credential id: which passkey this copy opens with.
  credential_id TEXT NOT NULL,
  -- base64url version(1) || nonce(12) || AES-256-GCM(DEK)(48).
  wrapped_dek TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (app_id, environment_id, user_social_id, credential_id)
);

-- RLS on, with NO policies: only the service-role API route reads or writes it.
ALTER TABLE public.passkey_dek_wraps ENABLE ROW LEVEL SECURITY;
