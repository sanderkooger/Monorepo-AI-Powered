terraform {
  required_version = ">= 1.7" # Added based on linting requirement

  required_providers {
    external = {
      source  = "hashicorp/external"
      version = "~> 2.3.4" # From lock file
    }
  }
}
data "external" "origin" {
  program = ["sh", "${path.module}/scripts/get_repo_name.sh"]
}

locals {
  final_repo_name = coalesce(
    var.repo_name,
    try(data.external.origin.result.repo_name, null)
  )

}