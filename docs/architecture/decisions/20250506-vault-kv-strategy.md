---

**ADR-2025-05-06-Vault-KV-Strategy: Standardized Vault KV Path and Policy Management for Modules**

*   **Status:** Accepted
*   **Deciders:** Roo (Technical Lead), Project Team
*   **Date:** 2025-05-06

**Context and Problem Statement:**

The project requires a simplified, secure, and scalable method for various infrastructure modules (managed by OpenTofu) to store and access secrets within HashiCorp Vault. Currently, there isn't a standardized approach, leading to potential inconsistencies, security risks, and difficulties in managing secret lifecycles, especially ensuring that the deletion of one module does not inadvertently affect secrets stored by others. The goal is to have a single, clearly named Key/Value (KV) secrets engine per environment, with modules claiming distinct, isolated paths within it.

**Decision Drivers:**

*   **Security:** Enforce least privilege for modules accessing secrets; ensure strong isolation between secrets of different modules.
*   **Simplicity:** Provide a straightforward and predictable way for module developers to integrate with Vault.
*   **Scalability:** Accommodate a growing number of modules and environments without undue complexity.
*   **Maintainability:** Establish clear conventions and leverage Infrastructure as Code (IaC) for managing Vault configurations.
*   **Data Integrity:** Prevent accidental data loss of one module's secrets when another module undergoes lifecycle changes (e.g., deletion).
*   **Reusability:** Allow the Vault configuration patterns to be easily adapted for different repositories and environments.

**Considered Options:**

1.  **Option 1 (Chosen): Centralized, Dynamically Named KV with Module-Specific Policies and Paths.**
    *   A single KV-v2 secrets engine is mounted per environment, named dynamically using repository and environment variables (e.g., `path = "kv-${var.repo_name}-${var.env_name}"`).
    *   A standardized hierarchical path structure is enforced within this mount: `kv-${var.repo_name}-${var.env_name}/<module_type>/<module_category>/<module_instance_name>/...` (e.g., `kv-myproject-prod/infrastructure/machines/webserver-01/config`).
    *   Each OpenTofu module instance that requires secrets will manage its own `vault_policy` resource and an associated authentication mechanism (e.g., `vault_approle_auth_backend_role`).
    *   Policies grant permissions (`create`, `read`, `update`, `delete`, `list`) strictly scoped to the module's designated path prefix (covering both `data/` and `metadata/` subpaths for KV-v2).
    *   Upon module destruction via OpenTofu, the associated `vault_policy` and auth role are destroyed, revoking access. The secret data itself remains in Vault by default, preventing accidental loss.

2.  **Option 2: Separate KV Mount per Module.**
    *   Each module would define and manage its own `vault_mount`.
    *   *Pros:* Strongest possible isolation at the mount level.
    *   *Cons:* Increased Vault management overhead, potential for mount proliferation, more complex cross-module secret sharing if ever needed, less centralized view of secrets for an environment.

3.  **Option 3: Shared Policies with Granular Path Permissions in ACLs.**
    *   Fewer, more generic policies, with permissions granted to specific paths within the policy rules.
    *   *Pros:* Potentially fewer policy objects in Vault.
    *   *Cons:* More complex policy documents, harder to manage with IaC at the module level, increased risk if a shared policy is misconfigured or overly permissive, less clear audit trail for a module's specific access.

**Decision Outcome:**

**Chosen Option: Option 1 - Centralized, Dynamically Named KV with Module-Specific Policies and Paths.**

This approach provides the best balance of security (through strict, module-instance-specific policies), manageability (via IaC within each module), and operational clarity. The dynamic naming of the KV store using `var.repo_name` and `var.env_name` enhances its adaptability and reusability. It directly addresses the requirement that module deletion (which removes the policy and AppRole) revokes access but does not destroy other modules' data or its own data by default.

**Implementation Details (as per the agreed plan):**

*   The existing `infrastructure/opentofu/modules/vault/kv_engine/main.tf` will be updated to accept `repo_name` and `env_name` variables to set its `path`.
*   New or existing OpenTofu modules (e.g., for VMs, routers) will include:
    *   `vault_policy` resources, with paths constructed using the convention and scoped to the module instance.
    *   `vault_approle_auth_backend_role` resources, linking to these policies.
*   The OpenTofu provider for Vault must be configured with sufficient permissions to manage policies and AppRole roles.
*   Secure handling of AppRole RoleID and SecretID for provisioned resources will be necessary (standard AppRole operational consideration).

```mermaid
graph TD
    User[User/CI/CD with OpenTofu Permissions] -- Manages --> OTF_Root[OpenTofu Root Configuration]

    subgraph Central Vault Setup (Dynamically Named)
        KV_Mount_Def[vault_mount "kv-\${var.repo_name}-\${var.env_name}"]
    end

    OTF_Root -- Deploys --> OTF_Module_VM[OTF Module: VM]
    OTF_Root -- Deploys --> OTF_Module_Router[OTF Module: Router]

    subgraph Module VM Instance (vm-alpha-01)
        Policy_VM_Path["kv-\${var.repo_name}-\${var.env_name}/data/infrastructure/machines/vm-alpha-01/*"]
        Metadata_VM_Path["kv-\${var.repo_name}-\${var.env_name}/metadata/infrastructure/machines/vm-alpha-01/*"]
        OTF_Module_VM -- Creates --> Policy_VM[vault_policy "vm-alpha-01-policy"]
        Policy_VM -- Grants Access To --> Policy_VM_Path
        Policy_VM -- Grants Access To --> Metadata_VM_Path
        OTF_Module_VM -- Creates --> AppRole_VM[vault_approle_auth_backend_role "vm-alpha-01-role"]
        AppRole_VM -- Associated with --> Policy_VM
    end

    subgraph Module Router Instance (edge-router-01)
        Policy_Router_Path["kv-\${var.repo_name}-\${var.env_name}/data/infrastructure/network/routers/edge-router-01/*"]
        Metadata_Router_Path["kv-\${var.repo_name}-\${var.env_name}/metadata/infrastructure/network/routers/edge-router-01/*"]
        OTF_Module_Router -- Creates --> Policy_Router[vault_policy "edge-router-01-policy"]
        Policy_Router -- Grants Access To --> Policy_Router_Path
        Policy_Router -- Grants Access To --> Metadata_Router_Path
        OTF_Module_Router -- Creates --> AppRole_Router[vault_approle_auth_backend_role "edge-router-01-role"]
        AppRole_Router -- Associated with --> Policy_Router
    end

    Actual_VM[VM Instance: vm-alpha-01] -- Authenticates via AppRole_VM --> Vault[HashiCorp Vault]
    Actual_VM -- Reads/Writes --> Policy_VM_Path

    Actual_Router[Router Instance: edge-router-01] -- Authenticates via AppRole_Router --> Vault
    Actual_Router -- Reads/Writes --> Policy_Router_Path

    %% Deletion Flow
    User -- "terraform destroy vm-alpha-01" --> OTF_Module_VM
    OTF_Module_VM -- Deletes --> Policy_VM
    OTF_Module_VM -- Deletes --> AppRole_VM
    Policy_VM_Path -- "Data Remains (Access Revoked)" --> Vault
```

**Positive Consequences:**

*   Clear, predictable, and environment-specific secret paths.
*   Strong RBAC-based isolation between module secrets.
*   Simplified secret management integration for module developers.
*   Fully automated policy and auth role provisioning/deprovisioning via IaC.
*   Reduced risk of accidental data deletion across modules.
*   Enhanced reusability of Vault configuration patterns.

**Negative Consequences:**

*   The OpenTofu Vault provider will require permissions to manage `vault_policy` and `vault_approle_auth_backend_role` resources.
*   Secure distribution and management of AppRole SecretIDs to client applications/modules is an operational responsibility (standard for AppRole).

**Linkages:**

*   Updates `infrastructure/opentofu/modules/vault/kv_engine/main.tf`.
*   Impacts all OpenTofu modules that will consume secrets from Vault.
*   Aligns with `docs/architecture/decisions/20240502-repo-name-variable.md` by promoting the use of `repo_name`.

---