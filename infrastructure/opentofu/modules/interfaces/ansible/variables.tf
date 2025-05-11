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

variable "ansible_public_key" {
  description = "The SSH public key to be installed on the instance for the ansible_user."
  type        = string
  # This should likely be a required variable, so no default is provided.
  # Alternatively, it could default to a common key path or be sourced from elsewhere.
}

variable "tags" {
  description = "A map of tags to assign to the instance, defining its role and configuration."
  type        = map(string)
  default     = {} # An empty map will fail validation due to mandatory tags.

  validation {
    condition     = try(self.Provisioner, null) != null && self.Provisioner != ""
    error_message = "The 'Provisioner' tag must exist and cannot be empty."
  }

  validation {
    condition     = try(self.SystemRole, null) != null && contains(["KubernetesNode", "WebServer", "MySQLClusterNode", "StandaloneDB"], self.SystemRole)
    error_message = "The 'SystemRole' tag must exist and be one of: 'KubernetesNode', 'WebServer', 'MySQLClusterNode', 'StandaloneDB'."
  }

  # KubernetesNode specific validations
  validation {
    condition     = try(self.SystemRole, "") != "KubernetesNode" || (try(self.K8sClusterName, null) != null && contains(["alpha", "bravo"], self.K8sClusterName))
    error_message = "If 'SystemRole' is 'KubernetesNode', the 'K8sClusterName' tag must exist and be 'alpha' or 'bravo'."
  }
  validation {
    condition     = try(self.SystemRole, "") != "KubernetesNode" || (try(self.K8sNodeRole, null) != null && contains(["control-plane", "worker"], self.K8sNodeRole))
    error_message = "If 'SystemRole' is 'KubernetesNode', the 'K8sNodeRole' tag must exist and be 'control-plane' or 'worker'."
  }

  # WebServer specific validations
  validation {
    condition     = try(self.SystemRole, "") != "WebServer" || (try(self.WebServerType, null) != null && contains(["nginx", "apache"], self.WebServerType))
    error_message = "If 'SystemRole' is 'WebServer', the 'WebServerType' tag must exist and be 'nginx' or 'apache'."
  }
  validation {
    condition     = try(self.SystemRole, "") != "WebServer" || (try(self.PhpVersion, null) != null && can(regex("^\\d+(\\.\\d+){1,2}$", self.PhpVersion)))
    error_message = "If 'SystemRole' is 'WebServer', the 'PhpVersion' tag must exist and match a version format (e.g., '8.1', '7.4.3')."
  }

  # MySQLClusterNode specific validations
  validation {
    condition     = try(self.SystemRole, "") != "MySQLClusterNode" || (try(self.MySQLClusterName, null) != null && self.MySQLClusterName != "")
    error_message = "If 'SystemRole' is 'MySQLClusterNode', the 'MySQLClusterName' tag must exist and cannot be empty."
  }
  validation {
    condition     = try(self.SystemRole, "") != "MySQLClusterNode" || (try(self.MySQLNodeRole, null) != null && contains(["primary", "replica", "arbiter"], self.MySQLNodeRole))
    error_message = "If 'SystemRole' is 'MySQLClusterNode', the 'MySQLNodeRole' tag must exist and be 'primary', 'replica', or 'arbiter'."
  }
  validation {
    condition     = try(self.SystemRole, "") != "MySQLClusterNode" || (try(self.DBVersion, null) != null && can(regex("^\\d+(\\.\\d+){1,2}$", self.DBVersion)))
    error_message = "If 'SystemRole' is 'MySQLClusterNode', the 'DBVersion' tag must exist and match a version format (e.g., '8.0', '5.7.30')."
  }

  # StandaloneDB specific validations
  validation {
    condition     = try(self.SystemRole, "") != "StandaloneDB" || (try(self.DBType, null) != null && contains(["mysql", "postgres"], self.DBType))
    error_message = "If 'SystemRole' is 'StandaloneDB', the 'DBType' tag must exist and be 'mysql' or 'postgres'."
  }
  validation {
    condition     = try(self.SystemRole, "") != "StandaloneDB" || (try(self.DBVersion, null) != null && can(regex("^\\d+(\\.\\d+){1,2}$", self.DBVersion)))
    error_message = "If 'SystemRole' is 'StandaloneDB', the 'DBVersion' tag must exist and match a version format."
  }
}
