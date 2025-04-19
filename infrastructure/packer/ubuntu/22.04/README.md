# Packer Configuration: Ubuntu 22.04 LTS for Proxmox

This directory contains the Packer configuration files to build a Ubuntu 22.04 LTS (Jammy Jellyfish) cloud-init ready template for Proxmox VE.

## Prerequisites

1.  **Packer:** Ensure Packer is installed locally. ([Installation Guide](https://developer.hashicorp.com/packer/downloads))
2.  **Proxmox Access:** You need network access to your Proxmox API endpoint and valid API credentials (Token ID and Secret).
3.  **Proxmox Environment:**
    *   A Proxmox node where the build VM can run.
    *   A storage pool accessible by the node (default: `local-lvm`).
    *   A network bridge configured (default: `vmbr0`).
    *   The Ubuntu 22.04 Server ISO will be downloaded by Packer (or use a local path if preferred).

## Configuration

Key configuration options are defined in `variables.pkr.hcl`. You can override these using:

1.  **Environment Variables:** Prefix the variable name with `PKR_VAR_` (e.g., `export PKR_VAR_proxmox_api_token_secret="your-secret"`). This is recommended for sensitive values like API tokens and SSH keys.
2.  **`.pkrvars.hcl` file:** Create a file (e.g., `my-secrets.auto.pkrvars.hcl`) with variable assignments. Packer automatically loads files ending in `.auto.pkrvars.hcl`.
3.  **Command Line:** Use the `-var` flag (e.g., `packer build -var 'proxmox_node=pve-node-2' .`).

**Required Variables (Set via Env Vars or `.auto.pkrvars.hcl`):**

*   `proxmox_api_url`: URL of your Proxmox API.
*   `proxmox_api_token_id`: Your Proxmox API Token ID.
*   `proxmox_api_token_secret`: Your Proxmox API Token Secret.
*   `proxmox_node`: The target Proxmox node name.
*   `ssh_public_key`: Your public SSH key to install for the default `ubuntu` user.

**Optional Variables (Defaults provided):**

Refer to `variables.pkr.hcl` for other configurable options like VM resources, template name, ISO URL/checksum, etc.

## Building the Template

1.  **Navigate:** Change directory to `infrastructure/packer/ubuntu/22.04/`.
2.  **Initialize:** Run `packer init .` to download the required Proxmox plugin.
3.  **Validate:** Run `packer validate .` to check the configuration syntax.
4.  **Build:** Run `packer build .` (ensure required variables are set via environment or `.auto.pkrvars.hcl` files).

Packer will:
*   Connect to your Proxmox API.
*   Download the Ubuntu ISO (if not cached).
*   Create a temporary VM.
*   Perform an automated Ubuntu installation using cloud-init (`http/user-data`, `http/meta-data`).
*   Run provisioning steps defined in `ubuntu-22.04.pkr.hcl` (updates, cleanup, etc.).
*   Convert the VM into a Proxmox template named according to the `template_name` variable.

## Using the Template

Once the build is complete, you can find the new template in your Proxmox UI under the specified node and storage pool. You can then clone this template to create new Ubuntu 22.04 VMs. Remember to configure cloud-init settings (like user data, network config) when cloning or starting the new VM.