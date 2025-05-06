resource "vault_mount" "kv" {
  path        = "kv-Monorepo-AI-Powered-prod"
  type        = "kv-v2"
  description = "Central KV store for Monorepo AI Powered"
  options = {
    version = "2"
  }
}

resource "vault_kv_secret_backend_v2" "config" {
  mount                = vault_mount.kv.path
  delete_version_after = 31536000 # 1 year in seconds
  cas_required         = true

  lifecycle {
    prevent_destroy = true
  }
}

output "store_path" {
  value = vault_mount.kv.path
}