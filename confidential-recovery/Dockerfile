FROM rust:1.88-bookworm AS build
WORKDIR /src
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
RUN cargo build --locked --release

FROM gcr.io/distroless/cc-debian12:nonroot
COPY --from=build /src/target/release/cavos-confidential-recovery /workload
LABEL "tee.launch_policy.allow_env_override"="CAVOS_CONTROL_PLANE_URL,CAVOS_RECOVERY_SESSION_ID,CAVOS_RECOVERY_BOOTSTRAP_TOKEN,CAVOS_ATTESTATION_AUDIENCE,CAVOS_KMS_KEY_NAME,CAVOS_WIF_AUDIENCE,CAVOS_RECOVERY_JOB_TIMEOUT_SECONDS"
LABEL "tee.launch_policy.log_redirect"="never"
USER nonroot:nonroot
ENTRYPOINT ["/workload"]
