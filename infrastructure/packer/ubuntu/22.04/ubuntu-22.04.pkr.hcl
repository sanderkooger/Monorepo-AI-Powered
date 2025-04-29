packer {
  required_plugins {
    proxmox = {
      version = ">= 1.1.3" // Use a recent version
      source  = "github.com/hashicorp/proxmox"
    }
  }
}

source "proxmox-iso" "ubuntu-2204" {
  # Proxmox Connection Info
  proxmox_url = var.proxmox_api_url
  username    = var.proxmox_api_token_id
  token       = var.proxmox_api_token_secret
  node        = var.proxmox_node
  insecure_skip_tls_verify = var.proxmox_skip_tls_verify

  # ISO Configuration
  iso_url      = var.iso_url
  iso_checksum = var.iso_checksum
  # Optional: Specify a storage pool for Proxmox to cache the ISO
  # iso_storage_pool = var.proxmox_storage_pool 

  # VM Template Configuration
  template_name        = var.template_name
  template_description = var.template_description
  tags                 = "packer,ubuntu,ubuntu-22.04"

  # VM Build Hardware Configuration
  os                    = "l26" // Generic Linux Kernel 6.x (adjust if needed)
  cores                 = var.vm_cpu_cores
  memory                = var.vm_memory
  scsi_controller       = "virtio-scsi-pci"

  disks {
    type           = "scsi"
    disk_size      = var.vm_disk_size
    storage_pool   = var.proxmox_storage_pool
    format         = "raw" // Or qcow2, depending on storage pool capabilities
    # Optional: Enable discard/trim
    # discard        = true 
    # ssd_emulation  = true 
  }

  network_adapters {
    model   = "virtio"
    bridge  = var.proxmox_bridge
    # Optional: Specify MAC address
    # mac_address = "..." 
  }

  # Cloud-Init Configuration
  cloud_init           = true
  cloud_init_storage_pool = var.proxmox_storage_pool // Store cloud-init drive here
  http_directory       = "http" // Serve files from the http subdirectory
  boot_command = [
    "<enter><wait>",
    // Wait for cloud-init datasource prompt if it appears
    "<wait5s>", 
    // Select "Try Ubuntu Server" or similar boot option if needed
    // Add specific boot commands based on the Ubuntu ISO boot menu
    "c<wait>", // Select 'Try or Install Ubuntu Server' if 'c' is the key
    "linux /casper/vmlinuz --- autoinstall ds=nocloud-net;s=http://{{ .HTTPIP }}:{{ .HTTPPort }}/<wait>",
    "initrd /casper/initrd<wait>",
    "boot<wait>"
  ]
  boot_wait = "5s" // Adjust as needed

  # SSH Configuration for Provisioning
  ssh_username = var.ssh_username
  # Packer will generate a temporary keypair unless ssh_private_key_file is set
  ssh_timeout  = "20m" // Increase timeout for potentially long provisioning
  
  # Temporary VM name during build
  vm_name      = "${var.template_name}-build-${timestamp()}" 
}

build {
  sources = ["source.proxmox-iso.ubuntu-2204"]

  provisioner "shell" {
    inline = [
      "echo 'Waiting for cloud-init to complete...'",
      "while [ ! -f /var/lib/cloud/instance/boot-finished ]; do echo 'Waiting...'; sleep 5; done",
      "echo 'Cloud-init finished.'",
      "sudo apt-get update",
      "sudo apt-get upgrade -y",
      // Add other provisioning steps here based on reference repo/needs
      // Example: Install qemu-guest-agent
      "sudo apt-get install -y qemu-guest-agent",
      "sudo systemctl enable qemu-guest-agent",
      "sudo systemctl start qemu-guest-agent",
      // Cleanup
      "echo 'Cleaning up apt cache...'",
      "sudo apt-get clean",
      "sudo rm -rf /var/lib/apt/lists/*",
      "echo 'Cleaning up cloud-init logs...'",
      "sudo rm -rf /var/log/cloud-init*.log",
      "echo 'Zeroing free space...'",
      "sudo dd if=/dev/zero of=/EMPTY bs=1M || echo 'dd exit code $? is suppressed'",
      "sudo rm -f /EMPTY",
      // Sync to ensure writes are complete
      "sync" 
    ]
  }

  // Add other provisioners (e.g., file, ansible) if needed
  
}