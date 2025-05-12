#!/usr/bin/env python3

import json
import argparse
import os
import sys
import stat

def get_script_directory():
    """Gets the directory where the script is located."""
    return os.path.dirname(os.path.realpath(__file__))

def get_project_root(script_dir):
    """Determines the project root directory based on the script's location."""
    # Assumes script is in infrastructure/ansible/inventories/
    # and project root is two levels up from 'inventories'
    return os.path.abspath(os.path.join(script_dir, "..", ".."))

def ensure_keys_directory_exists(project_root):
    """Ensures the .keys directory exists and returns its path."""
    keys_dir = os.path.join(project_root, "ansible", ".keys")
    os.makedirs(keys_dir, exist_ok=True)
    return keys_dir

def parse_tofu_show_data(tofu_output_path):
    """Parses the entire OpenTofu output JSON file."""
    try:
        with open(tofu_output_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: OpenTofu output file not found at {tofu_output_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {tofu_output_path}", file=sys.stderr)
        sys.exit(1)

def extract_bootstrap_user_private_key(tofu_data):
    """
    Extracts the private key for 'bootstrap_user_' from the tofu_data.
    Assumes there's only one such user or the first one found is the correct one.
    """
    resources = tofu_data.get("values", {}).get("root_module", {}).get("resources", [])
    for resource in resources:
        if resource.get("type") == "vault_kv_secret_v2" and resource.get("name") == "bootstrap_user_":
            priv_key = resource.get("values", {}).get("data", {}).get("priv_key")
            if priv_key:
                return priv_key
    print("Warning: bootstrap_user_ private key not found in tofuShow.json resources.", file=sys.stderr)
    return None

def save_private_key_to_file(key_content, fqdn, keys_dir):
    """Saves the private key to a file and sets permissions."""
    # Sanitize fqdn for filename
    safe_fqdn = "".join(c if c.isalnum() or c in ['.', '-'] else '_' for c in fqdn)
    key_filename = f"bootstrap_user_pk_for_{safe_fqdn}.pem"
    key_filepath = os.path.join(keys_dir, key_filename)

    try:
        with open(key_filepath, 'w') as f:
            f.write(key_content)
        # Set permissions to 0600 (owner read/write only)
        os.chmod(key_filepath, stat.S_IRUSR | stat.S_IWUSR)
        return key_filepath
    except IOError as e:
        print(f"Error writing or setting permissions for key file {key_filepath}: {e}", file=sys.stderr)
        return None

def generate_inventory(tofu_data, keys_dir):
    """Generates Ansible inventory JSON from parsed OpenTofu data."""
    inventory = {
        "_meta": {"hostvars": {}},
        "all": {"hosts": [], "vars": {}},
    }
    
    outputs = tofu_data.get("values", {}).get("outputs", {})
    if not outputs:
        return inventory

    bootstrap_user_priv_key_content = extract_bootstrap_user_private_key(tofu_data)

    for output_name, output_data in outputs.items():
        if not isinstance(output_data, dict) or "value" not in output_data:
            continue
        
        vm_details = output_data.get("value", {})
        if not isinstance(vm_details, dict):
            continue

        fqdn = vm_details.get("fqdn")
        ip_address = vm_details.get("ip_address")
        ansible_user = vm_details.get("ansible_user")
        tags = vm_details.get("tags", {})
        instance_name = vm_details.get("instance_name")

        if not fqdn or not ip_address:
            continue

        host_vars = {
            "ansible_host": ip_address,
            "ansible_user": ansible_user,
            "instance_name": instance_name,
        }

        # If this host uses bootstrap_user and we found its key, save it and set var
        if ansible_user == "bootstrap_user" and bootstrap_user_priv_key_content:
            key_file_path = save_private_key_to_file(bootstrap_user_priv_key_content, fqdn, keys_dir)
            if key_file_path:
                host_vars["ansible_ssh_private_key_file"] = key_file_path
        
        if isinstance(tags, dict):
            for tag_key, tag_value in tags.items():
                host_vars[tag_key] = tag_value
        
        inventory["_meta"]["hostvars"][fqdn] = host_vars

        if fqdn not in inventory["all"]["hosts"]:
            inventory["all"]["hosts"].append(fqdn)

        if isinstance(tags, dict):
            if tags.get("WebServerType") == "nginx":
                if "nginx_hosts" not in inventory:
                    inventory["nginx_hosts"] = {"hosts": [], "vars": {}}
                if fqdn not in inventory["nginx_hosts"]["hosts"]:
                    inventory["nginx_hosts"]["hosts"].append(fqdn)
            
            if tags.get("SystemRole") == "WebServer":
                if "webservers" not in inventory:
                    inventory["webservers"] = {"hosts": [], "vars": {}}
                if fqdn not in inventory["webservers"]["hosts"]:
                    inventory["webservers"]["hosts"].append(fqdn)

            for tag_key, tag_value in tags.items():
                if tag_key == "Environment":
                    continue
                if isinstance(tag_value, str) and tag_value:
                    group_name = f"tag_{tag_key}_{tag_value.lower().replace(' ', '_')}"
                    if group_name not in inventory:
                        inventory[group_name] = {"hosts": [], "vars": {}}
                    if fqdn not in inventory[group_name]["hosts"]:
                        inventory[group_name]["hosts"].append(fqdn)
                        
    return inventory

def main():
    parser = argparse.ArgumentParser(description="Ansible dynamic inventory script from OpenTofu output.")
    parser.add_argument('--list', action='store_true', help="List all inventory groups and hosts.")
    parser.add_argument('--host', help="Get all variables for a specific host.")
    args = parser.parse_args()

    script_dir = get_script_directory()
    project_root = get_project_root(script_dir)
    tofu_output_file = os.path.join(project_root, "opentofu", "tofuShow.json")
    keys_dir = ensure_keys_directory_exists(project_root) # Ensures .keys directory exists

    tofu_data = parse_tofu_show_data(tofu_output_file) # Parse the whole show file
    inventory = generate_inventory(tofu_data, keys_dir) # Pass full data and keys_dir

    if args.list:
        print(json.dumps(inventory, indent=2))
    elif args.host:
        host_vars = inventory["_meta"]["hostvars"].get(args.host, {})
        print(json.dumps(host_vars, indent=2))
    else:
        print(json.dumps(inventory, indent=2))

if __name__ == "__main__":
    main()