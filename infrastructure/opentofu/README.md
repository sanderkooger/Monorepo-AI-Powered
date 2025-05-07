# OpenTofu Infrastructure

## TL;DR
**Vault Integration**:  
The `vault/kv_engine` module provides environment-isolated secrets storage.  
[Detailed Vault KV Documentation](./modules/vault/kv_engine/README.md)

```hcl
module "vault_kv_prod" {
  source    = "./modules/vault/kv_engine"
  repo_name = "monorepo-ai"
  env_name  = "prod"
}
```

## Key Modules
| Module | Purpose | Docs |
|--------|---------|------|
| `vault/kv_engine` | Centralized secrets management | [Readme](./modules/vault/kv_engine/README.md) |
| `compute/proxmox/ubuntu-vm` | VM provisioning | - |
| `helpers/get_repo_name` | Repository identification | - |