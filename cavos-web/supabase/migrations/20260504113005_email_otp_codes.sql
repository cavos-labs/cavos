-- Email OTP codes for passwordless Firebase/Cavos login.
CREATE TABLE IF NOT EXISTS public.email_otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  firebase_uid TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  nonce TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  used_at TIMESTAMP WITH TIME ZONE,
  last_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otp_lookup
  ON public.email_otp_codes(email, app_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_otp_expires
  ON public.email_otp_codes(expires_at);

CREATE INDEX IF NOT EXISTS idx_email_otp_firebase_uid
  ON public.email_otp_codes(firebase_uid, app_id);

ALTER TABLE public.email_otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage email otp codes"
  ON public.email_otp_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.apps
ADD COLUMN IF NOT EXISTS email_otp_template_html TEXT;

COMMENT ON TABLE public.email_otp_codes IS 'Stores hashed email OTP codes for Firebase/Cavos passwordless sign-in. Codes are short-lived and one-time use.';
COMMENT ON COLUMN public.email_otp_codes.code_hash IS 'SHA-256 hash of the OTP plus server-side pepper and request context.';
COMMENT ON COLUMN public.apps.email_otp_template_html IS 'Custom HTML for OTP sign-in emails. Placeholders: {{otp_code}}, {{app_name}}, {{app_logo}}, {{user_email}}, {{expires_minutes}}.';
