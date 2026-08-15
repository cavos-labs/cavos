-- Optional: custom HTML template for app password reset emails (white-labeled).
ALTER TABLE public.apps
ADD COLUMN IF NOT EXISTS email_password_reset_template_html TEXT;

COMMENT ON COLUMN public.apps.email_password_reset_template_html IS 'Custom HTML for password reset emails. Placeholders: {{reset_link}}, {{app_name}}, {{app_logo}}, {{user_email}}.';
