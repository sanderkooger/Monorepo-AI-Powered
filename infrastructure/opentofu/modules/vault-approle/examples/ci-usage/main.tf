module "vault_approle_ci" {
  source = "../../"

  # Inherit provider configuration from parent
}

provider "vault" {
  address = "http://vault.example.com:8200"
  # Token would be provided via VAULT_TOKEN env var
}

output "ci_credentials" {
  value = {
    role_id          = module.vault_approle_ci.role_id
    wrapped_secret_id = module.vault_approle_ci.wrapped_secret_id
  }
  sensitive = true
}