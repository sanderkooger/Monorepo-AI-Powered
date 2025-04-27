#!/bin/bash
set -euo pipefail

usage() {
  echo "Usage: $0 [--token TOKEN] [--user USER --pass PASSWORD] [--role-id ROLE_ID --secret-id SECRET_ID]"
  exit 1
}

# Prompt for input if not provided via flags.
prompt_for_input() {
  local prompt_msg="$1"
  local var
  read -p "$prompt_msg: " var
  echo "$var"
}

# Debug: Check if 'vault' command is available and print its version.
echo "Checking Vault CLI version..."
if ! vault version; then
  echo "Vault CLI not installed or not in PATH."
  exit 1
fi

# Parse arguments.
TOKEN=""
USER=""
PASS=""
ROLE_ID=""
SECRET_ID=""

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --token)
      TOKEN="$2"
      shift 2
      ;;
    --user)
      USER="$2"
      shift 2
      ;;
    --pass)
      PASS="$2"
      shift 2
      ;;
    --role-id)
      ROLE_ID="$2"
      shift 2
      ;;
    --secret-id)
      SECRET_ID="$2"
      shift 2
      ;;
    *)
      usage
      ;;
  esac
done

# Ensure VAULT_ADDR is set; prompt if not.
if [ -z "${VAULT_ADDR:-}" ]; then
  VAULT_ADDR=$(prompt_for_input "VAULT_ADDR is not set. Please enter Vault address (e.g., http://127.0.0.1:8200)")
  export VAULT_ADDR
fi

echo "Using Vault address: $VAULT_ADDR"

# If using HTTPS and VAULT_SKIP_VERIFY is not set, set it to true.
if [[ "$VAULT_ADDR" =~ ^https:// ]]; then
  if [ -z "${VAULT_SKIP_VERIFY:-}" ]; then
    echo "Detected HTTPS endpoint. Setting VAULT_SKIP_VERIFY to true."
    export VAULT_SKIP_VERIFY=true
  fi
fi

# Check Vault connectivity and capture output.
echo "Checking Vault status..."
status_output=$(vault status -format=json 2>&1 || true)
# If output starts with '<', likely HTML.
if [[ "$status_output" =~ ^\< ]]; then
  echo "Received HTML output instead of JSON."
  echo "Please verify that VAULT_ADDR ($VAULT_ADDR) is correct and points to a Vault API endpoint."
  exit 1
fi

# Attempt to parse JSON.
if ! echo "$status_output" | jq . > /dev/null 2>&1; then
  echo "Could not parse Vault status output:"
  echo "$status_output"
  exit 1
fi

# Parse initialization and seal status.
initialized=$(echo "$status_output" | jq -r '.initialized')
sealed=$(echo "$status_output" | jq -r '.sealed')

if [ "$initialized" != "true" ]; then
  echo "Vault is not initialized. Initializing now..."
  init_output=$(vault operator init -key-shares=5 -key-threshold=3 -format=json)
  echo "$init_output" > init.json

  # Ensure unseal_keys_b64 is present.
  KEYS=$(echo "$init_output" | jq -r '.unseal_keys_b64 // empty')
  if [ -z "$KEYS" ]; then
    echo "Error: Initialization output missing unseal_keys_b64. Output:"
    echo "$init_output"
    exit 1
  fi

  ROOT_TOKEN=$(echo "$init_output" | jq -r '.root_token')
  # Read unseal keys into an array.
  mapfile -t UNSEAL_KEYS < <(echo "$init_output" | jq -r '.unseal_keys_b64[]')
  if [ "${#UNSEAL_KEYS[@]}" -lt 3 ]; then
    echo "Error: Expected at least 3 unseal keys, but got ${#UNSEAL_KEYS[@]}."
    exit 1
  fi

  echo "The following unseal keys (in base64) and root token have been generated during initialization:"
  echo "Unseal Keys:"
  for key in "${UNSEAL_KEYS[@]}"; do
    echo "  $key"
  done
  echo "Root Token: $ROOT_TOKEN"
  echo ""
  echo "Please copy and securely store these keys and the root token."
  read -p "Have you copied the unseal keys and root token? (yes/no): " confirmation
  if [ "$confirmation" != "yes" ]; then
    echo "Please copy the keys and run the script again when ready."
    exit 1
  fi

  echo "Beginning unsealing process using stored keys..."
  # Try each stored key from init.json until Vault is unsealed.
  for key in "${UNSEAL_KEYS[@]}"; do
    if [ "$(vault status -format=json | jq -r '.sealed')" = "false" ]; then
      break
    fi
    echo "Attempting unseal with stored key..."
    vault operator unseal "$key" || echo "Stored key failed, trying next key."
  done

  # If still sealed, loop to allow manual key entry.
  while [ "$(vault status -format=json | jq -r '.sealed')" = "true" ]; do
    read -p "Vault still sealed. Enter an unseal key: " manual_key
    vault operator unseal "$manual_key" || echo "Unseal key failed. Please try another key."
  done

  export VAULT_TOKEN="$ROOT_TOKEN"
  echo "Vault initialized and unsealed. Root token exported."
  
  # Remove init.json for security.
  if [ -f init.json ]; then
    rm -f init.json
    echo "Initialization file (init.json) has been removed for security."
  fi

elif [ "$sealed" == "true" ]; then
  echo "Vault is initialized but sealed."
  if [ -f init.json ]; then
    echo "The following unseal keys from init.json may be useful:"
    jq '.unseal_keys_b64' init.json
  else
    echo "No initialization record (init.json) found. Unseal keys are not available."
  fi
  # Loop until Vault is unsealed.
  while [ "$(vault status -format=json | jq -r '.sealed')" = "true" ]; do
    read -p "Enter an unseal key: " user_key
    vault operator unseal "$user_key" || echo "Failed to unseal with that key. Try again."
  done
  echo "Vault is now unsealed."
else
  echo "Vault is initialized and unsealed."
fi

# Authentication: Use provided auth details or prompt interactively.
if [ -n "$TOKEN" ]; then
  export VAULT_TOKEN="$TOKEN"
  echo "Using provided token for authentication."
elif [ -n "$USER" ] && [ -n "$PASS" ]; then
  vault login -method=userpass username="$USER" password="$PASS"
elif [ -n "$ROLE_ID" ] && [ -n "$SECRET_ID" ]; then
  vault login -method=approle role_id="$ROLE_ID" secret_id="$SECRET_ID"
elif [ -z "${VAULT_TOKEN:-}" ]; then
  echo "No authentication method provided."
  echo "Choose authentication method:"
  echo "1: Provide token"
  echo "2: Username/Password (userpass)"
  echo "3: AppRole (role_id/secret_id)"
  read -p "Enter option number [1-3]: " option
  case "$option" in
    1)
      TOKEN=$(prompt_for_input "Enter token")
      export VAULT_TOKEN="$TOKEN"
      ;;
    2)
      USER=$(prompt_for_input "Enter username")
      PASS=$(prompt_for_input "Enter password")
      vault login -method=userpass username="$USER" password="$PASS"
      ;;
    3)
      ROLE_ID=$(prompt_for_input "Enter Role ID")
      SECRET_ID=$(prompt_for_input "Enter Secret ID")
      vault login -method=approle role_id="$ROLE_ID" secret_id="$SECRET_ID"
      ;;
    *)
      echo "Invalid option."
      usage
      ;;
  esac
else
  echo "Using existing VAULT_TOKEN."
fi

# Determine repository name from git top-level directory.
if ! REPO_TOP=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "Not a git repository. Cannot determine repository name."
  exit 1
fi
REPO_NAME=$(basename "$REPO_TOP")
echo "Repository name detected: $REPO_NAME"

# Check if KV engine exists.
if vault secrets list -format=json | jq -e --arg path "kv/${REPO_NAME}/" '.[] | select(.path==$path)' > /dev/null; then
  echo "KV engine at kv/${REPO_NAME} already exists. Skipping enable step."
else
  echo "Enabling KV engine at kv/${REPO_NAME}..."
  kv_output=$(vault secrets enable -path="kv/${REPO_NAME}" kv-v2 2>&1 || true)
  if echo "$kv_output" | grep -qi "path is already in use"; then
    echo "KV engine at kv/${REPO_NAME} already exists. Skipping enable step."
  elif echo "$kv_output" | grep -qi "Success"; then
    echo "KV engine enabled successfully."
  else
    echo "Error enabling KV engine:"
    echo "$kv_output"
    exit 1
  fi
fi

# Create policies directory if it does not exist.
mkdir -p policies

# Check if the policy already exists.
if vault policy read "$REPO_NAME" > /dev/null 2>&1; then
  echo "Policy '$REPO_NAME' already exists. Skipping policy creation."
else
  # Write policy file.
  POLICY_FILE="policies/${REPO_NAME}-policy.hcl"
  cat > "$POLICY_FILE" <<EOF
path "kv/${REPO_NAME}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOF
  echo "Writing policy from $POLICY_FILE..."
  vault policy write "$REPO_NAME" "$POLICY_FILE"
  echo "Policy applied successfully."
fi

echo "Vault bootstrap process complete."