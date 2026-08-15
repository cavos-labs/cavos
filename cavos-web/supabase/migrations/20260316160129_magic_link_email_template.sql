-- Custom HTML template for magic link emails (passwordless sign-in).
ALTER TABLE public.apps
ADD COLUMN IF NOT EXISTS email_magic_link_template_html TEXT;

COMMENT ON COLUMN public.apps.email_magic_link_template_html IS 'Custom HTML for magic link sign-in emails. Placeholders: {{magic_link}}, {{app_name}}, {{app_logo}}, {{user_email}}.';
