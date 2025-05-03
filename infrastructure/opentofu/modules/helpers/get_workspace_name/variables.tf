variable "workspace_name" {
  type        = string
  description = "Workspace name for environment segregation (prod, accept, or dev-<name>)"
  default     = null
  validation {
    condition     = var.workspace_name == null ? true : can(regex("^(prod|accept|dev-[a-z0-9-_]+)$", var.workspace_name))
    error_message = "Workspace name must be 'prod', 'accept', or start with 'dev-' followed by lowercase alphanumerics/hyphens/underscores"
  }
}