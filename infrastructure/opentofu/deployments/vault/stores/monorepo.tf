module "monorepo_secrets" {
  source = "../../../modules/vault/kv-store"

  path        = "kv/Monorepo-AI-Powered"
  description = "Central secrets store for Monorepo AI project"
}