# Ansible Infrastructure Management

## Featured Plugins
- [Vault SSH Signer Connection Plugin](../docs/plugins/vault_ssh_signer.md) - Secure SSH access using HashiCorp Vault-signed certificates

## Certificate Management
Automated SSH certificate signing via HashiCorp Vault:
- Zero-touch certificate renewal before expiration
- Principal-based access control
- Configurable minimum TTL (default: 1 hour)
- Integrated with Ansible connection lifecycle

See full documentation: [Vault SSH Signer Guide](../docs/plugins/vault_ssh_signer.md)

## Core Playbooks
- `security.yml`: Applies system hardening and certificate management
- `nginx.yml`: Configures web servers with TLS termination
- `site.yml`: Master playbook for full environment provisioning

## Requirements
- HashiCorp Vault 1.12+ with SSH Secrets Engine enabled
- Ansible 2.10+ with vault_ssh_signer connection plugin
- Vault CLI configured on Ansible controller
- SSH key pair (`id_rsa` + `id_rsa.pub`) in user's ~/.ssh
## Linting

`ansible-lint` is used to check Ansible playbooks, roles, and collections for syntax errors, best practices, and potential issues.

To run the linter, use the following command from the `infrastructure/ansible` directory:

```bash
pnpm lint
```

The linting rules are configured in the [`infrastructure/ansible/.ansible-lint`](infrastructure/ansible/.ansible-lint) file.