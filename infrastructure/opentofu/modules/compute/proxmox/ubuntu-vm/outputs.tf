output "vm_id" {
  description = "ID of the created Proxmox VM"
  value       = proxmox_virtual_environment_vm.ubuntu_vm.id
}

output "ipv4_address" {
  description = "Primary IPv4 address of the VM"
  value       = var.ip_address
}

output "ubuntu_vm_password" {
  value     = random_password.ubuntu_vm_password.result
  sensitive = true
}
