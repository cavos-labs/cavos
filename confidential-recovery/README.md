# Cavos Confidential Recovery

Production Google Confidential Space workload for hardware-isolated social
recovery. There is intentionally no local/mock attestation path: the binary
starts only when `/run/container_launcher/teeserver.sock` is present.

The browser verifies Google's signed attestation and encrypts the fresh
Google/Apple/Firebase ID token directly to an ephemeral P-256 channel key bound
into that attestation. Before the VM starts, only the token's SHA-256
fingerprint is exposed; the control plane stores a second hash and permits that
credential to reserve one session. The encrypted channel authenticates the
same session ID. The workload:

1. recomputes the token fingerprint and verifies its one-session binding;
2. verifies issuer, audience, signature, expiry, login nonce/provider, subject,
   and a maximum authentication age of five minutes;
3. generates or unseals the per-wallet recovery authority;
4. signs one exact Starknet/Solana device-add authorization, or rewraps only the
   Stellar DEK to the new device;
5. exits, after which the control plane deletes the ephemeral VM.

Production keeps a small platform-wide pool of empty, one-shot workloads. A
worker is attested and obtains short-lived KMS authority before it is marked
ready, but it receives no app, wallet, identity, provider token, encrypted job,
or recovery secret until a browser reserves it. The worker still handles only
one session and is destroyed after completion; its replacement boots outside
the user's login path.

## Build and test

```bash
cargo test
cargo build --locked --release
```

Build the measured container only from the committed lockfile:

```bash
docker build --platform linux/amd64 -t \
  us-central1-docker.pkg.dev/PROJECT/cavos-confidential/recovery:VERSION .
docker push \
  us-central1-docker.pkg.dev/PROJECT/cavos-confidential/recovery:VERSION
```

Resolve and pin the immutable digest; never configure `tee-image-reference`
with a mutable tag:

```bash
gcloud artifacts docker images describe \
  us-central1-docker.pkg.dev/PROJECT/cavos-confidential/recovery:VERSION \
  --format='value(image_summary.digest)'
```

## Google Cloud bootstrap

Terraform provisions Artifact Registry, Cloud KMS, the controller/workload
service accounts, a Workload Identity Pool, and an attestation provider whose
condition pins the production Confidential Space image, project, workload
service account, and exact container digest.

The first apply is two-stage because the repository must exist before the image
digest exists:

```bash
cd terraform
terraform init
terraform apply \
  -target=google_artifact_registry_repository.workload \
  -var='project_id=PROJECT' \
  -var='workload_image_digest=sha256:0000000000000000000000000000000000000000000000000000000000000000'
```

Build/push the image, obtain its digest, then create the complete policy:

```bash
terraform apply \
  -var='project_id=PROJECT' \
  -var='workload_image_digest=sha256:ACTUAL_DIGEST'
terraform output
```

Configure `cavos-web` from the outputs. The exact image reference must be:

```text
REGION-docker.pkg.dev/PROJECT/cavos-confidential/recovery:VERSION@sha256:DIGEST
```

The control plane uses Google Application Default Credentials. Attach the
`cavos-recovery-control` service account when running on Google Cloud, or
provide an external-account credential configuration through your deployment
platform. Do not use the workload service account for the control plane.

## Runtime invariants

- The OIDC token, recovery private key, Stellar DEK, and decrypted job are never
  logged or returned to the control plane.
- Each fresh provider token is accepted for one recovery session only; its raw
  value never appears in the session table.
- KMS access is granted to the measured workload identity, not to the Cavos
  control-plane service account.
- Starknet/Solana timelocks and exact replacement signers are enforced on-chain.
- Stellar classic cannot enforce that scope on-chain. The enclave stores only
  the DEK, never the Ed25519 control seed, and the new device performs the
  control-key operation locally.
- A changed image digest has no KMS access until Terraform updates the measured
  workload policy. Treat that update like a recovery-key rotation.
