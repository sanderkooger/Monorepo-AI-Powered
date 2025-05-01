output "proxmox_secret_path" {
  value       = vault_kv_secret_v2.proxmox_api_key.path
  description = "Vault path for Proxmox API credentials"
}

output "admin_policy_name" {
  value       = vault_policy.admin.name
  description = "Name of admin policy for audit purposes"
}