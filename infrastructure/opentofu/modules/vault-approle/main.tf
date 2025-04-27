provider "vault" {
  # Configure Vault connection as needed.
}

resource "vault_mount" "kv_repo" {
  path = var.mount_path
  type = "kv"
  options = {
    version = "2"
  }
}

resource "vault_policy" "secrets" {
  for_each = toset(var.secret_keys)
  name     = "${var.approle_name}-${each.value}"
  policy   = <<-EOF
    path "${var.mount_path}/${var.environment}/${each.value}" {
      capabilities = ["read"]
    }
  EOF
}

resource "vault_approle_auth_backend_role" "approle" {
  role_name      = var.approle_name
  token_policies = [for p in vault_policy.secrets : p.name]
  token_ttl      = var.token_ttl
  token_max_ttl  = var.token_max_ttl
}