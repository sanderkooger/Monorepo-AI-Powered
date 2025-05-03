variable "vault_addr" {
  description = "Vault server URL (e.g. https://vault.example.com:8200)"
  type        = string

  validation {
    condition     = can(regex("^https://[a-zA-Z0-9.-]+:\\d+$", var.vault_addr))
    error_message = "Vault address must be a valid HTTPS URL with port (e.g. https://vault.example.com:8200)"
  }
}

variable "vault_token" {
  description = "Vault authentication token with appropriate permissions"
  type        = string
  sensitive   = true
}