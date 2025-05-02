# OpenTofu Proxmox Deployment Structure

## Directory Organization
```
deployments/
├── proxmox-cluster/    # Proxmox cluster deployment
│   ├── main.tf         # Proxmox resource definitions
│   ├── variables.tf    # Input variables
│   └── outputs.tf      # Cluster outputs
└── README.md           # This file
```

## Vault Integration for Proxmox
1. Create `vault.hcl` in root:
```hcl
# infrastructure/opentofu/vault.hcl
data "vault_generic_secret" "proxmox" {
  path = "kv/Monorepo-AI-Powered/proxmox-${var.environment}"
}

variable "environment" {
  description = "Deployment environment (dev/stage/prod)"
  type        = string
}
```

2. Proxmox configuration example:
```hcl
# proxmox-cluster/main.tf
provider "proxmox" {
  api_url  = data.vault_generic_secret.proxmox.data["api_url"]
  username = data.vault_generic_secret.proxmox.data["user"]
  password = data.vault_generic_secret.proxmox.data["password"]
}

resource "proxmox_vm_qemu" "k8s_node" {
  name        = "node-${var.environment}-${count.index}"
  target_node = data.vault_generic_secret.proxmox.data["target_host"]
  clone       = "ubuntu-2204-template"
  cores       = 4
  memory      = 8192
}
```

## Workflow
```bash
# Initialize with environment
export TF_VAR_environment=dev

# Apply Proxmox configuration
tofu -chdir=proxmox-cluster init -backend-config=../../backend.hcl
tofu -chdir=proxmox-cluster apply
```

## State Management
```hcl
# backend.hcl (root level)
storage "s3" {
  bucket = "tofu-state"
  key    = "deployments/${path_relative_to_include()}/terraform.tfstate"
}
```

## Secret Management
Store these in Vault at `kv/Monorepo-AI-Powered/proxmox-<env>`:
- api_url: Proxmox API endpoint
- user: API user
- password: API token
- target_host: Proxmox hostname