output "ca_public_key_pem" {
  description = "The public key (PEM format) of the SSH Certificate Authority."
  value       = vault_ssh_secret_backend_ca.ca.public_key
  sensitive   = false # Public key is not sensitive
}

output "ssh_engine_path" {
  description = "The full path where the SSH secrets engine is enabled."
  value       = vault_mount.ssh_engine.path
}