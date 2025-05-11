# Terraform Ansible Interface Module

## Overview

This Terraform module serves as an interface to gather and structure data for machines that will be managed by Ansible. It does not create any cloud resources itself but rather defines a contract for the information required to describe a host for Ansible, including its identity, network details, Ansible connection parameters, and a strictly validated set of tags defining its role and configuration.

The primary output is a structured map (`ansible_host_data`) intended to be consumed by other Terraform configurations or by a dynamic inventory script for Ansible.

## Inputs

The module accepts the following input variables:

### `instance_name`
- Description: The name of the instance.
- Type: `string`
- Example: `"my-web-server-01"`

### `ip_address`
- Description: The IP address of the instance.
- Type: `string`
- Example: `"192.168.1.10"`

### `fqdn`
- Description: The Fully Qualified Domain Name of the instance.
- Type: `string`
- Example: `"my-web-server-01.example.com"`

### `ansible_user`
- Description: The username for Ansible to use for SSH connections.
- Type: `string`
- Default: `"ansible"`

### `ansible_public_key`
- Description: The SSH public key to be installed on the instance for the `ansible_user`. This key is typically provisioned by the module that creates the actual compute resource.
- Type: `string`
- Note: This variable is expected to be provided and has no default.

### `tags`
- Description: A map of tags to assign to the instance, defining its role and specific configuration attributes. This input is subject to strict validation rules.
- Type: `map(string)`
- Default: `{}` (Note: An empty map will fail validation due to mandatory tags.)

#### Tag Validation Rules:

The `tags` map must adhere to the following structure and rules:

1.  **Mandatory Base Tags:**
    *   `Provisioner` (string): Must exist and cannot be empty. Identifies the system that provisioned the resource.
        *   Example: `Provisioner = "opentofu"`
    *   `SystemRole` (string): Must exist. Defines the primary functional role of the machine.
        *   Allowed values: `"KubernetesNode"`, `"WebServer"`, `"MySQLClusterNode"`, `"StandaloneDB"`

2.  **Conditional Tags based on `SystemRole`:**

    *   **If `SystemRole = "KubernetesNode"`:**
        *   `K8sClusterName` (string): Must exist.
            *   Allowed values: `"alpha"`, `"bravo"`
        *   `K8sNodeRole` (string): Must exist.
            *   Allowed values: `"control-plane"`, `"worker"`

    *   **If `SystemRole = "WebServer"`:**
        *   `WebServerType` (string): Must exist.
            *   Allowed values: `"nginx"`, `"apache"`
        *   `PhpVersion` (string): Must exist. Must match a version format (e.g., "8.1", "7.4.3").
            *   Regex: `^\\d+(\\.\\d+){1,2}$`

    *   **If `SystemRole = "MySQLClusterNode"`:**
        *   `MySQLClusterName` (string): Must exist and cannot be empty.
            *   Example: `MySQLClusterName = "main_db_cluster"`
        *   `MySQLNodeRole` (string): Must exist.
            *   Allowed values: `"primary"`, `"replica"`, `"arbiter"`
        *   `DBVersion` (string): Must exist. Must match a version format (e.g., "8.0", "5.7.30").
            *   Regex: `^\\d+(\\.\\d+){1,2}$`
            *   (Note: `DBType` is implicitly "mysql" for this role).

    *   **If `SystemRole = "StandaloneDB"`:**
        *   `DBType` (string): Must exist.
            *   Allowed values: `"mysql"`, `"postgres"`
        *   `DBVersion` (string): Must exist. Must match a version format.
            *   Regex: `^\\d+(\\.\\d+){1,2}$`

#### Example `tags` Input:

```hcl
tags = {
  Provisioner    = "opentofu"
  SystemRole     = "KubernetesNode"
  K8sClusterName = "alpha"
  K8sNodeRole    = "worker"
}
```

```hcl
tags = {
  Provisioner   = "opentofu"
  SystemRole    = "WebServer"
  WebServerType = "nginx"
  PhpVersion    = "8.2"
}
```

## Outputs

The module provides the following output:

### `ansible_host_data`
- Description: A structured map containing all relevant data for an Ansible inventory host, including all input variables and the validated `tags`. This output is marked as `sensitive = true` because it includes the `ansible_public_key` and the `tags` map which might contain configuration details.
- Structure Example:
  ```json
  {
    "instance_name": "k8s-worker-01",
    "ip_address": "192.168.1.100",
    "fqdn": "k8s-worker-01.example.com",
    "ansible_user": "ansible",
    "ansible_public_key": "ssh-rsa AAAA...",
    "tags": {
      "Provisioner": "opentofu",
      "SystemRole": "KubernetesNode",
      "K8sClusterName": "alpha",
      "K8sNodeRole": "worker"
    }
  }
  ```

## Usage with Ansible

The `ansible_host_data` output from this module is designed to be consumed by a dynamic inventory script for Ansible. The script would parse the Terraform output (e.g., from `terraform output -json`) and generate the JSON structure expected by Ansible.

The `ansible_user` field should be used by Ansible for SSH connections. The `tags` map and other fields within `ansible_host_data` can be used as host variables (`hostvars`) in Ansible to:
-   Group hosts dynamically.
-   Apply role-specific configurations conditionally based on `SystemRole` and other tags.
-   Pass specific configuration parameters (like `K8sClusterName`, `PhpVersion`, etc.) to Ansible roles and tasks.

This ensures that Ansible has access to a rich, validated set of metadata for each managed host.