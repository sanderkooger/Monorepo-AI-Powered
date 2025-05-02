# OpenTofu Configuration

## Repository Name Handling

The `repo_name` variable supports automatic detection from git origin with manual override capability:

```hcl
variable "repo_name" {
  description = <<EOT
  Repository name detection:
  - Automatically extracted from git origin URL
  - Override by setting in repo.auto.tfvars
  - Format: "repository-name" (no organization)
  EOT
  type        = string
  default     = null
}
```

### Example override:
```hcl
# repo.auto.tfvars
repo_name = "monorepo-ai-powered"
```

### Detection Logic
```mermaid
sequenceDiagram
    User->>Terraform: Apply config
    Terraform->>Script: Execute get_repo_name.sh
    Script->>Git: Get origin URL
    Git-->>Script: Return URL
    Script-->>Terraform: JSON response
    Terraform->>Validation: Check sources
    alt Override exists
        Validation-->>User: Use manual value
    else
        Validation-->>User: Use git origin value
    end