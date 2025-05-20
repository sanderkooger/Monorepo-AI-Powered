terraform {
  required_version = ">= 1.7" # Added based on linting requirement

  required_providers {
    vault = {
      source  = "hashicorp/vault"
      version = "4.8.0" # From lock file
    }
  }
}
resource "vault_mount" "kv" {
  path        = "kv-${var.repo_name}-${var.env_name}"
  type        = "kv-v2"
  description = "Central KV store for Monorepo AI Powered"
  options = {
    version = "2"
  }
}

