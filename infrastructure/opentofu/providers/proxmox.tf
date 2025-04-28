data "vault_generic_secret" "proxmox" {
  # Fetch only in prod, as dev uses defaults from variables.tf
  count = var.environment == "prod" ? 1 : 0
  path  = "kv/${var.repo_name}/${var.environment}/proxmox" # Using repo_name var passed to module
}

provider "proxmox" {
  # Conditional configuration based on environment
  pm_api_url = var.environment == "prod" ? data.vault_generic_secret.proxmox[0].data["api_url"] : var.proxmox_url
  
  # Assuming dev key format user@realm!tokenid=secret for splitting
  # Extract token ID: part after '!' and before '='
  pm_api_token_id = var.environment == "prod" ? data.vault_generic_secret.proxmox[0].data["api_token_id"] : split("=", split("!", var.proxmox_api_key)[1])[0] 
  # Extract token secret: part after '='
  pm_api_token_secret = var.environment == "prod" ? data.vault_generic_secret.proxmox[0].data["api_token_secret"] : split("=", var.proxmox_api_key)[1]
  
  # Allow insecure connection for dev environment with self-signed certs
  pm_tls_insecure = var.environment == "dev" ? true : false 
}