# OpenTofu Infrastructure Configuration

## Overview
Environment-agnostic infrastructure as code configuration following repository standards:
- No environment-specific directories
- Provider isolation
- Modular architecture
- Vault integration for secret management

## Directory Structure
```bash
opentofu/
├── variables.tf          # Core variables (repo_name, env)
├── versions.tf           # Version constraints
├── terraform.auto.tfvars # Default variable values
├── providers/
│   └── vault/
│       └── main.tf       # Vault provider configuration
└── modules/
    ├── network/          # Networking components
    │   └── .gitkeep
    ├── compute/          # Compute resources
    │   └── .gitkeep
    ├── vault/            # Vault integrations
    │   └── .gitkeep
    └── storage/          # Storage configurations
        └── .gitkeep
```

## Core Components

### Variables
- `repo_name`: Used for resource naming conventions
- `environment_name`: Deployment environment (prod/accept/dev-*) (default: prod)

### Providers
- **Vault** (v4.8.0): Configured via environment variables:
  ```bash
  export VAULT_ADDR="https://vault.example.com"
  export VAULT_TOKEN="$(vault login -token-only)"
  ```

## Usage
1. Initialize configuration:
```bash
tofu init
```

2. Plan changes:
```bash
tofu plan -var="repo_name=Monorepo-AI-Powered"
```

## Secret Management
Follows repository security policy:
- Secrets stored in Vault KV engine at `kv/{repo_name}/global`
- Accessed via Terraform data sources:
  ```hcl
  data "vault_kv_secret_v2" "global" {
    mount = "kv"
    name  = "${var.repo_name}/global"
  }