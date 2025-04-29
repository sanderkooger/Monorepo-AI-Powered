--------------------------------------------------
# Architectural Decision 001: Split Proxmox Provider Configuration

## Context
Initially, the Proxmox provider configuration—including variable declarations (proxmox_url and proxmox_api_key) and the provider block—was included within "infrastructure/opentofu/main.tf".

## Decision
To improve modularity and maintainability, the Proxmox provider configuration has been separated into its own file "infrastructure/opentofu/proxmox.tf". This new file groups all related variables and the provider block under a clear header ("## Proxmox Configuration") and references secrets stored in Vault.
- The variable "proxmox_url" retrieves its value from the Vault path "kv/Monorepo-AI-Powered/prod/proxmox/url".
- The variable "proxmox_api_key" retrieves its value from the Vault path "kv/Monorepo-AI-Powered/prod/proxmox/api-key".
- The Proxmox provider block uses these variables accordingly.

## Consequences
- Improved file organization and separation of concerns.
- Easier maintenance and testing of the provider configuration.
- Clarity in the use of secure secrets from Vault without hard-coding sensitive data.
--------------------------------------------------