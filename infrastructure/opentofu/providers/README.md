# Terraform Providers Management

## Version Management Strategy
### Current Approach
- **Centralized Control**: Single `versions.tf` at root level manages all provider requirements
- **Conflict Prevention**: Strict version constraints using pessimistic operator (`~>`)
- **Audit Trail**: Lock file (.terraform.lock.hcl) committed for reproducible builds

### Key Benefits
1. **Simplified Upgrades**: Single source of truth for provider versions
2. **Consistent Environments**: All modules use same provider versions
3. **Conflict Avoidance**: No module-specific overrides that could cause incompatibilities

### Implementation Example
```hcl
# infrastructure/opentofu/versions.tf
terraform {
  required_providers {
    vault = {
      source  = "hashicorp/vault"
      version = "~> 4.8.0" # Allows patch updates only
    }
    proxmox = {
      source  = "bpg/proxmox"
      version = "~> 0.76.0"
    }
  }
}
```

### Future Considerations
- Module-specific `versions.tf` files may be added for:
  - Experimental provider features
  - Temporary version forks
  - Legacy system integration
- Use `terraform providers mirror` for air-gapped environments

## Overview
This directory contains provider configurations following our infrastructure-as-code standards. Each cloud provider/service has its own isolated module to:
- Maintain clear separation of concerns
- Standardize secret management
- Enable reusable provider configurations
- Simplify version upgrades

## Directory Structure
```bash
providers/
├── vault/          # Vault provider config
│   ├── main.tf     # Provider + resources
│   ├── variables.tf
│   ├── outputs.tf
│   └── README.md   # Provider-specific docs
└── (new-provider)/ # Template for future providers
```

## Conventions
1. **Secret Management**:
   - All secrets use `kv/${var.repo_name}/${var.environment}/` path
   - Secrets are injected via CI/CD (never committed)

2. **Version Pinning**:
   ```hcl
   terraform {
     required_providers {
       vault = {
         source  = "hashicorp/vault"
         version = "4.8.0"
       }
     }
   }
   ```

3. **Interface Contracts**:
   - Each provider exposes outputs for cross-module integration
   - Input variables validate using type constraints

## Example Usage
```hcl
module "vault_provider" {
  source      = "./providers/vault"
  vault_addr  = var.vault_addr
  vault_token = var.vault_token
  repo_name   = "Monorepo-AI-Powered"
  environment = "dev"
}
```

## Adding a New Provider
1. Create new directory under `providers/`
2. Implement standard module structure
3. Document in provider-specific README
4. Update root `versions.tf` with provider requirements

> See [vault/README.md](./vault/README.md) for implementation example