# OpenTofu Infrastructure

## TL;DR
**Vault Integration**:  
The `vault/kv_engine` module provides environment-isolated secrets storage.  
[Detailed Vault KV Documentation](./modules/vault/kv_engine/README.md)

```hcl
module "vault_kv_prod" {
  source    = "./modules/vault/kv_engine"
  repo_name = "monorepo-ai"
  env_name  = "prod"
}
```
```

**Vault SSH Secrets Engine Integration**:
The `vault-ssh-engine` module configures HashiCorp Vault to act as an SSH Certificate Authority (CA). This allows for secure, short-lived SSH credentials.
[Detailed Vault SSH Engine Documentation](./modules/vault-ssh-engine/README.md)

```hcl
module "vault_ssh_dev" {
  source    = "./modules/vault-ssh-engine"
  repo_name = "your-repo-name"    // e.g., "monorepo-ai"
  env_name  = "dev"                 // e.g., "prod", "staging"
  // Optional: customize TTLs, allowed users/groups, etc.
}

// Example: Provisioning a VM and trusting the Vault SSH CA
module "dev_server" {
  source = "./modules/compute/proxmox/ubuntu-vm"
  // ... other VM configuration ...
  vault_ssh_ca_public_key_pem = module.vault_ssh_dev.ca_public_key_pem
}
```

When a VM is provisioned using a module like `compute/proxmox/ubuntu-vm` and the `vault_ssh_ca_public_key_pem` input is provided (as shown above), cloud-init on the host will:
1. Write the CA public key to `/etc/ssh/vault_ssh_ca.pem`.
2. Configure the SSH daemon (`sshd`) by adding `TrustedUserCAKeys /etc/ssh/vault_ssh_ca.pem` to a configuration file (e.g., `/etc/ssh/sshd_config.d/vault_ca.conf`).
This makes the host trust SSH certificates signed by this Vault CA.

## Key Modules
| Module | Purpose | Docs |
|--------|---------|------|
| `vault/kv_engine` | Centralized secrets management | [Readme](./modules/vault/kv_engine/README.md) |
| `vault-ssh-engine` | SSH Certificate Authority via Vault | [Readme](./modules/vault-ssh-engine/README.md) |
| `compute/proxmox/ubuntu-vm` | VM provisioning | - |
| `helpers/get_repo_name` | Repository identification | - |
| **PostgreSQL Backend** | State storage using PostgreSQL | - |

## PostgreSQL Backend

This OpenTofu configuration utilizes a PostgreSQL database for storing the state file. This provides a centralized and robust backend for managing the state of your infrastructure.

To connect OpenTofu to the PostgreSQL backend, you need to set the `PG_CONN_STR` environment variable with the appropriate connection string. The format is as follows:

```bash
export PG_CONN_STR="postgresql://[user]:[password]@[host]:[port]/[database]"
```

**Important:** Ensure that the password in the connection string is **URL-encoded**, especially if it contains special characters. Replace `[user]`, `[password]`, `[host]`, `[port]`, and `[database]` with your actual database credentials and connection details.

Example (with a placeholder for the URL-encoded password):

```bash
export PG_CONN_STR="postgresql://postgres.nkzfridgknbnrzbqgmrz:YOUR_URL_ENCODED_PASSWORD@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=disable"
```

This connection string allows OpenTofu to interact with the PostgreSQL database on Supabase to store and retrieve the state of your infrastructure managed by this OpenTofu project.