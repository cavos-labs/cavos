variable "project_id" {
  type        = string
  description = "Google Cloud project that owns the workload and KMS key."
}

variable "region" {
  type        = string
  description = "Artifact Registry and control-plane region."
  default     = "us-central1"
}

variable "zone" {
  type        = string
  description = "Zone used for ephemeral Confidential Space VMs."
  default     = "us-central1-a"
}

variable "workload_image_digest" {
  type        = string
  description = "Measured container digest, including sha256: prefix."
  validation {
    condition     = can(regex("^sha256:[0-9a-f]{64}$", var.workload_image_digest))
    error_message = "workload_image_digest must be sha256:<64 lowercase hex>."
  }
}

variable "attestation_audience" {
  type        = string
  description = "Custom audience verified by the Cavos control plane."
  default     = "https://cavos.xyz/api/recovery/social/attestation"
}

variable "vercel_team_slug" {
  type        = string
  description = "Vercel team slug used by the team-scoped OIDC issuer."
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{0,99}$", var.vercel_team_slug))
    error_message = "vercel_team_slug must be a valid lowercase Vercel team slug."
  }
}

variable "vercel_project_name" {
  type        = string
  description = "Exact Vercel project name allowed to control recovery VMs."
  validation {
    condition     = length(var.vercel_project_name) > 0 && length(var.vercel_project_name) <= 100
    error_message = "vercel_project_name must contain between 1 and 100 characters."
  }
}
