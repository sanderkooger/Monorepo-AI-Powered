# Vault AppRole Module

This Terraform module provisions:
- A Vault KV v2 mount at a configurable path for your repository.
- A policy granting read access to specific secret paths.
- An AppRole bound to that policy for machine authentication.

## Module Inputs

| Name          | Type         | Description                                                 |
| ------------- | ------------ | ----------------------------------------------------------- |
| mount_path    | string       | KV v2 mount path, e.g. `kv/Monorepo-AI-Powered`            |
| environment   | string       | Environment name, e.g. `prod`                              |
| secret_keys   | list(string) | Keys to grant read access, e.g. `["proxmox-api-key"]`      |
| approle_name  | string       | Name for the AppRole, e.g. `proxmox-read-role`             |
| token_ttl     | string       | Token TTL, e.g. `20m`                                       |
| token_max_ttl | string       | Token max TTL, e.g. `1h`                                    |

## Usage

```hcl
module "vault_approle" {
  source        = "./infrastructure/opentofu/modules/vault-approle"
  mount_path    = "kv/Monorepo-AI-Powered"
  environment   = "prod"
  secret_keys   = ["proxmox-api-key"]
  approle_name  = "proxmox-read-role"
  token_ttl     = "20m"
  token_max_ttl = "1h"
}
```

## Example Policy Snippet

```hcl
path "<mount_path>/<environment>/proxmox-api-key" {
  capabilities = ["read"]
}