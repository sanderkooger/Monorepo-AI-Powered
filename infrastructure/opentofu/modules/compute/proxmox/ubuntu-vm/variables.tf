variable "env_name" {
  description = "Environment name suffix for resource naming"
  type        = string
}

variable "node_name" {
  description = "Proxmox host node name"
  type        = string
}
variable "computer_name" {
  description = "VM machine name"
  type        = string
}

variable "image_url" {
  description = "URL of Ubuntu cloud image"
  type        = string
}

variable "ip_address" {
  description = "Static IP address in CIDR notation (e.g. 192.168.1.100/24)"
  type        = string
  
}
variable "gateway" {
  description = "Static IP address in CIDR notation (e.g. 192.168.1.100/24)"
  type        = string
  default = "192.168.1.254"
}
