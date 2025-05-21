# Global variables


variable "repo_name" {
  type        = string
  description = "Manual repository name override"
  default     = "Monorepo-AI-Powered"
}


variable "env_name" {
  description = "env name for environment segregation (prod, accept, or dev-<name>)"
  type        = string
  default     = "prod"
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
 variable "supabase_postgres_conn_str" {
  description = "The connection string for the Supabase Postgres database."
  type        = string
  sensitive   = true
  default     = null # Or provide a sensible default if desired, though tfvars will override
}