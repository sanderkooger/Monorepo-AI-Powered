# AI Context: Packer Ubuntu 22.04 Build

## Purpose

This directory contains Packer configuration (`.pkr.hcl`) files for building a Ubuntu 22.04 LTS virtual machine template specifically for Proxmox VE.

## Key Components

*   **`ubuntu-22.04.pkr.hcl`**: The main Packer template defining the build process, including the Proxmox source, provisioning steps (shell), and cloud-init configuration.
*   **`variables.pkr.hcl`**: Defines input variables for the build, such as Proxmox connection details, VM resources, ISO location, and SSH keys. Sensitive variables like API tokens should be provided via environment variables (`PKR_VAR_*`) or `.auto.pkrvars.hcl` files.
*   **`http/`**: Contains `user-data` and `meta-data` files used by cloud-init during the Ubuntu installation for initial system configuration (hostname, default user, SSH keys, package updates).
*   **`scripts/`**: Intended for custom shell scripts used during the provisioning phase (currently empty).
*   **`README.md`**: Provides human-readable instructions on prerequisites, configuration, and how to build the template.

## Build Process Overview

1.  Packer connects to the Proxmox API using provided credentials.
2.  It downloads the specified Ubuntu 22.04 ISO.
3.  A temporary VM is created on the target Proxmox node.
4.  Ubuntu Server is installed automatically using cloud-init, configured via the files served from the `http/` directory.
5.  After installation, Packer connects via SSH to the VM.
6.  Provisioning scripts (currently inline shell commands in the main template) run to update the system, install `qemu-guest-agent`, and perform cleanup.
7.  The VM is shut down and converted into a Proxmox template.

## Related Files/Concepts

*   **Proxmox VE:** The target hypervisor.
*   **Cloud-Init:** Used for unattended OS installation and initial configuration.
*   **Packer:** The tool used to automate the image creation.
*   **`.clinerules`:** Repository-wide standards apply (e.g., commit strategy, documentation).

## Future Considerations

*   Adding more complex provisioning using Ansible roles from `infrastructure/ansible/roles/`.
*   Implementing automated testing of the built template.
*   Parameterizing further for different environments (dev, prod).
*   Adding configurations for other Ubuntu versions (e.g., 24.04) in parallel directories (`infrastructure/packer/ubuntu/24.04/`).