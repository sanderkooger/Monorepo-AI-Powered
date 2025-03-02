terraform {
  required_providers {
    vault = {
      source = "hashicorp/vault"
      version = "~> 3.23"
    }
  }
}

resource "vault_auth_backend" "approle" {
  type = "approle"
  path = "approle"
}

resource "vault_approle_auth_backend_role" "ci_role" {
  backend        = vault_auth_backend.approle.path
  role_name      = "ci-cd"
  token_policies = ["default", "ci-policy"]
  
  secret_id_ttl  = 86400 # 24 hours
  token_ttl      = 3600  # 1 hour
  token_max_ttl  = 7200  # 2 hours
}

resource "vault_approle_auth_backend_role_secret_id" "ci_secret" {
  backend   = vault_auth_backend.approle.path
  role_name = vault_approle_auth_backend_role.ci_role.role_name
}

resource "terraform_data" "wrap_secret" {
  triggers_replace = vault_approle_auth_backend_role_secret_id.ci_secret.secret_id

  provisioner "local-exec" {
    command = <<EOT
      vault write sys/wrapping/wrap \
        -wrap-ttl="60s" \
        secret_id=${vault_approle_auth_backend_role_secret_id.ci_secret.secret_id}
    EOT
  }
}

output "role_id" {
  value = vault_approle_auth_backend_role.ci_role.role_id
  sensitive = true
}

output "wrapped_secret_id" {
  value = terraform_data.wrap_secret.output
  sensitive = true
}