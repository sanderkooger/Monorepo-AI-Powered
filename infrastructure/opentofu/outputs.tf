





output "ubuntu_test_vm_vault_role_id" {
  description = "The Vault AppRole RoleID for the ubuntu-test-1 VM."
  value       = module.ubuntu_test_vm-1.vault_role_id
  sensitive   = true
}
