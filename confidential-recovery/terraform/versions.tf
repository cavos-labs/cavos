terraform {
  required_version = ">= 1.6"

  backend "gcs" {
    bucket = "cavos-459123-terraform-state"
    prefix = "confidential-recovery"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
