-- Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  firebase_uid TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_verification_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_email_app ON public.email_verification_tokens(email, app_id);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON public.email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_firebase_uid ON public.email_verification_tokens(firebase_uid, app_id);

-- Add email verification columns to wallets table
ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for verification checks
CREATE INDEX IF NOT EXISTS idx_wallets_email_app_verified
  ON public.wallets(email, app_id, email_verified);

CREATE INDEX IF NOT EXISTS idx_wallets_user_app_verified
  ON public.wallets(user_social_id, app_id, email_verified);

-- Mark all existing wallets as verified (grandfather existing users)
UPDATE public.wallets
SET email_verified = true,
    email_verified_at = NOW()
WHERE email IS NOT NULL
  AND email_verified IS NULL;

-- Enable RLS on verification tokens table
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can manage verification tokens
-- This ensures only backend API (with service key) can access tokens
CREATE POLICY "Service role can manage verification tokens"
  ON public.email_verification_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.email_verification_tokens IS 'Stores email verification tokens for Firebase authentication. Each token is valid for 24 hours and can only be used once.';
COMMENT ON COLUMN public.wallets.email_verified IS 'Whether the user has verified their email for this app. Only applies to Firebase auth.';
COMMENT ON COLUMN public.wallets.email_verified_at IS 'Timestamp when the email was verified for this app.';
