-- Device-signer model: per-device authorized signers + pending "add device" relay.
-- A device-signer wallet stores its authorized keys in `wallet_devices` (NOT in
-- wallets.encrypted_pk_blob, which is the legacy JWT/WebAuthn column and stays
-- untouched). The relay table holds NO keys — it only coordinates the approval
-- email; the actual add_signer is signed on-chain by an already-registered device.

-- Devices authorized on a wallet.
CREATE TABLE IF NOT EXISTS public.wallet_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  pub_x TEXT NOT NULL,
  pub_y TEXT NOT NULL,
  device_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (wallet_id, pub_x, pub_y)
);
CREATE INDEX IF NOT EXISTS idx_wallet_devices_wallet ON public.wallet_devices(wallet_id);

-- Pending requests to add a new device (recovery / multi-device relay).
CREATE TABLE IF NOT EXISTS public.device_addition_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  new_pub_x TEXT NOT NULL,
  new_pub_y TEXT NOT NULL,
  device_label TEXT,
  status TEXT NOT NULL DEFAULT 'pending',            -- pending | approved | expired
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_tx_hash TEXT,
  confirmed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_device_addition_requests_wallet ON public.device_addition_requests(wallet_id);
CREATE INDEX IF NOT EXISTS idx_device_addition_requests_status ON public.device_addition_requests(status);

-- App-level config for the device-approval flow: editable email template +
-- where to send the approving device (the integrating app's own URL).
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS email_device_approval_template_html TEXT,
  ADD COLUMN IF NOT EXISTS device_approval_url TEXT;
