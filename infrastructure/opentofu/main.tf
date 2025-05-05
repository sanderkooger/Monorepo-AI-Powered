# Root module


module "get_repo_name" {
  source = "./modules/helpers/get_repo_name"
  repo_name = var.repo_name
}
module "get_workspace_name" {
  source = "./modules/helpers/get_workspace_name"
  workspace_name = var.workspace_name
}

module "kv_engine" {
  source      = "./modules/vault/kv_engine"
  repo_name   = module.get_repo_name.name
  workspace_name = module.get_workspace_name.name
}