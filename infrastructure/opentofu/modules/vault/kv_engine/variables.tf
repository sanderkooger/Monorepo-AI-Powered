variable "repo_name" {
  type        = string
  description = "Repository name from repo_name module output"
}

variable "workspace_name" {
  type        = string
  description = "Workspace name for environment segregation (e.g. dev, staging, prod)"
}