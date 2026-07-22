CREATE OR REPLACE FUNCTION public.inspect_organization_invitation(p_token_hash TEXT)
RETURNS TABLE (
  email TEXT,
  role TEXT,
  organization_name TEXT,
  account_exists BOOLEAN,
  expires_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT
    invitation.email,
    invitation.role,
    organization.name,
    EXISTS (
      SELECT 1
      FROM auth.users AS existing_user
      WHERE lower(existing_user.email) = lower(invitation.email)
    ),
    invitation.expires_at
  FROM public.organization_invitations AS invitation
  JOIN public.organizations AS organization ON organization.id = invitation.organization_id
  WHERE invitation.token_hash = p_token_hash
    AND invitation.accepted_at IS NULL
    AND invitation.expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.inspect_organization_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inspect_organization_invitation(TEXT) TO service_role;

COMMENT ON FUNCTION public.inspect_organization_invitation(TEXT) IS
  'Resolves a valid invitation and determines whether its exact email already belongs to an auth user.';
