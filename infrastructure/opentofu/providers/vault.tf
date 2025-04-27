provider "vault" {
  address = var.vault_addr
  token   = var.vault_token
}

resource "vault_mount" "kv_engine" {
  path = "kv/${var.repo_name}"
  type = "kv"
  options = {
    version = "2"
  }
}

resource "vault_policy" "repo_policy" {
  name   = var.repo_name
  policy = <<EOF
path "kv/${var.repo_name}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOF
}