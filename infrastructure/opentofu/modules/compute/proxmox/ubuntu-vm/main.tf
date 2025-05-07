terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "0.77.0" # Verify latest version
    }
  }
}


## Ubuntu VM Module
resource "proxmox_virtual_environment_vm" "ubuntu_vm" {
  name        = "${var.instance_name}-${var.env_name}"
  node_name   = var.node_name
  description = var.description
  tags        = ["terraform", "ubuntu"]
  
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
        ssh_authorized_keys:
          - ${trimspace(var.ssh_pub_key)}
        sudo: ALL=(ALL) NOPASSWD:ALL
    package_update: true
    packages:
      - qemu-guest-agent
    runcmd:
      - systemctl enable --now qemu-guest-agent
    EOT

    file_name = "${var.instance_name}-${var.env_name}-user-data.yaml"
  }
}

resource "proxmox_virtual_environment_download_file" "ubuntu_image" {
  content_type = "iso"
  datastore_id = "local"
  node_name    = var.node_name
  url          = var.image_url
  file_name    = "${split("/", var.image_url)[7]}"
}



resource "random_password" "ubuntu_vm_password" {
  length           = 16
  override_special = "_%@"
  special          = true
}

module "get_repo_name" {
  source = "../../../../modules/helpers/get_repo_name"
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

output "vault_role_id" {
  value = vault_approle_auth_backend_role.vm_role.role_id
  sensitive = true
}

resource "vault_kv_secret_v2" "machine_credentials" {
  mount = var.kv_store_path
  name  = "machines/${proxmox_virtual_environment_vm.ubuntu_vm.name}" # Use variable instead of local
  
  data_json = jsonencode({
    user     = var.user_name
    password = random_password.ubuntu_vm_password.result
    ip       = var.ip_address #temp fix
  })

}


## Outputs


