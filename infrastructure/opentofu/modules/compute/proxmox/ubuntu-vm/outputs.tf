output "vm_id" {
  description = "ID of the created Proxmox VM"
  value       = proxmox_virtual_environment_vm.ubuntu_vm.id
}

output "ipv4_address" {
  description = "Primary IPv4 address of the VM"
  value       = proxmox_virtual_environment_vm.ubuntu_vm.ipv4_addresses[0][0]
}

output "ubuntu_vm_password" {
  value     = random_password.ubuntu_vm_password.result
  sensitive = true
}

output "ubuntu_vm_private_key" {
  value     = tls_private_key.ubuntu_vm_key.private_key_pem
  sensitive = true
}

output "ubuntu_vm_public_key" {
  value = tls_private_key.ubuntu_vm_key.public_key_openssh
}