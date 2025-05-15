output "ca_public_key_pem" {
  description = "The public key (PEM format) of the SSH Certificate Authority."
  value       = vault_ssh_secret_backend_ca.ca.public_key
  sensitive   = false # Public key is not sensitive
}

output "ssh_engine_signing_role_ansible" {
  description = "SSH signing role path."
  value       = vault_ssh_secret_backend_role.default_role.id
}