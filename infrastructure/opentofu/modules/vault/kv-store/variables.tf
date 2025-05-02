variable "path" {
  description = "Full path for the KV v2 secrets engine"
  type        = string
}

variable "description" {
  description = "Description of the KV store purpose"
  type        = string
  default     = "KV Version 2 secrets engine"
}