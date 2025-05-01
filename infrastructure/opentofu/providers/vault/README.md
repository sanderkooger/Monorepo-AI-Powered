# Vault Provider Module

## Overview
Manages Vault provider configuration and shared resources according to our secret management standards.

## Secret Path Convention
All secrets follow: `kv/${var.repo_name}/${var.environment}/<secret-name>`

## Inputs
- `vault_addr`: Vault server address
- `vault_token`: Initial root token for bootstrap
- `repo_name`: From root variables
- `environment`: Deployment environment (dev/accept/prod)

## Outputs
- `proxmox_secret_path`: Path to Proxmox API credentials
- `admin_policy_name`: Admin policy name for audit trails