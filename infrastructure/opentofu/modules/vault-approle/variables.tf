variable "mount_path" {
  type    = string
  default = "secret"
}

variable "secret_keys" {
  type    = list(string)
  default = ["api-key", "db-credentials"]
}

variable "approle_name" {
  type    = string
  default = "monorepo-approle"
}

variable "TF_ENV" {
  type    = string
  default = "dev"
}

variable "token_ttl" {
  type    = string
  default = "24h"
}

variable "token_max_ttl" {
  type    = string
  default = "48h"
}