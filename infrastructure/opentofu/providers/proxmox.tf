## Proxmox Configuration

variable "proxmox_url" {
  description = "Proxmox endpoint. Retrieved from environment variable or Vault path kv/Monorepo-AI-Powered/prod/proxmox/url"
  type        = string
}

variable "proxmox_api_key" {
  description = "Proxmox API token. Retrieved from environment variable or Vault path kv/Monorepo-AI-Powered/prod/proxmox/api-key"
  type        = string
}

provider "proxmox" {
  endpoint = var.proxmox_url
  token    = var.proxmox_api_key
}