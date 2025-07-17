

# Root module and plumbing

provider "proxmox" {
  endpoint  = data.vault_kv_secret_v2.proxmox_creds.data["host"]# "https://192.168.1.4:8006"
  username = data.vault_kv_secret_v2.proxmox_creds.data["user"]
  password = data.vault_kv_secret_v2.proxmox_creds.data["password"]
  insecure  = true

  ssh {
    agent    = false
    username = "terraform"
    private_key = <<-EOF
    ${data.vault_kv_secret_v2.proxmox_ssh.data["priv_key"]}
    EOF
  }
    
    
    
 
}
 
module "get_repo_name" {
  source = "./modules/helpers/get_repo_name"
  repo_name = var.repo_name
}

# Set up kv engine
module "kv_engine" {
  source      = "./modules/vault/kv_engine"
  repo_name   = module.get_repo_name.name
  env_name = var.env_name
}
 
 
 # images for proxmox 
 resource "proxmox_virtual_environment_download_file" "ubuntu-24-04-minimal-cloudimg-amd64" {
  content_type = "iso"
  datastore_id = "local"
  node_name    = var.proxmox_node_name
  url          = "https://cloud-images.ubuntu.com/minimal/releases/noble/release/ubuntu-24.04-minimal-cloudimg-amd64.img"
  file_name    = "${var.env_name}-ubuntu-24.04-minimal-cloudimg-amd64.img"
}
 resource "proxmox_virtual_environment_download_file" "ubuntu-24-04-server-cloudimg-amd64" {
  content_type = "iso"
  datastore_id = "local"
  node_name    = var.proxmox_node_name
  url          = "https://cloud-images.ubuntu.com/releases/noble/release/ubuntu-24.04-server-cloudimg-amd64.img"
  file_name    = "${var.env_name}-ubuntu-24.04-server-cloudimg-amd64.img"
}


 
 
 
 
 # Get bootstrap users data and keys
data "vault_kv_secret_v2" "proxmox_creds" {
  mount = "kv-root"
  name  = "proxmox_creds"
}

data "vault_kv_secret_v2" "proxmox_ssh" {
  mount = "kv-root"
  name  = "ssh_keys/terraform-proxmox"
}
# Deploy machines

# Configure Vault SSH CA
module "vault_ssh_ca_config" {
  source        = "./modules/vault-ssh-engine"
  reponame      = module.get_repo_name.name # Or var.repo_name directly if preferred
  environment   = var.env_name
  # You might want to add other variables like allowed_users, role_name, ttl if you made them configurable
  # and want to set them from the root module. Otherwise, they will use the defaults from the module.
  # Example:
  # allowed_users = ["ansible", "ubuntu"]
}

module "mngmt_01"  {
  source = "./modules/compute/proxmox/ubuntu-vm"
  instance_name     = "mngmt-01"
  description       = "ubuntu test machine" 
  cpu_cores         = 2
  memory_size       = 512
  repo_name         = var.repo_name
  env_name          = var.env_name
  proxmox_node_name = var.proxmox_node_name
  image_id          = proxmox_virtual_environment_download_file.ubuntu-24-04-server-cloudimg-amd64.id
  kv_store_path     = module.kv_engine.kv_store_path
  user_name         = "ansible"
  ansible_groups    = ["mngmt", "monitor"]
  ansible_variables = {
    ansible_connection = "vault_ssh_signer",
    ansible_ssh_jumphost = "paris.thisisfashion.tv" # Add jumphost for internal management VM
  }
  # ssh_pub_key is now optional in the module and will default to null if not provided.
  # For this setup, we are intentionally omitting it to rely on Vault SSH CA.
  vault_ssh_ca_public_key_pem = module.vault_ssh_ca_config.ca_public_key_pem
  vault_ssh_engine_signing_role = module.vault_ssh_ca_config.ssh_engine_signing_role_ansible

}

module "web_01"  {
  source = "./modules/compute/proxmox/ubuntu-vm"
  instance_name       = "web-01"
  description         = "ubuntu test machine" 
  cpu_cores           = 2
  memory_size         = 512
  repo_name           = var.repo_name
  env_name            = var.env_name
  proxmox_node_name   = var.proxmox_node_name
  image_id            = proxmox_virtual_environment_download_file.ubuntu-24-04-server-cloudimg-amd64.id
  kv_store_path       = module.kv_engine.kv_store_path
  user_name           = "ansible"
  ansible_groups      = ["nginx"]
  ansible_variables = {
    ansible_connection = "vault_ssh_signer",
    ansible_ssh_jumphost = "paris.thisisfashion.tv" # Add jumphost for internal web VM
  }
  # ssh_pub_key is now optional in the module and will default to null if not provided.
  # For this setup, we are intentionally omitting it to rely on Vault SSH CA.
  vault_ssh_ca_public_key_pem = module.vault_ssh_ca_config.ca_public_key_pem
  vault_ssh_engine_signing_role = module.vault_ssh_ca_config.ssh_engine_signing_role_ansible

}


module "web_02"  {
  source = "./modules/compute/proxmox/ubuntu-vm"
  instance_name  = "web-02"
  description    = "ubuntu test machine" 
  cpu_cores      = 2
  memory_size    = 512
  repo_name      = var.repo_name
  env_name       = var.env_name
  proxmox_node_name      = var.proxmox_node_name
  image_id       = proxmox_virtual_environment_download_file.ubuntu-24-04-server-cloudimg-amd64.id
  kv_store_path  = module.kv_engine.kv_store_path
  user_name      = "ansible"
  ansible_groups = ["nginx"]
  ansible_variables = {
    ansible_connection = "vault_ssh_signer",
    ansible_ssh_jumphost = "paris.thisisfashion.tv" # Add jumphost for internal web VM
  }
  # ssh_pub_key is now optional in the module and will default to null if not provided.
  # For this setup, we are intentionally omitting it to rely on Vault SSH CA.
  vault_ssh_ca_public_key_pem = module.vault_ssh_ca_config.ca_public_key_pem
  vault_ssh_engine_signing_role = module.vault_ssh_ca_config.ssh_engine_signing_role_ansible


}



