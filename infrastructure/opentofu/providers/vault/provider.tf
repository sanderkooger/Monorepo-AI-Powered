terraform {
  required_version = ">= 1.7" # Added based on linting requirement
  required_providers {
    vault = {
      source = "hashicorp/vault"
      version = "~> 4.8"
    }
  }
}

provider "vault" {
  address = var.vault_addr  # Using global vault_addr variable
  token   = var.vault_token
}