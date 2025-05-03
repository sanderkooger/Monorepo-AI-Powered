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

variable "workspace_name" {
  description = "Workspace name for environment segregation (prod, accept, or dev-<name>)"
  type        = string
  default       = null
}
variable "repo_name" {
  type        = string
  description = "Manual repository name override"
  default = null
}