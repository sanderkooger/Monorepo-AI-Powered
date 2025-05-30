#!/bin/bash
set -e  # Exit immediately on error

# Clean existing environment
# Deactivate virtual environment if active
if [ -n "$VIRTUAL_ENV" ] && [ "$VIRTUAL_ENV" == "$(pwd)/.venv" ]; then
  echo "Deactivating existing project virtual environment..."
  deactivate || { echo "Error: Failed to deactivate virtual environment. Attempting manual cleanup."; unset VIRTUAL_ENV; }
fi
rm -rf .venv

# Create fresh environment
python3 -m venv .venv
source .venv/bin/activate

# Ensure pip is up-to-date
python3 -m pip install -U pip

# Install requirements
python3 -m pip install -r requirements.txt

# Install ansible-galaxy roles

ansible-galaxy role install -r requirements.yml

# Verify installation
echo -e "\nVirtual environment ready. Installed packages:"