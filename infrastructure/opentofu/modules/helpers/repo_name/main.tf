data "external" "origin" {
  program = ["sh", "${path.module}/scripts/get_repo_name.sh"]
}

locals {
  final_repo_name = coalesce(
    var.repo_name,
    try(data.external.origin.result.repo_name, null)
  )

  _ = local.final_repo_name != null ? true : error("Repo name required: set via input or ensure git origin exists")
}