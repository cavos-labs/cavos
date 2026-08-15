-- Add rate limiting field to email_verification_tokens table
ALTER TABLE public.email_verification_tokens
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for rate limiting checks
CREATE INDEX IF NOT EXISTS idx_verification_email_app_last_sent
  ON public.email_verification_tokens(email, app_id, last_sent_at);

-- Add comment for documentation
COMMENT ON COLUMN public.email_verification_tokens.last_sent_at IS 'Timestamp of the last time a verification email was sent for this token. Used for rate limiting (1 minute cooldown).';
