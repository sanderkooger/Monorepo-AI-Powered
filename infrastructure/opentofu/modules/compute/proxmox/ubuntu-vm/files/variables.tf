variable "env_name" {
  description = "Environment name suffix for resource naming"
  type        = string
}

variable "node_name" {
  description = "Proxmox host node name"
  type        = string
}

variable "image_url" {
  description = "URL of Ubuntu cloud image"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH public key from Vault"
  type        = string
  sensitive   = true
}