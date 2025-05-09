# 20250509-ansible-terraform-contract.md

## Status
Accepted

## Context
[Existing context about Terraform-Ansible integration...]

## Decision
Implement a strictly typed interface between Terraform and Ansible with this structure:

```hcl
# infrastructure/modules/interfaces/ansible_interface/main.tf
variable "ansible_interface" {
  type = map(object({
    fqdn         = string
    ipv4_address = string
    tags         = list(string)
    cluster = optional(object({
      name = string
      role = string
    }))
    vault_path = string
    proxmox_meta = object({
      vm_id    = number
      node     = string
      template = string
    })
  }))

  validation {
    condition = alltrue([
      for vm in var.ansible_interface : 
        can(regex("^\\d+\\.\\d+\\.\\d+\\.\\d+$", vm.ipv4_address)) &&
        (vm.cluster == null || contains(["primary", "replica"], vm.cluster.role))
    ])
    error_message = "Invalid IP format or cluster role"
  }
}

output "inventory" {
  value = {
    hosts = var.ansible_interface
    clusters = {
      for cluster in distinct([for v in var.ansible_interface : v.cluster.name if v.cluster != null]):
      cluster => {
        members = [for k, v in var.ansible_interface : k if v.cluster.name == cluster]
        vars = {
          vault_path = "clusters/${cluster}"
          type       = split("-", cluster)[0]
        }
      }
    }
  }
}
```

## Implementation
1. Create module structure:
```text
infrastructure/modules/interfaces/ansible_interface/
├── main.tf
├── outputs.tf
└── README.md
```

2. Required VM module integration:
```hcl
output "ansible_interface" {
  value = {
    fqdn         = "${var.instance_name}.${var.env_name}.internal"
    ipv4_address = self.ipv4_address
    tags         = var.additional_roles
    cluster      = var.cluster_config
    vault_path   = "${var.kv_store_path}/${var.instance_name}"
    proxmox_meta = {
      vm_id    = self.vm_id
      node     = self.node_name
      template = basename(var.image_url)
    }
  }
}
```

## Consequences
- Strict type enforcement for all Ansible-bound VMs
- Cluster roles limited to primary/replica
- Inventory script requires Terraform 1.8+