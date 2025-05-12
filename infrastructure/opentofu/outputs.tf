



output "ubuntu_test_vm_ansible_host_data" {
  description = "Structured data for Ansible inventory for ubuntu-test-1, including instance name, IP, FQDN, and tags."
  value       = module.ubuntu_test_vm-1.ansible_host_data
  sensitive   = true
}

output "ubuntu_test_vm_vault_role_id" {
  description = "The Vault AppRole RoleID for the ubuntu-test-1 VM."
  value       = module.ubuntu_test_vm-1.vault_role_id
  sensitive   = true
}
