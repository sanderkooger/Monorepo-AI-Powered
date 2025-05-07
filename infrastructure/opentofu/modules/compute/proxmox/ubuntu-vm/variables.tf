

variable "instance_name" {
  type        = string
  description = "Unique name for this VM instance"
}
variable "description" {
  type        = string
  description = "Description of the VM instance"
  
}

variable "repo_name" {
  type        = string
  description = "Name of the repository/project"
}

variable "env_name" {
  description = "Environment name suffix for resource naming"
  type        = string
}

variable "node_name" {
  description = "Proxmox host node name"
  type        = string
}
variable "ssh_pub_key" {
  description = "SSH public key for the VM"
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

variable "kv_store_path" {
  description = "Path to the central KV store from vault/kv_engine module"
  type        = string
}