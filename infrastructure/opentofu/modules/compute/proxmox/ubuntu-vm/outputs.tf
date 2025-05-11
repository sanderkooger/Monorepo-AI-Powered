output "ansible_host_data" {
  description = "Structured data for Ansible inventory, including instance name, IP, FQDN, and tags."
  value       = module.ansible_interface.ansible_host_data
  sensitive   = true # Inherits sensitivity from the ansible_interface module
}

output "vm_name" {
  description = "The full name of the Proxmox VM instance."
  value       = proxmox_virtual_environment_vm.ubuntu_vm.name
}

output "ip_address" {
  description = "The primary IPv4 address of the VM."
  value       = proxmox_virtual_environment_vm.ubuntu_vm.ipv4_addresses[0] # Assuming the first IP is the primary one
}

output "vault_role_id" {
  description = "The Vault AppRole RoleID for this VM."
  value       = vault_approle_auth_backend_role.vm_role.role_id
  sensitive   = true
}
