variable "repo_name" {
  description = "Name of the repository for resource naming"
  type        = string
}

variable "environment_name" {
  description = "Deployment environment (prod/accept/dev-devname)"
  type        = string
  default     = "prod"

  validation {
    condition     = can(regex("^(prod|accept|dev-.*)$", var.environment_name))
    error_message = "Environment must be 'prod', 'accept', or 'dev-' prefixed"
  }
}