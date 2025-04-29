// Proxmox Connection Variables
variable "proxmox_api_url" {
  type        = string
  description = "The URL of the Proxmox API (e.g., https://proxmox.example.com:8006/api2/json)"
  // Sensitive, should ideally be set via environment variables (PKR_VAR_proxmox_api_url) or vault
  // sensitive = true 
}

variable "proxmox_api_token_id" {
  type        = string
  description = "Proxmox API Token ID (e.g., user@pam!tokenid)"
  // Sensitive, should ideally be set via environment variables (PKR_VAR_proxmox_api_token_id) or vault
  // sensitive = true 
}

variable "proxmox_api_token_secret" {
  type        = string
  description = "Proxmox API Token Secret"
  // Sensitive, should ideally be set via environment variables (PKR_VAR_proxmox_api_token_secret) or vault
  sensitive = true 
}

variable "proxmox_node" {
  type        = string
  description = "The target Proxmox node name."
}

variable "proxmox_storage_pool" {
  type        = string
  description = "The Proxmox storage pool for the VM template."
  default     = "local-lvm" // Common default, adjust if needed
}

variable "proxmox_bridge" {
  type        = string
  description = "The Proxmox network bridge for the VM."
  default     = "vmbr0" // Common default, adjust if needed
}

variable "proxmox_skip_tls_verify" {
  type        = bool
  description = "Skip TLS verification for the Proxmox API."
  default     = false
}

// VM Template Variables
variable "template_name" {
  type        = string
  description = "Name for the resulting Proxmox template."
  default     = "ubuntu-2204-template"
}

variable "template_description" {
  type        = string
  description = "Description for the Proxmox template."
  default     = "Ubuntu 22.04 LTS Cloud-Init Template"
}

// VM Build Configuration
variable "vm_cpu_cores" {
  type        = number
  description = "Number of CPU cores for the build VM."
  default     = 2
}

variable "vm_memory" {
  type        = number
  description = "Memory in MB for the build VM."
  default     = 2048 // 2GB
}

variable "vm_disk_size" {
  type        = string
  description = "Disk size for the build VM (e.g., '32G')."
  default     = "32G"
}

// Ubuntu ISO Variables
variable "iso_url" {
  type        = string
  description = "URL for the Ubuntu 22.04 LTS Server ISO."
  default     = "https://releases.ubuntu.com/22.04/ubuntu-22.04.4-live-server-amd64.iso" // Check for latest 22.04 point release
}

variable "iso_checksum" {
  type        = string
  description = "SHA256 checksum for the Ubuntu ISO."
  // Find the correct checksum for the specific ISO version used
  // Example for 22.04.4:
  default     = "f8b89e03b4d6b2f906a06b1f17dec008e050918007a376566a9f64b063230640" 
}

// Cloud-Init Variables
variable "ssh_username" {
  type        = string
  description = "Default username created by cloud-init."
  default     = "ubuntu"
}

variable "ssh_public_key" {
  type        = string
  description = "Public SSH key to install for the default user."
  // Provide your public key here or via environment variable (PKR_VAR_ssh_public_key)
  // sensitive = true 
}

variable "hostname" {
  type        = string
  description = "Hostname to set via cloud-init."
  default     = "ubuntu-template"
}