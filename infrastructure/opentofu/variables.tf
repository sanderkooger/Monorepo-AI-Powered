# Global variables


variable "repo_name" {
  type        = string
  description = "Manual repository name override"
  default     = null
}


variable "env_name" {
  description = "env name for environment segregation (prod, accept, or dev-<name>)"
  type        = string
  default     = null
}


variable "proxmox_node_name" {
  description = "Proxmox node name"
  type        = string
  default     = null

}

variable "vault_addr" {
  description = "The address of the Vault server."
  type        = string
  default     = null # Or provide a sensible default if desired, though tfvars will override
}

variable "vault_token" {
  description = "The Vault token to use for authentication."
  type        = string
  sensitive   = true
  default     = null # Or provide a sensible default if desired, though tfvars will override
}
