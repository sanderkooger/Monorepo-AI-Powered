variable "vault_addr" {
  type = string
}

variable "vault_token" {
  type = string
}

variable "repo_name" {
  type = string
}

module "vault" {
  source      = "./providers"
  vault_addr  = var.vault_addr
  vault_token = var.vault_token
  repo_name   = var.repo_name
  proxmox_url = var.proxmox_url
  proxmox_api_key = var.proxmox_api_key
}
