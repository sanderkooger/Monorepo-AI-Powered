# Vault KV v2 Module

Generic module for creating KV v2 secrets engines in HashiCorp Vault.

## Usage

```hcl
module "secrets_store" {
  source = "../../../modules/vault/kv-store"

  path        = "kv/your-app-name"
  description = "Secrets storage for your application"
}
```

## Inputs
- `path` (Required): Full mount path for the KV v2 engine
- `description` (Optional): Human-readable description

## Outputs
- `mount_path`: Created KV v2 engine path