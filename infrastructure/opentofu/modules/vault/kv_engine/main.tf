resource "vault_mount" "kv_engine" {
  path        = "kv-${var.repo_name}-${var.workspace_name}"
  type        = "kv-v2"
  description = "KV v2 secrets engine for ${var.repo_name} (${var.workspace_name})"
}