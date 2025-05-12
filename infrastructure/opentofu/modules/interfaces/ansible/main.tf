# This module is an interface for Ansible inventory data.
# No resources are created here. It prepares a structured object
# with information relevant for Ansible.
terraform {
  required_version = ">= 1.7" 
}

locals {
  ansible_inventory_host_data = {
    instance_name      = var.instance_name
    ip_address         = var.ip_address
    fqdn               = var.fqdn
    tags               = var.tags
    ansible_user       = var.ansible_user
  }
}