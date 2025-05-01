variable "environment" {
  type        = string
  description = "Deployment environment (dev/accept/production)"
  default     = "dev" # Default to dev environment

  validation {
    condition     = contains(["dev", "accept", "production"], var.environment)
    error_message = "Valid values: dev, accept, production"
  }
}

variable "repo_name" {
  type        = string
  description = "Name of the repository for Vault path construction"
  default     = "Monorepo-AI-Powered"
}