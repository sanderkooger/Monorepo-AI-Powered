variable "vault_addr" {
  type = string
}

variable "vault_token" {
  type = string
}

variable "repo_name" {
  type = string
}

variable "proxmox_url" {
  type        = string
  description = "Proxmox endpoint (dev: local, prod: Vault)"
  default     = "http://dev-pve.local"
}

variable "proxmox_api_key" {
  type        = string
  sensitive   = true
  description = "Proxmox API token (dev: local, prod: Vault)"
  default     = "dev-token"
}

variable "environment" {
  type        = string
  description = "Workspace environment (dev/prod)"
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Valid values: dev, prod"
  }
}