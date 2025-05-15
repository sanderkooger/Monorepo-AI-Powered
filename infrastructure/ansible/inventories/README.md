# Dynamic Inventory for Ansible using OpenTofu State

This directory contains a dynamic inventory script (`dynamic_inventory.py`) that generates an Ansible inventory by executing `tofu show -json` and reading its JSON output.

The script extracts `ansible_host` resources from the OpenTofu state, using the `name` attribute (which is the VM's IP address) as the Ansible host name. It also includes any `groups` and `variables` defined for the `ansible_host` resource in the OpenTofu configuration.

By default, the `ansible_user` is set to `ansible`, as configured in the cloud-init script for the Ubuntu VMs.

## Prerequisites

*   OpenTofu installed and configured to manage your infrastructure.
*   Ansible installed.
*   Python 3 installed.
*   Access to your Vault server with permissions to read the SSH secrets engine (for SSH authentication).

## Usage

1.  Ensure you have run `tofu apply` at least once in your OpenTofu project to create the state file that the script will read.
2.  Navigate to your Ansible project directory (`infrastructure/ansible`).
3.  Run your Ansible playbooks as usual. Ansible will automatically execute the `dynamic_inventory.py` script to get the inventory.

    ```bash
    ansible-playbook playbooks/update_apt.yml
    ```

    or for the Nginx playbook:

    ```bash
    ansible-playbook playbooks/install_nginx.yml
    ```

    The script will automatically navigate to the `infrastructure/opentofu` directory to run `tofu show -json`.

## Vault SSH Integration

Your OpenTofu configuration sets up the VMs to trust a Vault SSH Certificate Authority (CA). The dynamic inventory script includes the `vault_ssh_ca` variable for each host, which contains the path to the SSH secrets engine in Vault (e.g., `Monorepo-AI-Powered-prod/ssh`).

To connect to the hosts using Vault-issued SSH certificates, you need to configure Ansible to use the `community.hashi_vault.vault_ssh_certificate` connection plugin or manage the certificate retrieval manually.

A common approach is to configure Ansible to use the Vault SSH connection plugin. This typically involves:

1.  Installing the `community.hashi_vault` collection:
    ```bash
    ansible-galaxy collection install community.hashi_vault
    ```
2.  Configuring Ansible (e.g., in `ansible.cfg` or environment variables) to use the Vault connection plugin and provide necessary Vault authentication details (e.g., `VAULT_ADDR`, `VAULT_TOKEN` or AppRole credentials).

    Example `ansible.cfg` snippet (the `inventory` path is already set):

    ```ini
    [defaults]
    inventory = inventories/dynamic_inventory.py # Already configured

    [ssh_connection]
    control_path = %(directory)s/%%h-%%p-%%r
    ansible_ssh_common_args = '-o StrictHostKeyChecking=no' # Use with caution in production
    ```

    Example environment variables:

    ```bash
    export VAULT_ADDR='http://127.0.0.1:8200' # Replace with your Vault address
    export VAULT_TOKEN='your_vault_token' # Replace with your Vault token or use another auth method
    ```

    With the `community.hashi_vault` collection installed and Vault authentication configured, Ansible should automatically use the `vault_ssh_ca` variable from the dynamic inventory to request an SSH certificate from Vault for each host.

Remember to replace placeholder paths and Vault details with your actual configuration.