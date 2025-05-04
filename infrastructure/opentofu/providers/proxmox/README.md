# Proxmox Provider Setup

## Requirements
1. Vault secret at `kv/proxmox/data` containing:
   - `api_token`: Proxmox API token (format: USER@REALM!TOKENID=UUID)
   - `ssh_private_key`: SSH private key for node access (PEM format)

2. Required Vault policy:
```hcl
path "kv/data/proxmox/data" {
  capabilities = ["read"]
}
```

3. Configure SSH agent:
```bash
eval $(ssh-agent)
ssh-add ~/.ssh/proxmox_node_key  # Add private key to agent
```

## Implementation Steps
1. Initialize Terraform:
```bash
cd infrastructure/opentofu
tofu init
```

2. Apply configuration:
```bash
tofu apply -var="vault_addr=${VAULT_ADDR}" -var="vault_token=${VAULT_TOKEN}"