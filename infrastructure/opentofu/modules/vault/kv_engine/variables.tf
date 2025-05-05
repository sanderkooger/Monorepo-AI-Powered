variable "repo_name" {
  type        = string
  description = "Repository name from repo_name module output"
}

variable "env_name" {
  type        = string
  description = "env name for environment segregation (e.g. dev, staging, prod)"
}