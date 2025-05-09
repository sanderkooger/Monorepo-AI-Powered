data "vault_policy_document" "ansible" {
  rule {
    path         = "secret/data/ansible/*"
    capabilities = ["create", "read", "update", "delete", "list"]
    description  = "Full access to Ansible secrets"
  }

  rule {
    path         = "secret/metadata/ansible"
    capabilities = ["list"]
    description  = "List access to Ansible secret metadata"
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