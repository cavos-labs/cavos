-- Drop the sponsored-trustline allowlist.
--
-- It was built to stop an open `changeTrust` draining an org's sponsor pot one
-- asset at a time. That is true and it is beside the point: a trustline costs
-- that pot one base reserve, creating an account costs it seven, and the create
-- path is open to anyone holding the app's public id. Gating the cheaper
-- operation while the dearer one stands open bought nothing but a table, a
-- dashboard panel, and a way to misconfigure the network and get a rejection
-- that reads like a bug.
--
-- What bounds this pot is the gas meter, the rate limit, and whatever guards the
-- create path grows. The relay still gates the *shape* of a trustline write —
-- one sponsored account, account-sourced ops, classic assets only — it just no
-- longer has an opinion about which asset.
--
-- Nothing read these rows except the relay, and no client had shipped against
-- them, so there is nothing to preserve.

DROP TABLE IF EXISTS public.app_stellar_trustlines;

-- The org-keyed predecessor, in case a database still carries it: it was dropped
-- by 20260818223000 wherever that ran, but a database restored from before it
-- would still have the table and nothing left to read it.
DROP TABLE IF EXISTS public.org_stellar_trustlines;
