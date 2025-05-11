data "vault_policy_document" "ansible" {
  # Access to Machine secrets
  rule {
    path         = "secret/data/ansible/machines/*"
    capabilities = ["create", "read", "update", "delete", "list"]
    description  = "Allow full CRUDL access to machine-specific secrets for Ansible."
  }
  rule {
    path         = "secret/metadata/ansible/machines/*"
    capabilities = ["list"]
    description  = "Allow listing metadata for machine-specific secrets for Ansible."
  }

  # Access to Cluster secrets
  rule {
    path         = "secret/data/ansible/clusters/*"
    capabilities = ["create", "read", "update", "delete", "list"]
    description  = "Allow full CRUDL access to cluster-specific secrets for Ansible."
  }
  rule {
    path         = "secret/metadata/ansible/clusters/*"
    capabilities = ["list"]
    description  = "Allow listing metadata for cluster-specific secrets for Ansible."
  }
}

resource "vault_policy" "ansible" {
  name   = "ansible"
  policy = data.vault_policy_document.ansible.hcl
}

resource "vault_approle_auth_backend_role" "ansible_automation" {
  backend        = "approle"
  role_name      = "ansible-automation"
  token_policies = [vault_policy.ansible.name]
  token_ttl      = "1h"
  bind_secret_id = true
}

output "ansible_approle_role_id" {
  value     = vault_approle_auth_backend_role.ansible_automation.role_id
  sensitive = true
}

output "ansible_approle_secret_id" {
  value     = vault_approle_auth_backend_role.ansible_automation.secret_id
  sensitive = true
}