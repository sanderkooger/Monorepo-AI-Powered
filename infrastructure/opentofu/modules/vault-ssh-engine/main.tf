locals {
  # Construct the dynamic path for the SSH secrets engine
  ssh_engine_path_base = format("%s-%s", var.reponame, var.environment)
  ssh_engine_full_path = format("%s/%s", local.ssh_engine_path_base, var.ssh_engine_path_suffix)
}

# Enable the SSH secrets engine at the dynamically constructed path
resource "vault_mount" "ssh_engine" {
  path        = local.ssh_engine_full_path
  type        = "ssh"
  description = "SSH secrets engine for ${local.ssh_engine_path_base}"
  # Default lease TTL and Max lease TTL can be set here if needed
  # default_lease_ttl_seconds = 3600
  # max_lease_ttl_seconds     = 86400
  # Ensure that options specific to vault_ssh_secret_backend are not used here
  # if they are not applicable to vault_mount for type "ssh".
}

# Configure the engine instance to act as an SSH Certificate Authority (CA)
# This resource generates and manages the CA's signing key pair within Vault.
resource "vault_ssh_secret_backend_ca" "ca" {
  backend              = vault_mount.ssh_engine.path
  generate_signing_key = true # Vault generates and manages the key pair
  # private_key and public_key parameters are not set, so Vault generates them.
  # Do not export the private key.
}

# Define a default role for the SSH CA
resource "vault_ssh_secret_backend_role" "default_role" {
  name                    = var.role_name
  backend                 = vault_mount.ssh_engine.path
  key_type                = "ca" # This role uses the CA configured above
  allow_user_certificates = true
  allowed_users           = join(",", var.allowed_users) # Comma-separated string or list
  ttl                     = var.ttl
  max_ttl                 = var.max_ttl

  # Optional: You can add other common parameters here
  # allowed_critical_options = ""
  # allowed_extensions       = ""
  # default_critical_options = {}
  default_extensions       = {
    "permit-pty": "",
    "permit-port-forwarding": "",
    "permit-X11-forwarding": "",
    "permit-agent-forwarding": ""
    }
  # allowed_user_key_configs = [] # For OTP/signed SSH certs
}