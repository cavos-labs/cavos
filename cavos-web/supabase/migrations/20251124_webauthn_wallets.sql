-- Add new columns for WebAuthn secure storage
ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS encrypted_pk_blob text,
ADD COLUMN IF NOT EXISTS user_social_id text;

-- Add unique constraint for (app_id, user_social_id, network)
-- This ensures one wallet per user per app per network
-- We use DO block to avoid error if constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_app_id_user_social_id_network_key') THEN
        ALTER TABLE public.wallets
        ADD CONSTRAINT wallets_app_id_user_social_id_network_key
        UNIQUE (app_id, user_social_id, network);
    END IF;
END $$;

-- Index for faster lookups by social ID
CREATE INDEX IF NOT EXISTS idx_wallets_user_social_id ON public.wallets(user_social_id);
