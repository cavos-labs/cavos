output "artifact_repository" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.workload.repository_id}"
}

output "workload_service_account" {
  value = google_service_account.workload.email
}

output "control_plane_service_account" {
  value = google_service_account.control_plane.email
}

output "vercel_wif_pool_id" {
  value = google_iam_workload_identity_pool.vercel_control.workload_identity_pool_id
}

output "vercel_wif_provider_id" {
  value = google_iam_workload_identity_pool_provider.vercel_production.workload_identity_pool_provider_id
}

output "kms_key_name" {
  value = google_kms_crypto_key.recovery.id
}

output "wif_audience" {
  value = "//iam.googleapis.com/${google_iam_workload_identity_pool_provider.attestation.name}"
}

output "attestation_audience" {
  value = var.attestation_audience
}

output "zone" {
  value = var.zone
}
