-- Organization API Keys
-- Allows organizations to authenticate programmatically via API key
-- Keys are stored as SHA-256 hashes; plaintext is shown only once at creation

CREATE TABLE IF NOT EXISTS public.organization_api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  key_hash    TEXT NOT NULL UNIQUE,
  key_prefix  TEXT NOT NULL, -- first 12 chars of the key (e.g. "cav_Ab3xY9") for display
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org    ON public.organization_api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash   ON public.organization_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.organization_api_keys(is_active, key_hash);

ALTER TABLE public.organization_api_keys ENABLE ROW LEVEL SECURITY;

-- Org owners can view their own keys (never the hash)
CREATE POLICY "Org owners can view api keys"
  ON public.organization_api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = organization_api_keys.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

-- Org owners can create keys for their orgs
CREATE POLICY "Org owners can create api keys"
  ON public.organization_api_keys FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = organization_api_keys.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

-- Org owners can revoke (delete) their keys
CREATE POLICY "Org owners can delete api keys"
  ON public.organization_api_keys FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = organization_api_keys.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

-- Service role bypasses RLS (used for API key auth flow in /api/v1/*)
CREATE POLICY "Service role manages api keys"
  ON public.organization_api_keys FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);