-- Remove PII from analytics tables
-- wallets: drop email column
-- transactions: drop hash and status columns (INSERT-only, no dedup by hash)

ALTER TABLE public.wallets DROP COLUMN IF EXISTS email;

-- Drop unique constraint on hash,network before dropping the column
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_hash_network_key;

-- Drop the updated_at trigger (transactions are now INSERT-only)
DROP TRIGGER IF EXISTS set_transactions_updated_at ON public.transactions;

ALTER TABLE public.transactions DROP COLUMN IF EXISTS hash;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS status;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS updated_at;
