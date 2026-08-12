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
  sessions and **deletes the Confidential Space VMs they left behind**. This is
  the only path that removes those VMs, so if it is not scheduled they
  accumulate — one stopped VM and its disk per cycle, indefinitely.
- `rollup-prune-operational-events`: daily at 02:20 UTC, entirely inside Postgres.

There is no warm-pool job. The pool sustains itself: a worker calls
`/api/recovery/social/workload/complete` when it finishes, which provisions its
replacement. Nothing to unschedule — the size is controlled by
`SOCIAL_RECOVERY_WARM_POOL_SIZE`, which is 0 unless set.

<!-- Verify what is actually scheduled, not what this file claims. -->

```sql
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
```

**Re-run `configure_cavos_http_crons` after any migration adds a job to it.**
The function only schedules jobs at the moment it runs, so a job added to its
body later never appears until it is invoked again. That is how
`cavos-social-recovery-cleanup` went missing while this file listed it as
scheduled, leaving stopped VMs to pile up.

Inspect recent HTTP calls through `net._http_response` and schedules through `cron.job`.
