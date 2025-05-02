terraform {
  required_providers {
    vault = {
      source = "hashicorp/vault"
      version = "~> 3.25"
    }
  }
}

provider "vault" {
  address = var.vault_addr
  token   = var.vault_token
}