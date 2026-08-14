# Moved to cavos-labs/cavos-recovery

The hardware-isolated recovery service now lives in its own repository:

  https://github.com/cavos-labs/cavos-recovery

It runs in an AWS Nitro Enclave rather than Google Confidential Space. These are
Rust binaries built for Graviton, with their own release cycle and their own
audit surface, so they no longer share a history with the Next.js control plane
that deploys from here.

What remains in this directory is `terraform/`, which still manages the live
Google Cloud resources from the previous design: a KMS keyring, two service
accounts, two workload identity pools, and an Artifact Registry repository.

**They are orphaned but not yet destroyed.** Nothing points at them — the code
that used them is gone — but the KMS key is what sealed the enrolment records
from the old design, and destroying it is irreversible. Tear it down once the
Nitro deployment has been running long enough that rolling back is off the
table, and check first that `cavos-vercel-control` is not used by another
project: it lets Vercel impersonate a service account that can create Compute
instances, which is worth removing deliberately rather than incidentally.
