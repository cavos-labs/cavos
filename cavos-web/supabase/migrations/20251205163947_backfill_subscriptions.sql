-- Backfill existing users with default developer subscription
-- This ensures users created before the subscription system exist in the user_subscriptions table

INSERT INTO user_subscriptions (user_id, plan_tier, status)
SELECT id, 'developer', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions);
