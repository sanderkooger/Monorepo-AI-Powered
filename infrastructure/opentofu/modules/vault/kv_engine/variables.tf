variable "repo_name" {
  type        = string
  description = "Repository name from repo_name module output"
}

variable "workplace_name" {
  type        = string
  description = "Workplace name for environment segregation (e.g. dev, staging, prod)"
}