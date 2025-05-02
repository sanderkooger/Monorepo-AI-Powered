provider "vault" {
  # Authentication via environment variables:
  # VAULT_ADDR and VAULT_TOKEN
  # This follows the repository's secret management policy
  address = var.vault_address
}

data "vault_kv_secret_v2" "global" {
  mount = "kv"
  name  = "${var.repo_name}/global"
}

variable "vault_address" {
  description = "Vault server URL (e.g. https://vault.example.com:8200)"
  type        = string
}