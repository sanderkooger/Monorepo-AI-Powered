# This module is an interface for Ansible inventory data.
# No resources are created here. It prepares a structured object
# with information relevant for Ansible.

locals {
  ansible_inventory_host_data = {
    instance_name      = var.instance_name
    ip_address         = var.ip_address
    fqdn               = var.fqdn
    tags               = var.tags
    ansible_user       = var.ansible_user
    ansible_public_key = var.ansible_public_key # Note: Exposing public keys, even if "public", should be handled with care.
                                               # Consider if this is truly needed in the inventory data structure itself
                                               # or if it's only used during instance provisioning by another module.
  }
}