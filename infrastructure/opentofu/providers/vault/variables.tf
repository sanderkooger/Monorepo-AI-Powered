variable "vault_addr" {
  description = "Vault server URL (e.g. https://vault.example.com:8200)"
  type        = string
  
}

variable "vault_token" {
  description = "Vault authentication token with appropriate permissions"
  type        = string
  sensitive   = true
}