#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Checking Development Environment Setup ---"

# --- Helper Functions ---
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

install_ansible_debian() {
  echo "Attempting to install Ansible using apt..."
  sudo apt-get update -qq
  sudo apt-get install -y ansible python3-pip software-properties-common
  # Consider using PPA for newer Ansible versions if needed:
  # sudo add-apt-repository --yes --update ppa:ansible/ansible
  # sudo apt-get install -y ansible
  echo "Ansible installed via apt."
}

install_ansible_macos() {
  if ! command_exists brew; then
    echo "Homebrew not found. Please install Homebrew first: https://brew.sh/"
    exit 1
  fi
  echo "Attempting to install Ansible using Homebrew..."
  brew update > /dev/null # Update silently in background
  brew install ansible
  echo "Ansible installed via Homebrew."
}

# --- Check/Install Ansible ---
echo "[1/2] Checking Ansible installation..."
if command_exists ansible; then
  echo "Ansible is already installed: $(ansible --version | head -n 1)"
else
  echo "Ansible not found."
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Check if Debian-based
    if [ -f /etc/debian_version ]; then
      install_ansible_debian
    else
      echo "Unsupported Linux distribution for automatic Ansible installation."
      echo "Please install Ansible manually: https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html"
      exit 1
    fi
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    install_ansible_macos
  else
    echo "Unsupported operating system: $OSTYPE"
    echo "Please install Ansible manually: https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html"
    exit 1
  fi

  # Verify installation
  if ! command_exists ansible; then
     echo "ERROR: Ansible installation failed."
     exit 1
  fi
   echo "Ansible successfully installed: $(ansible --version | head -n 1)"
fi

# --- Run Ansible Playbook ---
echo "[2/2] Running Ansible playbook to install other tools (Packer, OpenTofu, Node.js, etc.)..."
# Get the directory of the script itself
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
REPO_ROOT=$(dirname "$SCRIPT_DIR") # Assumes script is in REPO_ROOT/scripts/
PLAYBOOK_PATH="$REPO_ROOT/infrastructure/ansible/playbooks/setup-local-dev.yml"

if [ ! -f "$PLAYBOOK_PATH" ]; then
    echo "ERROR: Playbook not found at $PLAYBOOK_PATH"
    exit 1
fi

# Execute playbook from the repository root
cd "$REPO_ROOT" 
ansible-playbook "$PLAYBOOK_PATH" -K # Ask for become (sudo) password

echo "--- Development Environment Setup Complete ---"
echo "Tools like Packer, OpenTofu, Node.js, and pnpm should now be available."

exit 0