data "google_project" "current" {
  project_id = var.project_id
}

locals {
  services = toset([
    "artifactregistry.googleapis.com",
    "cloudkms.googleapis.com",
    "compute.googleapis.com",
    "confidentialcomputing.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
  ])
  workload_name = "cavos-confidential-recovery"
}

resource "google_project_service" "required" {
  for_each           = local.services
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "workload" {
  depends_on    = [google_project_service.required]
  location      = var.region
  repository_id = "cavos-confidential"
  format        = "DOCKER"
  description   = "Measured Cavos Confidential Space workloads"
}

resource "google_service_account" "workload" {
  account_id   = "cavos-confidential-recovery"
  display_name = "Cavos Confidential Recovery workload"
}

resource "google_service_account" "control_plane" {
  account_id   = "cavos-recovery-control"
  display_name = "Cavos recovery ephemeral VM controller"
}

resource "google_project_iam_member" "workload_attestation" {
  project = var.project_id
  role    = "roles/confidentialcomputing.workloadUser"
  member  = "serviceAccount:${google_service_account.workload.email}"
}

resource "google_artifact_registry_repository_iam_member" "workload_image_reader" {
  location   = google_artifact_registry_repository.workload.location
  repository = google_artifact_registry_repository.workload.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.workload.email}"
}

resource "google_project_iam_member" "control_compute" {
  project = var.project_id
  role    = "roles/compute.instanceAdmin.v1"
  member  = "serviceAccount:${google_service_account.control_plane.email}"
}

resource "google_service_account_iam_member" "control_uses_workload_sa" {
  service_account_id = google_service_account.workload.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.control_plane.email}"
}

resource "google_iam_workload_identity_pool" "vercel_control" {
  depends_on                = [google_project_service.required]
  workload_identity_pool_id = "cavos-vercel-control"
  display_name              = "Cavos Vercel control plane"
}

resource "google_iam_workload_identity_pool_provider" "vercel_production" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.vercel_control.workload_identity_pool_id
  workload_identity_pool_provider_id = "vercel-production"
  display_name                       = "Cavos Vercel production"

  attribute_mapping = {
    "google.subject" = "assertion.sub"
  }
  attribute_condition = "assertion.sub == \"owner:${var.vercel_team_slug}:project:${var.vercel_project_name}:environment:production\""

  oidc {
    issuer_uri        = "https://oidc.vercel.com/${var.vercel_team_slug}"
    allowed_audiences = ["https://vercel.com/${var.vercel_team_slug}"]
  }
}

resource "google_service_account_iam_member" "vercel_uses_control_plane_sa" {
  service_account_id = google_service_account.control_plane.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principal://iam.googleapis.com/projects/${data.google_project.current.number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.vercel_control.workload_identity_pool_id}/subject/owner:${var.vercel_team_slug}:project:${var.vercel_project_name}:environment:production"
}

resource "google_kms_key_ring" "recovery" {
  depends_on = [google_project_service.required]
  name       = "cavos-confidential-recovery"
  location   = "global"
}

resource "google_kms_crypto_key" "recovery" {
  name            = "wallet-recovery-records"
  key_ring        = google_kms_key_ring.recovery.id
  rotation_period = "7776000s"
  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool" "recovery" {
  depends_on                = [google_project_service.required]
  workload_identity_pool_id = "cavos-confidential-recovery"
  display_name              = "Cavos recovery workloads"
}

resource "google_iam_workload_identity_pool_provider" "attestation" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.recovery.workload_identity_pool_id
  workload_identity_pool_provider_id = "google-confidential-space"
  display_name                       = "Confidential Space attestation"

  attribute_mapping = {
    "google.subject"         = "\"gcpcs::\" + assertion.submods.container.image_digest + \"::\" + assertion.submods.gce.project_number + \"::\" + assertion.submods.gce.instance_id"
    "attribute.image_digest" = "assertion.submods.container.image_digest"
  }
  attribute_condition = <<-CEL
    assertion.swname == "CONFIDENTIAL_SPACE" &&
    assertion.dbgstat == "disabled-since-boot" &&
    "STABLE" in assertion.submods.confidential_space.support_attributes &&
    assertion.submods.container.image_digest == "${var.workload_image_digest}" &&
    assertion.submods.gce.project_number == "${data.google_project.current.number}" &&
    "${google_service_account.workload.email}" in assertion.google_service_accounts
  CEL

  oidc {
    issuer_uri        = "https://confidentialcomputing.googleapis.com/"
    allowed_audiences = ["https://sts.googleapis.com"]
  }
}

resource "google_kms_crypto_key_iam_member" "measured_workload" {
  crypto_key_id = google_kms_crypto_key.recovery.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "principalSet://iam.googleapis.com/projects/${data.google_project.current.number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.recovery.workload_identity_pool_id}/attribute.image_digest/${var.workload_image_digest}"
}
