# ADR-00X: Implement HashiCorp Vault SSH Secrets Engine for SSH Certificate Authentication

**Date:** 2025-05-11

**Status:** Accepted

## Context

Currently, SSH access to managed hosts, including access by Ansible, relies on static SSH key pairs. This approach presents several challenges:
*   **Security Risks:** Long-lived private keys, if compromised, provide persistent access. Managing key rotation and revocation can be cumbersome.
*   **Management Overhead:** Distributing and managing authorized public keys across numerous hosts and for multiple users/services is complex.
*   **Limited Auditing:** Tracking SSH access based on static keys can be less granular than desired.
*   **Lack of Short-Lived Credentials:** Static keys do not inherently support the principle of least privilege with time-bound access.

There is a clear need for a more secure, centralized, and manageable solution for SSH authentication that supports short-lived credentials.

## Decision

We will implement the HashiCorp Vault SSH Secrets Engine to act as a Certificate Authority (CA) for SSH authentication.

Key aspects of this implementation include:
1.  **Vault SSH Secrets Engine:** Configure and enable the SSH secrets engine in HashiCorp Vault.
2.  **OpenTofu Management:** Utilize OpenTofu modules to declaratively manage the Vault SSH secrets engine configuration, including roles, policies, and CA setup. A dedicated module (`vault-ssh-engine`) will handle this.
3.  **Path-Based Organization:** Adopt a standardized path structure within Vault for SSH backends, organized by repository name and environment: `[reponame]-[environment]/ssh/`. For example, `monorepo-ai-prod/ssh/`.
4.  **CA Public Key Distribution:** The public key of the Vault SSH CA will be distributed to managed hosts during their provisioning process. This will be achieved by integrating with existing cloud-init configurations in VM provisioning modules (e.g., OpenTofu's `compute/proxmox/ubuntu-vm` module).
5.  **Host Configuration:** Managed hosts will be configured to trust SSH certificates signed by the Vault CA. This involves setting the `TrustedUserCAKeys` option in the `sshd_config` to point to the distributed Vault CA public key (e.g., `/etc/ssh/vault_ssh_ca.pem`).

## Rationale

Adopting the Vault SSH Secrets Engine offers several advantages:
*   **Reduced Attack Surface:** Eliminates the need for long-lived static private keys on user workstations or CI/CD systems. Certificates are short-lived and automatically expire.
*   **Centralized Access Control:** Vault becomes the central point for managing and auditing SSH access. Policies in Vault can define which users/roles can obtain certificates for which hosts.
*   **Short-Lived Credentials:** SSH certificates issued by Vault have a configurable Time-To-Live (TTL), enforcing time-bound access and reducing the risk associated with compromised credentials.
*   **Leverages Existing Infrastructure:** Integrates with our existing OpenTofu for infrastructure-as-code and cloud-init for host bootstrapping, minimizing the need for entirely new tooling.
*   **Scalability and Isolation:** The path-based organization (`[reponame]-[environment]/ssh/`) allows for clear separation of concerns and scaling access control across different projects and environments.
*   **Improved Auditing:** Vault provides detailed audit logs for certificate issuance, offering better visibility into SSH access patterns.

## Consequences

The implementation of Vault SSH Secrets Engine will have the following consequences:
*   **Ansible Integration:** Ansible playbooks and inventory configurations will need to be updated to support SSH authentication using certificates obtained from Vault. This may involve using Vault-aware connection plugins or helper scripts to fetch certificates.
*   **User/Service Workflow Changes:** Users and automated services (e.g., CI/CD pipelines) will need to be configured to request SSH certificates from Vault before attempting to connect to managed hosts. This involves authenticating to Vault and using the `vault ssh` command or API.
*   **Initial Setup Effort:** There is an initial effort required to configure the Vault SSH Secrets Engine, develop the necessary OpenTofu modules, and update VM provisioning scripts.
*   **Learning Curve:** Users and administrators may need to familiarize themselves with SSH certificate concepts and the Vault CLI/API for requesting certificates.
*   **Vault Dependency:** SSH access to managed hosts will become dependent on the availability and accessibility of the HashiCorp Vault infrastructure.
*   **Key Management for Signing:** While user private keys are not stored long-term, users will still need to generate a local SSH key pair. The public key is submitted to Vault for signing. Secure management of this local private key remains the user's responsibility, though its compromise is less severe due to the certificate's short TTL.