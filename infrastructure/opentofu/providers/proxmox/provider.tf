terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "0.77.0" # Verify latest version
    }
  }
}

data "vault_kv_secret_v2" "proxmox_creds" {
  mount = "kv-root"
  name  = "/v1/kv-root/data/proxmox_creds"
}

provider "proxmox" {
  endpoint  = data.vault_kv_secret_v2.proxmox_creds.data["host"]
  api_token = "${data.vault_kv_secret_v2.proxmox_creds.data["token_id"]}=${data.vault_kv_secret_v2.proxmox_creds.data["token_secret"]}"
  

  ssh {
    agent      = true
    #username   = data.vault_kv_secret_v2.proxmox_creds.data["user"]
    #private_key = data.vault_kv_secret_v2.proxmox_creds.data["SSH_priv_key"]
  }
}

