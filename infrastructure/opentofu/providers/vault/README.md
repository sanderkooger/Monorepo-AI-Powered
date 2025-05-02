# Vault Provider Configuration

## Overview
Terraform configuration for HashiCorp Vault provider integration

## Authentication
- Uses token-based authentication
- Requires environment variables:
  - `VAULT_ADDR`: Vault server URL
  - `VAULT_TOKEN`: Authentication token

## Usage
```hcl
module "vault" {
  source = "./providers/vault"
}