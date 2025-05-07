output "vm_id" {
  description = "ID of the created Proxmox VM"
  value       = proxmox_virtual_environment_vm.ubuntu_vm.id
}



output "ubuntu_vm_password" {
  value     = random_password.ubuntu_vm_password.result
  sensitive = true
}
