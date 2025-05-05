output "vm_id" {
  description = "ID of the created Proxmox VM"
  value       = proxmox_virtual_environment_vm.ubuntu_test.id
}

output "ipv4_address" {
  description = "Primary IPv4 address of the VM"
  value       = proxmox_virtual_environment_vm.ubuntu_test.ipv4_addresses[0][0]
}