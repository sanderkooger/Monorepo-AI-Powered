resource "vault_mount" "kv" {
  path        = "kv-${var.repo_name}-${var.env_name}"
  type        = "kv-v2"
  description = "Central KV store for Monorepo AI Powered"
  options = {
    version = "2"
  }
}

