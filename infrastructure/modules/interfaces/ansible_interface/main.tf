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