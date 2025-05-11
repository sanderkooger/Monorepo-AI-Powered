variable "ansible_tags" {
  description = "Tags for the Ansible interface, including Provisioner and SystemRole. These tags will be validated by the Ansible interface module."
  type        = map(string)
  # Example:
  # {
  #   Provisioner   = "opentofu"
  #   SystemRole    = "WebServer"
  #   WebServerType = "nginx"
  #   PhpVersion    = "8.2"
  #   Environment   = "dev"
  #   Project       = "my-project"
  # }
}

variable "domain_name" {
  description = "Optional domain name to append for FQDN construction for Ansible (e.g., 'example.com'). If null, FQDN will be the instance name."
  type        = string
  default     = null
}

# Existing variables used by the module (implicitly defined if not in a variables.tf before)
# For clarity, it's good practice to list all module variables here.
# However, I will only add the new ones as per the immediate task.
# If you want me to list all existing inferred variables, please let me know.

variable "instance_name" {
  description = "The base name for the VM instance."
  type        = string
}

variable "env_name" {
  description = "Environment name (e.g., 'dev', 'prod'), appended to instance_name."
  type        = string
}

variable "node_name" {
  description = "The Proxmox node to deploy the VM on."
  type        = string
}

variable "description" {
  description = "Description for the VM."
  type        = string
  default     = ""
}

variable "image_url" {
  description = "URL for the cloud image to download."
  type        = string
}

variable "ip_address" {
  description = "The static IPv4 address to assign to the VM (without CIDR)."
  type        = string
}

variable "gateway" {
  description = "The IPv4 gateway for the VM."
  type        = string
}

variable "kv_store_path" {
  description = "The path in Vault KV store for this VM's secrets."
  type        = string
}

variable "user_name" {
  description = "The username for the default user created by cloud-init."
  type        = string
}

variable "ssh_pub_key" {
  description = "The SSH public key for the default user."
  type        = string
}

variable "repo_name" {
  description = "Repository name, used for context in helper modules or tagging."
  type        = string
}