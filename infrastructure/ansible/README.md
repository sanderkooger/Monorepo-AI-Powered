# Ansible Infrastructure Automation

## Overview
Modular Ansible configuration for provisioning:
- NGINX web servers with role-based configuration
- HashiCorp Vault integration for secret management

```mermaid
graph LR
    A[Local Dev] -->|setup-local-dev.yml| B[Proxmox VMs]
    B --> C[Dynamic Inventory]
    C --> D[NGINX Role]
    D --> E[Vault KV Secrets]
```

## Prerequisites
- Python 3.12.3 with virtualenv
- Ansible 8.5+
- Proxmox API access
- Vault token with write access to KV engine

## Virtual Environment Setup

1. Install direnv:
```bash
curl -sfL https://direnv.net/install.sh | bash
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
```

2. Run setup:
```bash
cd infrastructure/ansible
direnv allow  # Approve the .envrc
./setup-venv.sh
```

The virtual environment will auto-activate when entering the directory. To verify:
```bash
which python  # Should show .venv/bin/python
```

## Common Commands
```bash
npm run setup  # Reinstall dependencies
npm start     # Run test ping to 192.168.1.10
```

## Key Components


### Vault Integration
**Secret Path Structure**:
```bash
kv-${repo_name}-${env_name}/ansible/{collection}
# Example: kv-monorepo-prod/ansible/database_creds
```

**Configuration**:
1. Source from OpenTofu outputs:
```yaml
# ansible.cfg
[vault]
address = "{{ vault_addr }}"
role_id = "{{ vault_approle_id }}"
secret_id = "{{ vault_secret_id }}"
```

2. Secret retrieval example:
```yaml
- name: Get database credentials
  ansible.builtin.uri:
    url: "{{ vault_addr }}/v1/kv/data/ansible/database_creds"
    method: GET
    headers:
      X-Vault-Token: "{{ vault_token }}"
  register: secret_result
```

**Policy Requirements**:
- AppRole: `ansible-${repo_name}-${env_name}`
- Policy: `service-${repo_name}-${env_name}`

### SSH Certificate Authority (CA) Integration with Vault

Hosts provisioned using the updated OpenTofu modules (which configure `TrustedUserCAKeys` via cloud-init) will automatically trust SSH certificates issued by the HashiCorp Vault SSH Secrets Engine.

This integration enables a shift away from static SSH key pairs for Ansible and user access, enhancing security through short-lived certificates.

**Connecting with a Vault-issued SSH Certificate:**

To connect to a host that trusts the Vault SSH CA, Ansible (or a user) needs to:
1. Authenticate to Vault.
2. Request an SSH certificate from the appropriate SSH secrets engine path (e.g., `your-repo-name-dev/ssh/sign/your_role`).
   Vault will sign the user's provided public SSH key and return a short-lived certificate.
3. Use the obtained certificate along with the corresponding private key to SSH into the target host.

The specific Ansible configuration for using Vault-issued certificates (e.g., using `ansible_ssh_private_key_file` to point to the certificate and private key, or leveraging helper scripts/plugins) will be detailed in further documentation and playbook examples.

### Playbook Structure
Entrypoint for local provisioning:
```yaml
# setup-local-dev.yml
- hosts: localhost
  roles:
    - nginx
```

## Troubleshooting
| Issue | Solution |
|-------|----------|
| Inventory connection failed | Verify Proxmox API credentials in `ansible.cfg` |
| Vault permission denied | Renew token with `kv-secrets/write` policy |

## Architectural Decisions
- [20250509-secret-management.md](../docs/architecture/decisions/20250509-secret-management.md) (Unified Vault strategy)