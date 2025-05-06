terraform {
  required_providers {
    external = {
      source = "hashicorp/external"
      version = "~> 2.3.4"
    }
    vault = {
      source = "hashicorp/vault"
      version = "~> 4.8"
    }
    proxmox = {
      source = "bpg/proxmox"
      version = "0.77.0"
    }
  }
}

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


module "kv_engine" {
  source      = "./modules/vault/kv_engine"
  repo_name   = module.get_repo_name.name
  env_name = var.env_name
}

data "vault_kv_secret_v2" "proxmox_creds" {
  mount = "kv-root"
  name  = "proxmox_creds"
}

data "vault_kv_secret_v2" "proxmox_ssh" {
  mount = "kv-root"
  name  = "ssh_keys/terraform-proxmox"
}
data "vault_kv_secret_v2" "bootstrap_user_" {
  mount = "kv-root"
  name  = "ssh_keys/bootstrap_user"
}




## test VM

module "ubuntu_test_vm" {
  source = "./modules/compute/proxmox/ubuntu-vm"
  computer_name = "ubuntu-test"
  repo_name      = var.repo_name
  env_name       = var.env_name
  node_name      = var.proxmox_node_name
  image_url      = "https://cloud-images.ubuntu.com/minimal/releases/noble/release/ubuntu-24.04-minimal-cloudimg-amd64.img"
  ip_address     = "192.168.1.10"
  kv_store_path = module.kv_engine.store_path
  ssh_pub_key = data.vault_kv_secret_v2.bootstrap_user_.data["pub_key"]

}
