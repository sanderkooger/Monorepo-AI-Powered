terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "0.77.0" # Verify latest version
    }
    random = {
      source  = "hashicorp/random"
      version = "3.7.2"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "4.8.0"
    }
    ansible = {
      version = "~> 1.1.0"
      source  = "ansible/ansible"
    }
  }
}


locals {
  # Construct FQDN: if domain_name is provided, append it; otherwise, use the VM name.
  fqdn = var.domain_name != null ? "${proxmox_virtual_environment_vm.ubuntu_vm.name}.${var.domain_name}" : proxmox_virtual_environment_vm.ubuntu_vm.name
}

## Ubuntu VM Module
resource "proxmox_virtual_environment_vm" "ubuntu_vm" {
  name        = "${var.instance_name}-${var.env_name}"
  node_name   = var.node_name
  description = var.description
  tags        = ["ubuntu"]

  agent {
    enabled = true
  }


  cpu {
    cores = 1
    type  = "host"
  }
  memory {
    dedicated = 2048
  }

  disk {
    datastore_id = "local-lvm"
    file_id      = proxmox_virtual_environment_download_file.ubuntu_image.id
    interface    = "virtio0"
    size         = 30
    iothread     = true
    discard      = "on"
  }

  network_device {
    bridge = "vmbr0"
  }
  serial_device {
    device = "socket"
  }

  tpm_state {
    version = "v2.0"
  }

  initialization {
    user_data_file_id = proxmox_virtual_environment_file.user_data_cloud_config.id
    ip_config {
      ipv4 {
        address = "${var.ip_address}/24"
        gateway = var.gateway
      }
    }
    dns {
      servers = ["192.168.1.1", "1.1.1.1"]
    }
  }
}

## Resources

resource "proxmox_virtual_environment_file" "user_data_cloud_config" {
  content_type = "snippets"
  datastore_id = "local"
  node_name    = var.node_name

  source_raw {
    data = <<-EOT
    #cloud-config
    hostname: ${var.instance_name}-${var.env_name}
    users:
      - name: ${var.user_name}
        groups: sudo
        shell: /bin/bash
        ${var.ssh_pub_key != null ? "ssh_authorized_keys:\n          - ${trimspace(var.ssh_pub_key)}" : ""}
        sudo: ALL=(ALL) NOPASSWD:ALL
    package_update: true
    packages:
      - qemu-guest-agent
    write_files:
      - path: /etc/ssh/vault_ssh_ca.pem
        permissions: '0644'
        owner: root:root
        content: |
          ${var.vault_ssh_ca_public_key_pem}
    runcmd:
      - systemctl enable --now qemu-guest-agent
      - |
        echo 'TrustedUserCAKeys /etc/ssh/vault_ssh_ca.pem' >> /etc/ssh/sshd_config.d/vault_ca.conf && \
        chmod 0644 /etc/ssh/sshd_config.d/vault_ca.conf && \
        systemctl restart sshd
    EOT

    file_name = "${var.instance_name}-${var.env_name}-user-data.yaml"
  }
}

resource "proxmox_virtual_environment_download_file" "ubuntu_image" {
  content_type = "iso"
  datastore_id = "local"
  node_name    = var.node_name
  url          = var.image_url
  file_name    = split("/", var.image_url)[7]
}



resource "random_password" "ubuntu_vm_password" {
  length           = 16
  override_special = "_%@"
  special          = true
}

module "get_repo_name" {
  source    = "../../../../modules/helpers/get_repo_name"
  repo_name = var.repo_name
}



# Vault policy for this VM instance
resource "vault_policy" "vm_policy" {
  name = "${proxmox_virtual_environment_vm.ubuntu_vm.name}-policy"

  policy = <<EOT
path "${var.kv_store_path}/data/infrastructure/machines/${proxmox_virtual_environment_vm.ubuntu_vm.name}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "${var.kv_store_path}/metadata/infrastructure/machines/${proxmox_virtual_environment_vm.ubuntu_vm.name}/*" {
  capabilities = ["list"]
}
EOT
}

# AppRole for VM authentication
resource "vault_approle_auth_backend_role" "vm_role" {
  backend        = "approle"
  role_name      = "${proxmox_virtual_environment_vm.ubuntu_vm.name}-role"
  token_policies = [vault_policy.vm_policy.name]
}

resource "vault_kv_secret_v2" "machine_credentials" {
  mount = var.kv_store_path
  name  = "machines/${proxmox_virtual_environment_vm.ubuntu_vm.name}" # Use variable instead of local

  data_json = jsonencode({
    user     = var.user_name
    password = random_password.ubuntu_vm_password.result
    ip       = proxmox_virtual_environment_vm.ubuntu_vm.ipv4_addresses[1]
  })

}

resource "ansible_host" "host" {
  name   = proxmox_virtual_environment_vm.ubuntu_vm.ipv4_addresses[1][0]
  groups = var.ansible_groups

  variables = {
    instance_name   = proxmox_virtual_environment_vm.ubuntu_vm.name
    vault_ssh_ca = var.vault_ssh_engine_full_path
    # tags    = proxmox_virtual_environment_vm.ubuntu_vm.tags
   
  }
}

