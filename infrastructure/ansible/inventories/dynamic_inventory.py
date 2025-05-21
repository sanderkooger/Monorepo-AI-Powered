#!/usr/bin/env python3

import json
import sys
import os
import subprocess
import time # Import time for potential future use (e.g., caching tofu state)

def find_executable(name):
    """Searches for the executable in the directories listed in the PATH."""
    path_dirs = os.environ.get("PATH", "").split(os.pathsep)
    for directory in path_dirs:
        executable_path = os.path.join(directory, name)
        if os.path.isfile(executable_path) and os.access(executable_path, os.X_OK):
            return executable_path
    return None

def find_ansible_hosts(module_data, inventory):
    """Recursively finds ansible_host resources in module data and adds them to inventory."""
    # Check resources directly in this module
    for resource in module_data.get("resources", []):
        if resource.get("type") == "ansible_host":
            host_name = resource.get("values", {}).get("name")
            groups = resource.get("values", {}).get("groups", [])
            variables = resource.get("values", {}).get("variables", {})

            if host_name:
                # Add host-specific variables to _meta.hostvars
                host_vars = {
                    "ansible_host": host_name, # Ensure ansible_host is set
                    "ansible_user": "ansible", # Default user based on cloud-init

                    # Add other variables from the tofu resource
                    **variables
                }

                # Check for ansible_ssh_jumphost and add ProxyJump if present
                if "ansible_ssh_jumphost" in variables and variables["ansible_ssh_jumphost"]:
                    # Construct the ProxyJump command using the jumphost variable and ansible_user
                    # Assumes the local SSH agent is configured with the Vault-signed cert for the jumphost user
                    host_vars["ansible_ssh_common_args"] = f'-J {host_vars["ansible_user"]}@{variables["ansible_ssh_jumphost"]}'

                # Add host-specific variables to _meta.hostvars
                inventory["_meta"]["hostvars"][host_name] = host_vars

                # Add the host to its respective groups
                if not groups:
                    # Add to 'ungrouped' if no groups are specified
                    if "ungrouped" not in inventory:
                        inventory["ungrouped"] = {"hosts": []}
                    if host_name not in inventory["ungrouped"]["hosts"]:
                        inventory["ungrouped"]["hosts"].append(host_name)
                else:
                    for group in groups:
                        if group not in inventory:
                            inventory[group] = {
                                "hosts": []
                            }
                        if host_name not in inventory[group]["hosts"]:
                            inventory[group]["hosts"].append(host_name)

    # Recursively check child modules
    for child_module in module_data.get("child_modules", []):
        find_ansible_hosts(child_module, inventory)


def main():
    # Find the tofu executable in the PATH
    tofu_executable = find_executable("tofu")
    if not tofu_executable:
        print("Error: 'tofu' executable not found in PATH. Please ensure OpenTofu is installed and accessible.", file=sys.stderr)
        sys.exit(1)

    # Execute 'tofu show -json' using the found executable path
    try:
        # Ensure the command is run from the directory containing the tofu state
        # Assuming the script is run from the ansible directory,
        # we need to go up one level and then into opentofu
        tofu_dir = os.path.join(os.path.dirname(__file__), "..", "..", "opentofu")
        result = subprocess.run(
            [tofu_executable, "show", "-json"], # Use the full executable path
            cwd=tofu_dir, # Run the command in the opentofu directory
            capture_output=True,
            text=True,
            check=True # Raise an exception if the command fails
        )
        tofu_state_json = result.stdout
        if result.stderr:
             # Keep stderr print for actual errors from tofu command
             print(f"Tofu stderr:\n{result.stderr}", file=sys.stderr)

    except subprocess.CalledProcessError as e:
        print(f"Error executing '{tofu_executable} show -json': {e}", file=sys.stderr)
        print(f"Stderr: {e.stderr}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred while running '{tofu_executable} show -json': {e}", file=sys.stderr)
        sys.exit(1)


    # Load the JSON output
    try:
        tofu_state = json.loads(tofu_state_json)
    except json.JSONDecodeError:
        print("Error: Invalid JSON received from 'tofu show -json'.", file=sys.stderr)
        sys.exit(1)

    # Initialize the Ansible inventory structure
    inventory = {
        "_meta": {
            "hostvars": {}
        },
        # Initialize 'all' group with 'ungrouped' as a child
        "all": {
            "children": ["ungrouped"]
        },
        "ungrouped": {
            "hosts": []
        }
    }

    # Start the recursive search from the root module
    root_module_data = tofu_state.get("values", {}).get("root_module", {})
    find_ansible_hosts(root_module_data, inventory)

    # Ensure all found groups are children of 'all'
    for group_name in inventory.keys():
        if group_name != "_meta" and group_name != "all" and group_name != "ungrouped":
             if group_name not in inventory["all"]["children"]:
                 inventory["all"]["children"].append(group_name)


    # Output the inventory in JSON format
    print(json.dumps(inventory, indent=2))
    # Removed explicit flush, revert to standard print behavior
    # sys.stdout.flush()

if __name__ == "__main__":
    main()