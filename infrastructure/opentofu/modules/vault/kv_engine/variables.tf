variable "repo_name" {
  type        = string
  description = "Repository name from repo_name module output"
}

variable "environment" {
  type        = string
  description = "Deployment environment (e.g. dev, staging, prod)"
}