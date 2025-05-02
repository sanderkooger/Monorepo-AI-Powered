# Root module
terraform {
  required_providers {
    vault = {
      source  = "hashicorp/vault"
      version = "4.8.0"
    }
  }
}

module "repo_name" {
  source = "./modules/helpers/repo_name"
}

locals {
  final_repo_name = module.repo_name.name
}
