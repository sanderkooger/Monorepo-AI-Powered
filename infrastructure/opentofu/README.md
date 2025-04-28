# OpenTofu Infrastructure Configuration

This directory contains infrastructure-as-code definitions for provisioning and managing resources using OpenTofu.

## Workspace Management
We use Terraform workspaces for environment isolation:

```bash
# List workspaces
tofu workspace list

# Create new workspace
tofu workspace new dev
tofu workspace new prod

# Select workspace
tofu workspace select dev
```

## Variable Handling
Variables are managed through multiple files:

1. **variables.tf** - Base variables with validation
2. **providers/*.tf** - Provider-specific configurations
3. **Vault Integration** - Production secrets from HashiCorp Vault

### Variable Precedence
1. Workspace-specific auto.tfvars
2. terraform.tfvars
3. Variable defaults

Example variable structure:
```hcl
variable "proxmox_url" {
  type        = string
  description = "Proxmox endpoint (Vault: kv/Monorepo-AI-Powered/${terraform.workspace}/proxmox/url)"
  default     = "http://dev-pve.local"
}
```

## Secret Management
Production secrets are retrieved from Vault:
```hcl
data "vault_generic_secret" "proxmox" {
  count = var.environment == "prod" ? 1 : 0
  path  = "kv/Monorepo-AI-Powered/${var.environment}/proxmox"
}
```

## Provider Configuration
Providers are configured with workspace-aware settings:
```hcl
provider "proxmox" {
  pm_api_url          = var.environment == "prod" ? data.vault_generic_secret.proxmox[0].data["url"] : var.proxmox_url
  pm_api_token_id     = var.environment == "prod" ? data.vault_generic_secret.proxmox[0].data["user"] : "terraform@pve"
  pm_api_token_secret = var.environment == "prod" ? data.vault_generic_secret.proxmox[0].data["api-key"] : var.proxmox_api_key
}
```

## Common Commands
```bash
# Initialize workspace
tofu init

# Plan changes
tofu plan -var-file=environments/${terraform.workspace}.tfvars

# Apply changes
tofu apply -var-file=environments/${terraform.workspace}.tfvars

# Destroy resources
tofu destroy -var-file=environments/${terraform.workspace}.tfvars
```

## Best Practices
1. Always validate variables using the `validation` block
2. Mark sensitive variables with `sensitive = true`
3. Store production secrets in Vault following `kv/REPO_NAME/env/secret-key` format
4. Update module READMEs when making changes