#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Required environment variables:
# VAULT_ADDR: Address of the Vault server (e.g., http://127.0.0.1:8200)
# VAULT_TOKEN: Vault token for authentication
# VAULT_SSH_CA_PATH: Path of the Vault SSH secrets engine (e.g., ssh-client-signer)

# Define the specific KV path for the jump host SSH key pair
SSH_HOST_KEY_KV_PATH="kv-root/data/ssh_keys/jumphost_homeserver"

# Check if required environment variables are set
if [ -z "$VAULT_ADDR" ] || [ -z "$VAULT_TOKEN" ] || [ -z "$VAULT_SSH_CA_PATH" ]; then
  echo "Error: Required environment variables VAULT_ADDR, VAULT_TOKEN, and VAULT_SSH_CA_PATH must be set."
  exit 1
fi

echo "Fetching SSH host key from Vault..."
# Fetch SSH host private key from Vault KV
# Assumes the private key is stored under 'priv' field in the KV secret
VAULT_HOST_PRIVATE_KEY=$(curl -s \
  --header "X-Vault-Token: $VAULT_TOKEN" \
  "$VAULT_ADDR/v1/$SSH_HOST_KEY_KV_PATH" | jq -r '.data.data.priv')

if [ -z "$VAULT_HOST_PRIVATE_KEY" ] || [ "$VAULT_HOST_PRIVATE_KEY" = "null" ]; then
  echo "Error: Could not fetch SSH host private key from Vault at $SSH_HOST_KEY_KV_PATH. Check path, token, and secret structure. Expected key name: 'priv'"
  exit 1
fi

echo "Fetching SSH host public key from Vault..."
# Fetch SSH host public key from Vault KV
# Assumes the public key is stored under 'pub' field in the KV secret
VAULT_HOST_PUBLIC_KEY=$(curl -s \
  --header "X-Vault-Token: $VAULT_TOKEN" \
  "$VAULT_ADDR/v1/$SSH_HOST_KEY_KV_PATH" | jq -r '.data.data.pub')

if [ -z "$VAULT_HOST_PUBLIC_KEY" ] || [ "$VAULT_HOST_PUBLIC_KEY" = "null" ]; then
  echo "Error: Could not fetch SSH host public key from Vault at $SSH_HOST_KEY_KV_PATH. Check path, token, and secret structure. Expected key name: 'pub'"
  exit 1
fi


echo "Fetching Vault CA public key..."
# Fetch Vault SSH CA public key
VAULT_CA_PUBLIC_KEY=$(curl -s \
  --header "X-Vault-Token: $VAULT_TOKEN" \
  "$VAULT_ADDR/v1/$VAULT_SSH_CA_PATH/config/ca" | jq -r '.data.public_key')

if [ -z "$VAULT_CA_PUBLIC_KEY" ] || [ "$VAULT_CA_PUBLIC_KEY" = "null" ]; then
  echo "Error: Could not fetch Vault CA public key from Vault at $VAULT_SSH_CA_PATH/config/ca. Check path, token, and SSH engine configuration."
  exit 1
fi

echo "Configuring SSH server..."
# Write the fetched host keys to the correct location
echo "$VAULT_HOST_PRIVATE_KEY" > /etc/ssh/ssh_host_rsa_key
echo "$VAULT_HOST_PUBLIC_KEY" > /etc/ssh/ssh_host_rsa_key.pub

# Set correct permissions for the private key
chmod 600 /etc/ssh/ssh_host_rsa_key

# Write the Vault CA public key to the trusted keys file
echo "$VAULT_CA_PUBLIC_KEY" > /etc/ssh/trusted-user-ca-keys/vault_ca.pub

# Configure sshd_config to use the fetched host key and trust the CA key
# Ensure these lines are not duplicated if they exist
if ! grep -q "HostKey /etc/ssh/ssh_host_rsa_key" /etc/ssh/sshd_config; then
  echo "HostKey /etc/ssh/ssh_host_rsa_key" >> /etc/ssh/sshd_config
fi

if ! grep -q "TrustedUserCAKeys /etc/ssh/trusted-user-ca-keys/vault_ca.pub" /etc/ssh/sshd_config; then
  echo "TrustedUserCAKeys /etc/ssh/trusted-user-ca-keys/vault_ca.pub" >> /etc/ssh/sshd_config
fi

# Disable password authentication (already done in Dockerfile, but double-check)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config || true # Use true to prevent script failure if line not found
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config || true

# Disable root login (already done in Dockerfile, but double-check)
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config || true
sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config || true
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config || true


echo "Starting SSH server..."
# Start the SSH server in the foreground
exec /usr/sbin/sshd -D -e