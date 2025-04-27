variable "mount_path" {
  description = "KV v2 mount path, e.g. 'kv/Monorepo-AI-Powered'"
  type        = string
}

variable "environment" {
  description = "Environment name, e.g. 'prod' or 'dev'"
  type        = string
}

variable "secret_keys" {
  description = "List of secret keys to grant read access, e.g. ['proxmox-api-key']"
  type        = list(string)
}

variable "approle_name" {
  description = "Name for the AppRole, e.g. 'proxmox-read-role'"
  type        = string
}

variable "token_ttl" {
  description = "Token TTL, e.g. '20m'"
  type        = string
}

variable "token_max_ttl" {
  description = "Token maximum TTL, e.g. '1h'"
  type        = string
}