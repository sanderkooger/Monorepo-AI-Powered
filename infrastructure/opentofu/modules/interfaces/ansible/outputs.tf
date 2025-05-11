output "ansible_host_data" {
  description = "A structured object containing all relevant data for an Ansible inventory host."
  value       = local.ansible_inventory_host_data
  sensitive   = true # Marking as sensitive because it contains ansible_public_key
                     # and potentially other sensitive details in the future.
}