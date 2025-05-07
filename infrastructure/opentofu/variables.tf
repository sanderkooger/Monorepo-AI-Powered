# Global variables

## Vault vars 
variable "vault_addr" {
  description = "Vault server URL (e.g. https://vault.example.com:8200)"
  type        = string
}

variable "vault_token" {
  description = "Vault authentication token with appropriate permissions"
  type        = string
  sensitive   = true
}
variable "repo_name" {
  type        = string
  description = "Manual repository name override"
  default = null
}

variable "env_name" {
  description = "env name for environment segregation (prod, accept, or dev-<name>)"
  type        = string
  default = null
}

variable "proxmox_node_name" {
  description = "Name of Proxmox host node for VM deployment"
  type        = string
}

 
