
variable "fqdn" {
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

variable "proxmox_node_name" {
  description = "The Proxmox node to deploy the VM on."
  type        = string
}

variable "description" {
  description = "Description for the VM."
  type        = string
  default     = ""
}

variable "image_id" {
  description = "the id of the image hosted on proxmox."
  type        = string
}

variable "kv_store_path" {
  description = "The path in Vault KV store for this VM's secrets."
  type        = string
}

variable "user_name" {
  description = "The username for the default user created by cloud-init."
  type        = string
  default = "ansible"
}

variable "ssh_pub_key" {
  description = "The SSH public key for the default user. Optional, if not provided, initial access relies on other means (e.g., Vault SSH CA)."
  type        = string
  default     = null
}

variable "repo_name" {
  description = "Repository name, used for context in helper modules or tagging."
  type        = string
}
variable "vault_ssh_ca_public_key_pem" {
  description = "The PEM-encoded public key of the Vault SSH CA."
  type        = string
  sensitive   = true # The key itself might not be super secret, but good practice for keys.
}

variable "vault_ssh_engine_signing_role" {
  description = "The name of the Vault SSH vault_ssh_engine_signing_role"
  type        = string
 
  
}

variable "ansible_groups" {
  description = "Ansible groups to assign the VM to."
  type        = list(string)
  default     = []
  
}
variable "cpu_cores" {
  description = "Number of CPU cores for the VM."
  type        = number
  default     = 1
  
}
variable "memory_size" {
  description = "Memory size for the VM in MB."
  type        = number
  default     = 256
  
}

variable "disk_size" {
  description = "Disk size for the VM in GB."
  type        = number
  default     = 15
  
}

variable "ansible_variables" {
  description = "Optional map of variables to pass to the Ansible host resource."
  type        = map(any)
}