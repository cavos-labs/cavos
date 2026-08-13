-- Device revocation: the escape hatch behind the "this wasn't me" link in the
-- "a new device was added" email. Mirrors `device_addition_requests` — this
-- table holds NO keys and grants NO authority. It only names which signer a
-- revocation page should offer to remove; the remove_signer itself is signed
-- on-chain by a device that is already authorized. Possession of the link is
-- therefore not enough to revoke anything.

CREATE TABLE IF NOT EXISTS public.device_removal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  environment_id UUID REFERENCES public.app_environments(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  target_pub_x TEXT NOT NULL,
  target_pub_y TEXT NOT NULL,
  device_label TEXT,
  status TEXT NOT NULL DEFAULT 'available',          -- available | revoked | expired
  -- Long-lived on purpose: the user may only notice the notification email days
  -- later, and a dead link at that moment is exactly when they need it most.
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_tx_hash TEXT,
  confirmed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_device_removal_requests_wallet ON public.device_removal_requests(wallet_id);
CREATE INDEX IF NOT EXISTS idx_device_removal_requests_status ON public.device_removal_requests(status);

-- App-level override for the "device added" notification email, same pattern as
-- `email_device_approval_template_html`.
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS email_device_added_template_html TEXT;
