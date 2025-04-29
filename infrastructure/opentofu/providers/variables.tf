variable "vault_addr" {
  type = string
}

variable "vault_token" {
  type = string
}

variable "repo_name" {
  type = string
}


variable "environment" {
  type        = string
  description = "Workspace environment (dev/prod)"
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Valid values: dev, prod"
  }
}