variable "kv_store_path" {
  description = "Central KV store path from vault/kv_engine module"
  type        = string
}

resource "vault_kv_secret_v2" "db_credentials" {
  mount = var.kv_store_path
  name  = "web-app/production-db"
  
  data_json = jsonencode({
    username = "app_user"
    password = random_password.db.result
  })
}

resource "random_password" "db" {
  length  = 16
  special = true
}