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
  name        = "Ubuntu-test-${var.env_name}"
  node_name   = var.node_name
  description = "Ubuntu 24.04 Minimal (${var.env_name})"
  tags        = ["terraform", "ubuntu"]
  
  
  agent {
    # read 'Qemu guest agent' section, change to true only when ready
    enabled = false
  }
  # if agent is not enabled, the VM may not be able to shutdown properly, and may need to be forced off
  stop_on_destroy = true

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
    tpm_state {
    version = "v2.0"
  }

  initialization {
    user_account {
      username = "admin"
      keys     = [trimspace(tls_private_key.ubuntu_vm_key.public_key_openssh)]
      password = random_password.ubuntu_vm_password.result
      

      
    }
  }
}

## Resources

resource "proxmox_virtual_environment_download_file" "ubuntu_image" {
  content_type = "iso"
  datastore_id = "local"
  node_name    = var.node_name
  url          = var.image_url
  file_name    = "${split("/", var.image_url)[7]}"
}

resource "tls_private_key" "ubuntu_vm_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "random_password" "ubuntu_vm_password" {
  length           = 16
  override_special = "_%@"
  special          = true
}

## Outputs

