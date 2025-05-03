# Global variables

variable "repo_name" {
  type        = string
  description = "Repository name from git origin (format: org/repo)"
  default     = null
  # Validation handled through local.final_repo_name usage
}

variable "vault_addr" {
  type        = string
   description = "Vault server URL (e.g. https://vault.example.com:8200)"
 
}

variable "workplace_name" {
  type        = string
  description = "Workplace name for environment segregation (prod|accept|dev-<username>)"
  validation {
    condition     = can(regex("^(prod|accept|dev-[a-z0-9_]+)$", var.workplace_name))
    error_message = "Must be 'prod', 'accept', or 'dev-' followed by lowercase alphanumeric/underscore"
  }
}