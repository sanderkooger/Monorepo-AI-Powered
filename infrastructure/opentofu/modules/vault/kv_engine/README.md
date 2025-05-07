# Vault KV Engine Module

## Overview
Provides centralized secrets management through HashiCorp Vault KV v2 engine with environment isolation. Creates a dedicated KV store per environment following naming convention `kv-<repo_name>-<env_name>`.

## Features
- Environment-specific secret isolation
- Automatic versioning & history tracking
- Hierarchical secret organization
- Integration with Vault access policies

## Usage
```hcl
module "vault_kv" {
  source    = "./modules/vault/kv_engine"
  repo_name = "monorepo-ai"
  env_name  = "prod"
}
```

## Variables
| Name | Description | Type | Default |
|------|-------------|------|---------|
| repo_name | Repository/project identifier | string | Required |
| env_name | Environment name (e.g., dev, prod) | string | Required |

## Security Considerations
- Secrets are retained after environment destruction
- Access controlled through centralized Vault policies
- Version history maintained for audit purposes
- Encryption at rest/transit handled by Vault cluster

```mermaid
graph TD
    User[Infrastructure Team] -->|Deploys| OTF[OpenTofu]
    OTF -->|Creates| KV_Engine["kv-${repo_name}-${env_name}"]
    KV_Engine -->|Contains| App_Secrets[Application Secrets]
    KV_Engine -->|Contains| Infra_Secrets[Infrastructure Secrets]
    Vault_Policy[Central Policy] -->|Manages Access| KV_Engine