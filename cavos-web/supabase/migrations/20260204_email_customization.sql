-- Add email customization fields to apps table
ALTER TABLE public.apps
ADD COLUMN IF NOT EXISTS email_from_address TEXT,
ADD COLUMN IF NOT EXISTS email_from_name TEXT,
ADD COLUMN IF NOT EXISTS email_template_html TEXT,
ADD COLUMN IF NOT EXISTS email_verification_enabled BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.apps.email_from_address IS 'Custom sender email for verification emails (e.g., noreply@yourdomain.com). Falls back to Cavos default if not set.';
COMMENT ON COLUMN public.apps.email_from_name IS 'Custom sender name for verification emails (e.g., "Your App Name"). Falls back to app name if not set.';
COMMENT ON COLUMN public.apps.email_template_html IS 'Custom HTML template for verification emails. Use {{verification_url}}, {{app_name}}, {{user_email}} as placeholders.';
COMMENT ON COLUMN public.apps.email_verification_enabled IS 'Whether email verification is required for this app. Defaults to true.';
