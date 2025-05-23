#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Required environment variables:
# VAULT_ADDR: Address of the Vault server (e.g., http://127.0.0.1:8200)
# VAULT_TOKEN: Vault token for authentication
# Define the specific KV path for the jump host SSH key pair
SSH_HOST_KEY_KV_PATH="kv-root/data/ssh_keys/jumphost_homeserver"

# Check if required environment variables are set
if [ -z "$VAULT_ADDR" ] || [ -z "$VAULT_TOKEN" ]; then
  echo "Error: Required environment variables VAULT_ADDR and VAULT_TOKEN must be set."
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


echo "Discovering and fetching Vault SSH CA public keys..."

# Initialize the trusted CA keys file
TRUSTED_CA_KEYS_FILE="/etc/ssh/trusted-user-ca-keys/vault_cas.pub"
mkdir -p "$(dirname "$TRUSTED_CA_KEYS_FILE")"
> "$TRUSTED_CA_KEYS_FILE" # Clear the file before adding new keys

# Fetch all mounted secret engines
echo "Querying Vault for mounted secret engines from $VAULT_ADDR/v1/sys/mounts"
MOUNT_POINTS=$(curl -sL \
  --header "X-Vault-Token: $VAULT_TOKEN" \
  "$VAULT_ADDR/v1/sys/mounts" | jq -r 'keys[]')

SSH_CA_FOUND=0

# Iterate over mount points and check if they are SSH secret engines
for MOUNT_POINT in $MOUNT_POINTS; do
  ENGINE_TYPE=$(curl -sL \
    --header "X-Vault-Token: $VAULT_TOKEN" \
    "$VAULT_ADDR/v1/sys/mounts/$MOUNT_POINT" | jq -r '.type')

  if [ "$ENGINE_TYPE" = "ssh" ]; then
    echo "Found SSH secrets engine at: $MOUNT_POINT"
    SSH_CA_FOUND=1
    
    # Fetch Vault SSH CA public key for this engine
    VAULT_CA_PUBLIC_KEY=$(curl -sL \
      --header "X-Vault-Token: $VAULT_TOKEN" \
      "$VAULT_ADDR/v1/$MOUNT_POINT/config/ca" | jq -r '.data.public_key')

    if [ -z "$VAULT_CA_PUBLIC_KEY" ] || [ "$VAULT_CA_PUBLIC_KEY" = "null" ]; then
      echo "Warning: Could not fetch Vault CA public key for $MOUNT_POINT. Skipping."
    else
      echo "Successfully fetched CA public key for $MOUNT_POINT. Appending to $TRUSTED_CA_KEYS_FILE"
      echo "$VAULT_CA_PUBLIC_KEY" >> "$TRUSTED_CA_KEYS_FILE"
    fi
  fi
done

if [ "$SSH_CA_FOUND" -eq 0 ]; then
  echo "Error: No SSH secrets engines found in Vault. Please ensure at least one SSH engine is configured."
  exit 1
fi

echo "Configuring SSH server..."
# Write the fetched host keys to the correct location
echo "$VAULT_HOST_PRIVATE_KEY" > /etc/ssh/ssh_host_rsa_key
echo "$VAULT_HOST_PUBLIC_KEY" > /etc/ssh/ssh_host_rsa_key.pub

# Set correct permissions for the private key
chmod 600 /etc/ssh/ssh_host_rsa_key

# Configure sshd_config to use the fetched host key and trust the CA key
# Ensure these lines are not duplicated if they exist
if ! grep -q "HostKey /etc/ssh/ssh_host_rsa_key" /etc/ssh/sshd_config; then
  echo "HostKey /etc/ssh/ssh_host_rsa_key" >> /etc/ssh/sshd_config
fi

# Update TrustedUserCAKeys to point to the new consolidated file
if grep -q "TrustedUserCAKeys" /etc/ssh/sshd_config; then
  sed -i "s|^TrustedUserCAKeys.*|TrustedUserCAKeys $TRUSTED_CA_KEYS_FILE|" /etc/ssh/sshd_config
else
  echo "TrustedUserCAKeys $TRUSTED_CA_KEYS_FILE" >> /etc/ssh/sshd_config
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