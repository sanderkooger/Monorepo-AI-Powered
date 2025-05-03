data "external" "origin" {
  program = ["sh", "${path.module}/scripts/get_workspace_name.sh"]
}

locals {
  final_workspace_name = coalesce(
    var.workspace_name,
     try(data.external.origin.result.workspace_name, null)
  )

  _ = local.final_workspace_name != null ? true : error("Workspace name required: set via input or ensure git origin exists")

}