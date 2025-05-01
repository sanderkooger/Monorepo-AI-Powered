provider "vault" {
  address = var.vault_addr
  token   = var.vault_token
}

resource "vault_kv_secret_v2" "proxmox_api_key" {
  mount      = "kv"
  name       = "${var.repo_name}/${var.environment}/proxmox-api-key"
  data_json  = jsonencode({
    "secret-id" = "dummy-value" # Will be replaced during CI/CD secret injection
  })
}



resource "vault_policy" "admin" {
  name = "admin-policy"
  policy = <<EOT
path "sys/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

path "kv/${var.repo_name}/${var.environment}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "auth/userpass/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOT
}