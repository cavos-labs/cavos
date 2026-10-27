# Scheduled jobs

Cavos does not use Vercel Cron. Jobs that call the app run from GitHub Actions;
jobs that only touch the database run inside Postgres with Supabase Cron (`pg_cron`).

GitHub Actions:

- `sync-jwks.yml`: hourly; refreshes the Slot JWKS on every Katana instance.
  Mainnet/sepolia sync is manual (`workflow_dispatch`).

Supabase Cron:

- `cleanup-expired-ephemeral-rows`: daily at 04:00 UTC.
- `cleanup-old-transactions`: daily at 04:00 UTC; drops transactions older than 90 days.
- `rollup-prune-operational-events`: daily at 02:20 UTC.
- `expire-social-recovery-sessions`: every five minutes.
- `cleanup-oauth-callback-codes`: every five minutes.
- `prune-cron-run-details`: daily at 03:30 UTC; keeps seven days of `pg_cron` history,
  which pg_cron never prunes on its own.

There are no `pg_net` jobs. The ones that existed were blocked by Cloudflare on
every call and were dropped in `20261027150000_drop_http_crons.sql`, along with
the extension. A job that must reach the app belongs in GitHub Actions.

<!-- Verify what is actually scheduled, not what this file claims. -->

```sql
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
```
