provider "vault" {
  address = var.vault_addr
  token   = var.vault_token
}

resource "vault_auth_backend" "userpass" {
  type = "userpass"
}

resource "vault_policy" "admin" {
  name = "admin-policy"
  policy = <<EOT
path "sys/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

path "kv/Monorepo-AI-Powered/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "auth/userpass/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOT
}

data "vault_generic_secret" "sander_password" {
  path = "kv/Monorepo-AI-Powered/env/sander-password"
}

resource "vault_generic_endpoint" "sander_user" {
  depends_on           = [vault_auth_backend.userpass]
  path                 = "auth/userpass/users/sander"
  ignore_absent_fields = true

  data_json = jsonencode({
    policies = ["admin-policy"]
    password = data.vault_generic_secret.sander_password.data["value"]
  })
}