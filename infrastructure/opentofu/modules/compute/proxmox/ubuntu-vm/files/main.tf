resource "proxmox_virtual_environment_download_file" "ubuntu_image" {
  content_type = "iso"
  datastore_id = "local"
  node_name    = var.node_name
  url          = var.image_url
  file_name    = "ubuntu-${split("/", var.image_url)[7]}.img"
}

resource "proxmox_virtual_environment_vm" "ubuntu_test" {
  name        = "Ubuntu-test-${var.env_name}"
  node_name   = var.node_name
  description = "Ubuntu 24.04 Minimal (${var.env_name})"
  
  agent {
    enabled = false
  }

  memory {
    dedicated = 2048
  }

  cpu {
    cores = 1
    type  = "host"
  }

  disk {
    datastore_id = "local"
    file_id      = proxmox_virtual_environment_download_file.ubuntu_image.id
    interface    = "virtio0"
    size         = 30
    iothread     = true
    discard      = "on"
  }

  initialization {
    user_account {
      username = "admin"
      keys     = [var.ssh_public_key]
    }
  }
}