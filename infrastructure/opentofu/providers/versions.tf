terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      # Add version constraint if needed, e.g., version = "~> 0.43.0"
    }
    vault = {
      source  = "hashicorp/vault"
      # Add version constraint if needed, e.g., version = "~> 3.26.0"
    }
  }
}