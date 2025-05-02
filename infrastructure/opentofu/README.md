# OpenTofu Infrastructure Repository

This repository contains the infrastructure-as-code configuration for our on-premises infrastructure using OpenTofu. The structure is designed to support multiple environments (production, acceptance, and development) while maintaining strict separation of components.

## Repository Structure

```
infrastructure/opentofu/
├── environments/         # Environment-specific configurations
│   ├── prod/             # Production environment
│   ├── accept/           # Acceptance environment
│   └── dev/              # Development environment
├── modules/              # Reusable infrastructure modules
│   ├── network/          # Network-related infrastructure
│   ├── compute/          # Compute resources
│   ├── storage/          # Storage solutions
│   └── database/         # Database systems
├── providers/            # Provider configurations
│   ├── provider.tf       # Global provider configuration
│   └── vault/            # Vault provider configuration
├── main.tf               # Root module configuration
├── variables.tf          # Global variables definition
└── outputs.tf            # Global outputs definition
```

## Getting Started

1. Ensure you have OpenTofu installed and Docker running
2. Use Makefile commands for standardized operations:
   - Initialize: `make init`
   - Validate: `make validate`
   - Plan: `make plan`
   - Apply: `make apply`
   - Destroy: `make destroy`

## Environment Management

OpenTofu workspaces are used for environment isolation. The environment variable follows this format:

- `prod` (default)
- `accept`
- `dev-<username>` (for developer-specific environments)

### Workspace Setup
```bash
# Initialize with default prod workspace
tofu workspace select prod

# Create a developer workspace
tofu workspace new dev-johndoe
tofu apply -var="environment=dev-johndoe"
```

### Environment Validation
The environment variable is strictly validated:
- Must be `prod`, `accept`, or `dev-` followed by lowercase alphanumeric/underscore
- Example valid names: `dev-mary_smith`, `dev-teamalpha`

## Providers

All providers must be defined in the providers directory. A placeholder for the Vault provider is included.

## Development Workflow

1. Work in the dev environment for testing changes:
   ```bash
   export ENV=dev
   make plan
   make apply
   ```
2. Validate configurations using `make validate`
3. Review changes with `make plan` before applying
4. Merge approved changes to the appropriate environment branches