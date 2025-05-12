terraform {
    required_providers {
    external = {
      source = "hashicorp/external"
      version = "~> 2.3.4"
    }
    vault = {
      source = "hashicorp/vault"
      version = "~> 4.8"
    }
    proxmox = {
      source = "bpg/proxmox"
      version = "0.77.0"
    }
  }
  required_version = ">= 1.7.2" # OpenTofu/Terraform version
}