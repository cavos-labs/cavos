-- Solana program allowlist — per-app set of external Solana programs whose
-- instructions a wallet may execute via the sponsored relayer's `execute` path.
--
-- The relayer co-signs (and pays) only transactions whose CPI targets are in
-- the app's allowlist OR in a small hardcoded "always-safe" set (System, SPL
-- Token, etc.). This is the core anti-abuse control for arbitrary execute:
-- without it, anyone with a valid app_id could chain arbitrary CPIs and have
-- Cavos bank the compute. Configured per-app in the dashboard.
--
-- Default '{}' = no external programs (only the always-safe set). Apps that
-- need e.g. Jupiter add its program id here.

ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS allowed_solana_programs TEXT[] NOT NULL DEFAULT '{}';
