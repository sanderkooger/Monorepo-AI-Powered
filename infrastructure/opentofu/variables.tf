# Global variables

variable "vault_addr" {
  type        = string
  description = "Vault server address"
  default     = "https://vault.thisisfashion.tv"
}

variable "environment" {
  type        = string
  description = "Environment (prod|accept|dev-<username>)"
  default     = "prod"
  validation {
    condition     = can(regex("^(prod|accept|dev-[a-z0-9_]+)$", var.environment))
    error_message = "Must be 'prod', 'accept', or 'dev-' followed by lowercase alphanumeric/underscore"
  }
}