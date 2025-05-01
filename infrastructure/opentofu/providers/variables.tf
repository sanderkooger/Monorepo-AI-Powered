variable "vault_addr" {
  type = string
}

variable "vault_token" {
  type = string
}

variable "repo_name" {
  type        = string
  description = "Repository name for Vault path construction"
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev/accept/production)"
}
