-- Drop conflicting potential signatures of increment_mau
DROP FUNCTION IF EXISTS increment_mau(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS increment_mau(UUID, UUID, DATE, TEXT);

-- Recreate the correct function with optional wallet address parameter
CREATE OR REPLACE FUNCTION increment_mau(
  p_user_id UUID,
  p_app_id UUID,
  p_period_start DATE,
  p_wallet_address TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_is_new BOOLEAN;
BEGIN
  -- If wallet address is provided, check for uniqueness
  IF p_wallet_address IS NOT NULL THEN
    INSERT INTO active_wallets (app_id, wallet_address, period_start)
    VALUES (p_app_id, p_wallet_address, p_period_start)
    ON CONFLICT (app_id, wallet_address, period_start) DO NOTHING
    RETURNING TRUE INTO v_is_new;
    
    -- If not new unique wallet, exit
    IF v_is_new IS NULL THEN
      RETURN;
    END IF;
  END IF;

  -- Insert or update app-level usage (Only reaches here if unique or no wallet address provided)
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
