resource "vault_mount" "kv" {
  path        = var.path
  type        = "kv-v2"
  description = var.description
}