
terraform {
  required_version = ">= 1.7.2" 
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

  backend "pg" {
    conn_str = var.vault_backend_pg_conn_str
    schema_name = "${var.repo_name}_${var.env_name}"
   
  }
}
