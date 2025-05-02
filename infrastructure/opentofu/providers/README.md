# Providers Directory

This directory contains documentation and version policies for infrastructure providers. Provider configurations are declared in root Terraform files (`versions.tf`/`providers.tf`).

## Provider Management

1. **Version Locking**: Specify exact versions in `versions.tf` using `version = "x.y.z"`
2. **Documentation**: Create a markdown file in the provider's subdirectory
3. **Updates**: Use `tofu init -upgrade` and test before committing version changes

## Current Providers

- HashiCorp Vault (`= 4.8.0`) - Configured in [versions.tf](../versions.tf)