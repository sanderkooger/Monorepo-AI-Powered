#!/bin/bash
set -e  # Exit immediately on error

# Clean existing environment
# Deactivate virtual environment if active
if [ -n "$VIRTUAL_ENV" ]; then
  deactivate
fi
rm -rf .venv

# Create fresh environment
python3 -m venv .venv
source .venv/bin/activate

# Ensure pip is up-to-date
python3 -m pip install -U pip

# Install requirements
python3 -m pip install -r requirements.txt

# Verify installation
echo -e "\nVirtual environment ready. Installed packages:"
pip list