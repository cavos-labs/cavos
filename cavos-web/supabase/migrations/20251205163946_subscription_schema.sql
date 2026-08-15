-- Cavos Subscription System - Simplified Schema (Phase 1)
-- Implements tables based on Stripe best practices
-- Includes Row Level Security (RLS) Policies

-- =====================================================
-- 1. USER SUBSCRIPTIONS TABLE (Minimal Sync)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Stripe IDs (for API calls)
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  
  -- Cached for quick access
  plan_tier TEXT CHECK (plan_tier IN ('developer', 'growth', 'scale')) DEFAULT 'developer',
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')) DEFAULT 'active',
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subs_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subs_stripe_cust ON user_subscriptions(stripe_customer_id);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for user_subscriptions
CREATE POLICY "Users can view own subscription" 
  ON user_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Only service role can insert/update/delete (via webhooks/triggers)
CREATE POLICY "Service role can manage subscriptions" 
  ON user_subscriptions FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- =====================================================
-- 2. USAGE METRICS TABLE (MAU Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_mau INTEGER DEFAULT 0,
  apps_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_period ON usage_metrics(user_id, period_start);

-- Enable RLS
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for usage_metrics
CREATE POLICY "Users can view own usage metrics" 
  ON usage_metrics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage metrics" 
  ON usage_metrics FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- =====================================================
-- 3. APP USAGE TABLE (Per-app breakdown)
-- =====================================================
CREATE TABLE IF NOT EXISTS app_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  mau_count INTEGER DEFAULT 0,
  unique_wallets_created INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(app_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_app_usage_period ON app_usage_metrics(app_id, period_start);

-- Enable RLS
ALTER TABLE app_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for app_usage_metrics
-- Users can view usage for apps they own (via organizations table)
CREATE POLICY "Users can view own app usage metrics" 
  ON app_usage_metrics FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM apps 
      JOIN organizations ON apps.organization_id = organizations.id
      WHERE apps.id = app_usage_metrics.app_id 
      AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage app usage metrics" 
  ON app_usage_metrics FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- =====================================================
-- 4. AUTO-ASSIGN DEVELOPER PLAN
-- =====================================================
CREATE OR REPLACE FUNCTION assign_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan_tier, status)
  VALUES (NEW.id, 'developer', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to ensure idempotency
DROP TRIGGER IF EXISTS on_user_signup ON auth.users;
CREATE TRIGGER on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_subscription();

-- =====================================================
-- 5. MAU TRACKING FUNCTION
-- =====================================================
-- Tracks unique wallets per period
CREATE OR REPLACE FUNCTION increment_mau(
  p_user_id UUID,
  p_app_id UUID,
  p_period_start DATE
)
RETURNS void AS $$
BEGIN
  -- Insert or update app-level usage
  INSERT INTO app_usage_metrics (app_id, period_start, period_end, mau_count)
  VALUES (
    p_app_id,
    p_period_start,
    p_period_start + INTERVAL '1 month',
    1
  )
  ON CONFLICT (app_id, period_start)
  DO UPDATE SET
    mau_count = app_usage_metrics.mau_count + 1,
    last_updated = NOW();
  
  -- Update user-level aggregated usage
  -- Calculate totals by summing app usage for apps owned by this user
  INSERT INTO usage_metrics (user_id, period_start, period_end, total_mau, apps_count)
  VALUES (
    p_user_id,
    p_period_start,
    p_period_start + INTERVAL '1 month',
    1,
    1
  )
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    total_mau = (
      SELECT COALESCE(SUM(aum.mau_count), 0)
      FROM app_usage_metrics aum
      JOIN apps ON aum.app_id = apps.id
      JOIN organizations org ON apps.organization_id = org.id
      WHERE org.owner_id = p_user_id
      AND aum.period_start = p_period_start
    ),
    apps_count = (
      SELECT COUNT(DISTINCT aum.app_id)
      FROM app_usage_metrics aum
      JOIN apps ON aum.app_id = apps.id
      JOIN organizations org ON apps.organization_id = org.id
      WHERE org.owner_id = p_user_id
      AND aum.period_start = p_period_start
    ),
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
