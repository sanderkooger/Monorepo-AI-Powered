# Vault SSH Secrets Engine OpenTofu Module

This module configures HashiCorp Vault's SSH secrets engine to act as a Certificate Authority (CA). It allows for the generation of signed SSH certificates for users.

## Features

- Enables the SSH secrets engine at a dynamic path based on `reponame` and `environment`.
- Configures the engine as an SSH CA, with Vault managing the signing key pair.
- Creates a configurable role for issuing user certificates.
- Outputs the CA's public key.

## Usage

```hcl
module "vault_ssh_engine" {
  source      = "./modules/vault-ssh-engine" # Or path to this module

  reponame    = "my-application"
  environment = "dev"

  # Optional: Customize role settings
  role_name     = "developers"
  allowed_users = ["ubuntu", "dev_user"]
  ttl           = "1h"
  max_ttl       = "8h"
}

# Example: Output the CA public key
output "ssh_ca_public_key" {
  description = "The SSH CA public key from the Vault module."
  value       = module.vault_ssh_engine.ca_public_key_pem
}
```

## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.0 |
| <a name="requirement_vault"></a> [vault](#requirement\_vault) | ~> 3.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_vault"></a> [vault](#provider\_vault) | ~> 3.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [vault_ssh_secret_backend.ssh_engine](https://registry.terraform.io/providers/hashicorp/vault/latest/docs/resources/ssh_secret_backend) | resource |
| [vault_ssh_secret_backend_ca.ca](https://registry.terraform.io/providers/hashicorp/vault/latest/docs/resources/ssh_secret_backend_ca) | resource |
| [vault_ssh_secret_backend_role.default_role](https://registry.terraform.io/providers/hashicorp/vault/latest/docs/resources/ssh_secret_backend_role) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_reponame"></a> [reponame](#input\_reponame) | The name of the repository, used to construct the Vault path. | `string` | n/a | yes |
| <a name="input_environment"></a> [environment](#input\_environment) | The environment (e.g., dev, staging, prod), used to construct the Vault path. | `string` | n/a | yes |
| <a name="input_role_name"></a> [role\_name](#input\_role\_name) | The name of the SSH role to create. | `string` | `"default-role"` | no |
| <a name="input_allowed_users"></a> [allowed\_users](#input\_allowed\_users) | A list of usernames allowed to request certificates from this role. | `list(string)` | `["ubuntu"]` | no |
| <a name="input_ttl"></a> [ttl](#input\_ttl) | The Time-To-Live for certificates issued by this role. | `string` | `"30m"` | no |
| <a name="input_max_ttl"></a> [max\_ttl](#input\_max\_ttl) | The maximum Time-To-Live for certificates issued by this role. | `string` | `"24h"` | no |
| <a name="input_ssh_engine_path_suffix"></a> [ssh\_engine\_path\_suffix](#input\_ssh\_engine\_path\_suffix) | The suffix for the SSH engine path. | `string` | `"ssh"` | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_ca_public_key_pem"></a> [ca\_public\_key\_pem](#output\_ca\_public\_key\_pem) | The public key (PEM format) of the SSH Certificate Authority. |
| <a name="output_ssh_engine_path"></a> [ssh\_engine\_path](#output\_ssh\_engine\_path) | The full path where the SSH secrets engine is enabled. |

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.