# Scheduled jobs

Cavos does not use Vercel Cron. Operational HTTP jobs are scheduled with Supabase Cron (`pg_cron`) and invoked with `pg_net`.

After applying migrations, run this once in the Supabase SQL editor:

```sql
SELECT public.configure_cavos_http_crons(
  'https://cavos.xyz',
  'the-same-random-value-configured-as-CRON_SECRET'
);
```

The function stores both values in Supabase Vault. Do not commit them to source control.

Generate a secret with `openssl rand -hex 32`, configure it as `CRON_SECRET`
in the production deployment, and pass that exact same value to the function above.

Jobs:

- `cavos-webhook-retries`: every five minutes.
- `cavos-sync-jwks`: daily at midnight UTC.
- `cavos-social-recovery-cleanup`: every five minutes; expires abandoned
  sessions and deletes their ephemeral Confidential Space VMs.
- `cavos-social-recovery-warm-pool`: every minute; keeps empty, one-shot
  Confidential Space workers attested and ready before OAuth. **Off unless
  `SOCIAL_RECOVERY_WARM_POOL_SIZE` is set** (0–4, default 0) — an idle
  Confidential VM costs money around the clock, and warm workers only buy
  latency: with the pool empty, enrolment and recovery still work from a cold
  start. Turn it on when real users are recovering wallets. The job stays
  scheduled either way; with a target of 0 it creates nothing and still reaps
  workers whose VM has gone away.
- `rollup-prune-operational-events`: daily at 02:20 UTC, entirely inside Postgres.

Inspect recent HTTP calls through `net._http_response` and schedules through `cron.job`.
