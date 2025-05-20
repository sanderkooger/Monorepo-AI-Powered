

terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "0.77.0" # Verify latest version
    }
    random = {
      source  = "hashicorp/random"
      version = "3.7.2"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "4.8.0"
    }
    ansible = {
      version = "~> 1.3.0"
      source  = "ansible/ansible"
    }
  }
  
  required_version = ">= 1.7.2" # OpenTofu/Terraform version
}