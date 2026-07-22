-- Cavos operational console: environments, events, webhooks, memberships,
-- auditability, and environment-scoped API credentials.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.app_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('development', 'production')),
  public_id TEXT NOT NULL UNIQUE DEFAULT ('cav_' || encode(gen_random_bytes(18), 'hex')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  allowed_origins TEXT[] NOT NULL DEFAULT '{}',
  low_balance_threshold_usd NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (app_id, kind)
);

INSERT INTO public.app_environments (app_id, kind)
SELECT id, kind
FROM public.apps CROSS JOIN (VALUES ('production'), ('development')) AS environments(kind)
ON CONFLICT (app_id, kind) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_default_app_environments()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.app_environments (app_id, kind) VALUES (NEW.id, 'production'), (NEW.id, 'development')
  ON CONFLICT (app_id, kind) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_app_created_environments ON public.apps;
CREATE TRIGGER on_app_created_environments AFTER INSERT ON public.apps
FOR EACH ROW EXECUTE FUNCTION public.create_default_app_environments();

ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES public.app_environments(id);
UPDATE public.wallets w SET environment_id = e.id
FROM public.app_environments e
WHERE w.environment_id IS NULL AND e.app_id = w.app_id AND e.kind = 'production';
ALTER TABLE public.wallets ALTER COLUMN environment_id SET NOT NULL;
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_app_id_user_social_id_network_key;
ALTER TABLE public.wallets
  ADD CONSTRAINT wallets_app_environment_user_network_key
  UNIQUE (app_id, environment_id, user_social_id, network);
CREATE INDEX IF NOT EXISTS idx_wallets_environment ON public.wallets(environment_id);

ALTER TABLE public.device_addition_requests ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES public.app_environments(id);
UPDATE public.device_addition_requests r SET environment_id = e.id
FROM public.app_environments e
WHERE r.environment_id IS NULL AND e.app_id = r.app_id AND e.kind = 'production';

CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','developer','support','billing','viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT id, owner_id, 'owner' FROM public.organizations
ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner';

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','developer','support','billing','viewer')),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cavos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  environment_id UUID REFERENCES public.app_environments(id) ON DELETE SET NULL,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','success','failed')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  network TEXT,
  request_id TEXT,
  tx_reference TEXT,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  error_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);
CREATE INDEX IF NOT EXISTS idx_cavos_events_org_created ON public.cavos_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cavos_events_app_created ON public.cavos_events(app_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cavos_events_wallet_created ON public.cavos_events(wallet_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cavos_events_request_type ON public.cavos_events(request_id, event_type) WHERE request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.daily_operational_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day DATE NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
  environment_id UUID REFERENCES public.app_environments(id) ON DELETE CASCADE,
  network TEXT,
  event_type TEXT NOT NULL,
  successes BIGINT NOT NULL DEFAULT 0,
  failures BIGINT NOT NULL DEFAULT 0,
  duration_sum_ms BIGINT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_metrics_dimensions ON public.daily_operational_metrics
  (day, organization_id, COALESCE(app_id, '00000000-0000-0000-0000-000000000000'::uuid),
   COALESCE(environment_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(network, ''), event_type);

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  environment_id UUID NOT NULL REFERENCES public.app_environments(id) ON DELETE CASCADE,
  url TEXT NOT NULL CHECK (url LIKE 'https://%'),
  event_types TEXT[] NOT NULL,
  secret_hash TEXT NOT NULL,
  secret_encrypted TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.cavos_events(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','delivered','failed')),
  attempt INTEGER NOT NULL DEFAULT 1,
  response_status INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  next_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  result TEXT NOT NULL CHECK (result IN ('success','failed')),
  ip_hash TEXT,
  changes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON public.audit_events(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
  environment_id UUID REFERENCES public.app_environments(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('gas_balance_low','failure_rate','wallet_creation_failed','webhook_degraded','recovery_expired','wallet_limit','credential_changed')),
  channel TEXT NOT NULL CHECK (channel IN ('email','webhook')),
  destination TEXT NOT NULL,
  threshold NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_feature_flags (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, feature)
);

ALTER TABLE public.organization_api_keys
  ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES public.app_environments(id),
  ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT ARRAY['read','write'],
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS request_count BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_count BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.app_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cavos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_operational_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_org_member(org UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations o WHERE o.id = org AND o.owner_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.organization_members m WHERE m.organization_id = org AND m.user_id = auth.uid()
  );
$$;

CREATE POLICY "Members read app environments" ON public.app_environments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.apps a WHERE a.id = app_environments.app_id AND public.is_org_member(a.organization_id))
);
CREATE POLICY "Members read memberships" ON public.organization_members FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members read invitations" ON public.organization_invitations FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members read events" ON public.cavos_events FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members read metrics" ON public.daily_operational_metrics FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members read webhooks" ON public.webhook_endpoints FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members read deliveries" ON public.webhook_deliveries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.webhook_endpoints w WHERE w.id = webhook_deliveries.webhook_id AND public.is_org_member(w.organization_id))
);
CREATE POLICY "Members read audit" ON public.audit_events FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members read alerts" ON public.alert_rules FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members read feature flags" ON public.organization_feature_flags FOR SELECT USING (public.is_org_member(organization_id));

-- Extend legacy owner-only read policies without weakening their existing write rules.
CREATE POLICY "Members read organizations" ON public.organizations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY "Members read apps" ON public.apps FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Members read wallets" ON public.wallets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.apps a WHERE a.id = wallets.app_id AND public.is_org_member(a.organization_id))
);
CREATE POLICY "Members read transactions" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.apps a WHERE a.id = transactions.app_id AND public.is_org_member(a.organization_id))
);
CREATE POLICY "Members read API keys" ON public.organization_api_keys FOR SELECT USING (public.is_org_member(org_id));

-- Aggregate expiring events before removing their detailed records.
CREATE OR REPLACE FUNCTION public.rollup_and_prune_operational_events()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.daily_operational_metrics
    (day, organization_id, app_id, environment_id, network, event_type, successes, failures, duration_sum_ms)
  SELECT created_at::date, organization_id, app_id, environment_id, network, event_type,
    COUNT(*) FILTER (WHERE status = 'success'), COUNT(*) FILTER (WHERE status = 'failed'), COALESCE(SUM(duration_ms), 0)
  FROM public.cavos_events WHERE expires_at <= NOW()
  GROUP BY created_at::date, organization_id, app_id, environment_id, network, event_type
  ON CONFLICT DO NOTHING;
  DELETE FROM public.webhook_deliveries WHERE expires_at <= NOW();
  DELETE FROM public.cavos_events WHERE expires_at <= NOW();
END;
$$;

SELECT cron.schedule('rollup-prune-operational-events', '20 2 * * *', $$SELECT public.rollup_and_prune_operational_events()$$)
WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rollup-prune-operational-events');
