variable "workspace_name" {
  type        = string
  description = "Workspace name for environment segregation (prod|accept|dev-<username>)"
  default     = null
  validation {
    condition     = var.workspace_name == null ? true : can(regex("^[a-z0-9-_]+$", var.workspace_name))
    error_message = "Workspace name must be lowercase alphanumeric with hyphens/underscores"
  }
}