-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  email TEXT, -- User email instead of ID
  network TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(address, network)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hash TEXT NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'pending', 'confirmed', 'failed'
  network TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hash, network)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallets_app_id ON public.wallets(app_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON public.wallets(address);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_app_id ON public.transactions(app_id);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallets
-- Allow public insert if they have the correct app_id (validated by API key in backend usually, but here we might need a service role or open policy for now if called from client directly? 
-- Actually, the plan says we will have API endpoints in cavos-web. So the backend will insert.
-- The backend uses service role key usually, which bypasses RLS. 
-- But if we want to allow viewing:

CREATE POLICY "Users can view wallets in their apps"
  ON public.wallets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.apps
      WHERE apps.id = wallets.app_id
      AND EXISTS (
        SELECT 1 FROM public.organizations
        WHERE organizations.id = apps.organization_id
        AND organizations.owner_id = auth.uid()
      )
    )
  );

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions in their apps"
  ON public.transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.apps
      WHERE apps.id = transactions.app_id
      AND EXISTS (
        SELECT 1 FROM public.organizations
        WHERE organizations.id = apps.organization_id
        AND organizations.owner_id = auth.uid()
      )
    )
  );

-- Triggers for updated_at
CREATE TRIGGER set_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
