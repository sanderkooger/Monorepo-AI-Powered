
output "vm_name" {
  description = "The full name of the Proxmox VM instance."
  value       = proxmox_virtual_environment_vm.ubuntu_vm.name
}

output "ip_address" {
  description = "The primary IPv4 address of the VM."
  value       = proxmox_virtual_environment_vm.ubuntu_vm.ipv4_addresses[1] # Assuming the first IP is the primary one
}

output "vault_role_id" {
  description = "The Vault AppRole RoleID for this VM."
  value       = vault_approle_auth_backend_role.vm_role.role_id
  sensitive   = true
}
