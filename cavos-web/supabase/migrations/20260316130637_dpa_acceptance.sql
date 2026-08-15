-- Track DPA acceptance per developer account
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dpa_accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS dpa_version TEXT;
