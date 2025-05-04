terraform {
  required_providers {
    proxmox = {
      source = "bpg/proxmox"
      version = "0.77.0"
    }
  }
}

data "vault_kv_secret_v2" "proxmox" {
  mount = "kv-Monorepo-AI-Powered-prod"
  name  = "proxmox"
}

provider "proxmox" {
  endpoint  = data.vault_kv_secret_v2.proxmox.data["url"]
  api_token = "${data.vault_kv_secret_v2.proxmox.data["tokenID"]}=${data.vault_kv_secret_v2.proxmox.data["tokenSecret"]}"
  insecure  = true

  ssh {
    agent      = true
    username   = "root"
    private_key = data.vault_kv_secret_v2.proxmox.data["SSH_priv_key"]
  }
}

