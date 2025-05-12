variable "reponame" {
  description = "The name of the repository, used to construct the Vault path."
  type        = string
}

variable "environment" {
  description = "The environment (e.g., dev, staging, prod), used to construct the Vault path."
  type        = string
}

variable "role_name" {
  description = "The name of the SSH role to create."
  type        = string
  default     = "default-role"
}

variable "allowed_users" {
  description = "A list of usernames allowed to request certificates from this role."
  type        = list(string)
  default     = ["ansible"]
}

variable "ttl" {
  description = "The Time-To-Live for certificates issued by this role."
  type        = string
  default     = "30m"
}

variable "max_ttl" {
  description = "The maximum Time-To-Live for certificates issued by this role."
  type        = string
  default     = "24h" # Example, can be adjusted
}

variable "ssh_engine_path_suffix" {
  description = "The suffix for the SSH engine path."
  type        = string
  default     = "ssh"
}