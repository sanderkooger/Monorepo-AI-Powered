# Vault AppRole Module

Provides secure AppRole authentication configuration for CI/CD systems

## Usage

```hcl
module "vault_approle" {
  source = "./modules/vault-approle"
}

# Set these environment variables:
# export VAULT_ADDR="http://vault:8200"
# export VAULT_TOKEN="root-token"
```

## Outputs

- `role_id`: AppRole RoleID for CI authentication
- `wrapped_secret_id`: Wrapped SecretID for secure distribution
