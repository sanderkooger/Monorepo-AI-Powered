data "vault_generic_secret" "proxmox" {
  count = var.environment == "prod" ? 1 : 0
  path  = "kv/Monorepo-AI-Powered/${var.environment}/proxmox"
}