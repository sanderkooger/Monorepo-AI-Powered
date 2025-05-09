# 20250508 Ansible Infrastructure Automation Strategy

## Status
Accepted

## Context
Our infrastructure requires:
- Unified state management across cloud and on-prem resources
- Secure credential handling for privileged operations
- Dynamic host discovery in hybrid environments
- Maintainable automation workflows

## Decision

### Terraform State Integration
- Consume Terraform outputs from `infrastructure/opentofu/outputs.tf`
- Use `terraform output -json` in Ansible playbooks to populate:
  - Network configurations
  - Proxmox VM inventory tags
  - Vault endpoint coordinates

### Vault AppRole Authentication
- Implemented via `ansible.cfg`:
  ```ini
  [defaults]
  vault_password_file = .vault_pass
  ```
- Role-based secrets access through:
  - Environment-specific AppRole IDs
  - Periodic token rotation via `vault_token` module

### Dynamic Inventory
- Utilize existing Python script `infrastructure/ansible/inventory/dynamic_inventory.py`
- Features:
  - AWS EC2 + Proxmox VM tag discovery
  - Group hierarchy based on Terraform workspace
  - Caching with `--refresh-cache` flag

### Playbook Organization
```
ansible/
├── playbooks/
│   ├── base-os.yml       # Base system configuration
│   ├── security.yml      # Hardening tasks
│   └── app-deploy/       # Role-based deployments
└── roles/
    ├── common/
    │   ├── tasks/
    │   └── vars/
    └── vault-integration/
        ├── defaults/
        └── templates/
```

## Consequences

### Positive
- **State Consistency**: Terraform-managed infrastructure truth
- **Security**: Short-lived Vault tokens via AppRole
- **Scalability**: Dynamic inventory handles hybrid environments
- **Maintainability**: Role-based structure enables team collaboration

### Risks
- Requires Terraform state versioning discipline
- Dynamic inventory script needs Python 3.9+ dependencies
- Vault availability critical for playbook execution

## References
1. [Vault KV Strategy](../20250506-vault-kv-strategy.md)
2. Proxmox VM Module Outputs (`infrastructure/opentofu/modules/web_app/main.tf`)

## Integration Diagram
```mermaid
graph TD
  A[Ansible Control Node] -->|Dynamic Inventory| B(Proxmox Cluster)
  A -->|AppRole Auth| C[HashiCorp Vault]
  A -->|State Query| D[Terraform Backend]
  B --> E[VM Group 1]
  B --> F[VM Group 2]
  C -->|Secrets| E
  C -->|Secrets| F
  D -->|Network Topology| A