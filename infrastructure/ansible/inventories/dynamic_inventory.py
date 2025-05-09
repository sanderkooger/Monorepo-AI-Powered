#!/usr/bin/env python3
import json
import os
import subprocess
import hvac
import sys
from argparse import ArgumentParser

def get_terraform_outputs():
    try:
        result = subprocess.run(
            ["tofu", "output", "-json"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        return json.loads(result.stdout.decode())
    except subprocess.CalledProcessError as e:
        sys.stderr.write(f"Terraform error: {e.stderr.decode()}\n")
        sys.exit(1)
    except json.JSONDecodeError:
        sys.stderr.write("Failed to parse Terraform outputs\n")
        sys.exit(1)

def vault_auth(vault_addr, role_id, secret_id):
    client = hvac.Client(url=vault_addr)
    try:
        auth = client.auth.approle.login(
            role_id=role_id,
            secret_id=secret_id,
        )
        if not auth['auth']['client_token']:
            raise ValueError("Authentication failed: No token received")
        return auth['auth']['client_token']
    except hvac.exceptions.VaultError as e:
        sys.stderr.write(f"Vault connection error: {str(e)}\n")
        sys.exit(1)

def generate_inventory(tf_outputs):
    inventory = {"_meta": {"hostvars": {}}}
    
    # Group hosts by resource type
    for resource, attrs in tf_outputs.items():
        if not isinstance(attrs, dict) or 'value' not in attrs:
            continue
            
        resource_type = attrs.get('type', 'ungrouped')
        host_vars = {
            'ansible_host': attrs['value'].get('vm_ip_address'),
            'vault_secret_path': attrs['value'].get('vault_path')
        }
        
        inventory.setdefault(resource_type, {'hosts': []})
        inventory[resource_type]['hosts'].append(resource)
        inventory['_meta']['hostvars'][resource] = host_vars
    
    return inventory

def main():
    parser = ArgumentParser(description='Dynamic Ansible Inventory')
    parser.add_argument('--list', action='store_true', help='List inventory')
    args = parser.parse_args()
    
    if not args.list:
        sys.stderr.write("This script only supports --list\n")
        sys.exit(1)

    try:
        tf_outputs = get_terraform_outputs()
        
        # Get Vault credentials from Terraform outputs
        role_id = tf_outputs.get('vault_approle_role_id', {}).get('value')
        secret_id = tf_outputs.get('vault_approle_secret_id', {}).get('value')
        vault_addr = os.getenv('VAULT_ADDR')
        
        if not all([role_id, secret_id]):
            raise ValueError("Missing Vault AppRole credentials in Terraform outputs")
        if not vault_addr:
            raise ValueError("VAULT_ADDR environment variable not set")
            
        # Authenticate with Vault
        vault_token = vault_auth(vault_addr, role_id, secret_id)
        os.environ['VAULT_TOKEN'] = vault_token
        
        inventory = generate_inventory(tf_outputs)
        print(json.dumps(inventory))
        
    except Exception as e:
        sys.stderr.write(f"Critical error: {str(e)}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()