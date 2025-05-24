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


variable "vault_backend_pg_conn_str" {
  description = "PostgreSQL connection string for Vault backend"
  type        = string
  default     = null
}
