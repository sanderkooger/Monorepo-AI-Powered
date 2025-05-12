variable "instance_name" {
  description = "The name of the instance."
  type        = string
}

variable "ip_address" {
  description = "The IP address of the instance."
  type        = string
}

variable "fqdn" {
  description = "The Fully Qualified Domain Name of the instance."
  type        = string
  default = null
}

variable "ansible_user" {
  description = "The username for Ansible to use for SSH connections."
  type        = string
 
}

variable "tags" {
  description = "A map of tags to assign to the instance, defining its role and configuration."
  type        = map(string)
  default     = {} # An empty map will fail validation due to mandatory tags.

  validation {
    condition     = try(var.tags.Provisioner, null) != null && var.tags.Provisioner != ""
    error_message = "The 'Provisioner' tag must exist and cannot be empty."
  }

  validation {
    condition     = try(var.tags.SystemRole, null) != null && contains(["KubernetesNode", "WebServer", "MySQLClusterNode", "StandaloneDB"], var.tags.SystemRole)
    error_message = "The 'SystemRole' tag must exist and be one of: 'KubernetesNode', 'WebServer', 'MySQLClusterNode', 'StandaloneDB'."
  }

  # KubernetesNode specific validations
  # KubernetesNode specific validations
  validation {
    condition     = try(var.tags.SystemRole, "") != "KubernetesNode" || (lookup(var.tags, "K8sClusterName", null) != null && contains(["alpha", "bravo"], lookup(var.tags, "K8sClusterName", "")))
    error_message = "If 'SystemRole' is 'KubernetesNode', the 'K8sClusterName' tag must exist and be 'alpha' or 'bravo'."
  }
  validation {
    condition     = try(var.tags.SystemRole, "") != "KubernetesNode" || (lookup(var.tags, "K8sNodeRole", null) != null && contains(["control-plane", "worker"], lookup(var.tags, "K8sNodeRole", "")))
    error_message = "If 'SystemRole' is 'KubernetesNode', the 'K8sNodeRole' tag must exist and be 'control-plane' or 'worker'."
  }

  # WebServer specific validations
  validation {
    condition     = try(var.tags.SystemRole, "") != "WebServer" || (lookup(var.tags, "WebServerType", null) != null && contains(["nginx", "apache"], lookup(var.tags, "WebServerType", "")))
    error_message = "If 'SystemRole' is 'WebServer', the 'WebServerType' tag must exist and be 'nginx' or 'apache'."
  }
  validation {
    condition     = try(var.tags.SystemRole, "") != "WebServer" || (lookup(var.tags, "PhpVersion", null) != null && can(regex("^\\d+(\\.\\d+){1,2}$", lookup(var.tags, "PhpVersion", ""))))
    error_message = "If 'SystemRole' is 'WebServer', the 'PhpVersion' tag must exist and match a version format (e.g., '8.1', '7.4.3')."
  }

  # MySQLClusterNode specific validations
  validation {
    condition     = try(var.tags.SystemRole, "") != "MySQLClusterNode" || (lookup(var.tags, "MySQLClusterName", null) != null && lookup(var.tags, "MySQLClusterName", "") != "")
    error_message = "If 'SystemRole' is 'MySQLClusterNode', the 'MySQLClusterName' tag must exist and cannot be empty."
  }
  validation {
    condition     = try(var.tags.SystemRole, "") != "MySQLClusterNode" || (lookup(var.tags, "MySQLNodeRole", null) != null && contains(["primary", "replica", "arbiter"], lookup(var.tags, "MySQLNodeRole", "")))
    error_message = "If 'SystemRole' is 'MySQLClusterNode', the 'MySQLNodeRole' tag must exist and be 'primary', 'replica', or 'arbiter'."
  }
  validation {
    condition     = try(var.tags.SystemRole, "") != "MySQLClusterNode" || (lookup(var.tags, "DBVersion", null) != null && can(regex("^\\d+(\\.\\d+){1,2}$", lookup(var.tags, "DBVersion", ""))))
    error_message = "If 'SystemRole' is 'MySQLClusterNode', the 'DBVersion' tag must exist and match a version format (e.g., '8.0', '5.7.30')."
  }

  # StandaloneDB specific validations
  validation {
    condition     = try(var.tags.SystemRole, "") != "StandaloneDB" || (lookup(var.tags, "DBType", null) != null && contains(["mysql", "postgres"], lookup(var.tags, "DBType", "")))
    error_message = "If 'SystemRole' is 'StandaloneDB', the 'DBType' tag must exist and be 'mysql' or 'postgres'."
  }
  validation {
    condition     = try(var.tags.SystemRole, "") != "StandaloneDB" || (lookup(var.tags, "DBVersion", null) != null && can(regex("^\\d+(\\.\\d+){1,2}$", lookup(var.tags, "DBVersion", ""))))
    error_message = "If 'SystemRole' is 'StandaloneDB', the 'DBVersion' tag must exist and match a version format."
  }
}
