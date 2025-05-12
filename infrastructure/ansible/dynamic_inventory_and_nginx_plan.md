# Plan: Dynamic Inventory and Nginx Installation with Ansible

This plan outlines the steps to create a dynamic Ansible inventory script based on OpenTofu output and configure Ansible to install Nginx on the provisioned servers.

**Phase 1: Dynamic Inventory Script**

1.  **Goal and Script Overview**
    *   **Objective:** Create a Python script named `dynamic_inventory.py` in `infrastructure/ansible/inventories/`.
    *   **Functionality:** Parse `infrastructure/opentofu/tofuShow.json` to generate Ansible-compatible JSON inventory.
    *   **Nginx Context:** Identify and group servers for Nginx installation.

2.  **Process Flow (Dynamic Inventory)**
    ```mermaid
    graph TD
        A[tofuShow.json] --> B{Dynamic Inventory Script (dynamic_inventory.py)};
        B -- Parses --> A;
        B -- Generates --> C{Ansible Inventory JSON Output};
    ```

3.  **Python Script Details (`dynamic_inventory.py`)**
    *   **Language:** Python 3.
    *   **Location:** `infrastructure/ansible/inventories/dynamic_inventory.py`
    *   **Arguments:** Handles `--list` and `--host <hostname>`.
    *   **Input:** Reads `infrastructure/opentofu/tofuShow.json`.
    *   **Permissions:** The script should be made executable (`chmod +x`).

4.  **Data Extraction Logic**
    *   Load and parse the JSON content from `infrastructure/opentofu/tofuShow.json`.
    *   Navigate to the `values.outputs` section.
    *   Iterate through each key in `values.outputs` that represents a VM (e.g., ending with `_ansible_data`).
    *   For each identified VM output, extract the following from its `value` object:
        *   `fqdn` (e.g., "ubuntu-test-1-prod.lab.local")
        *   `ip_address` (e.g., "192.168.1.10")
        *   `ansible_user` (e.g., "bootstrap_user")
        *   `tags` (e.g., `{"Environment": "prod", "SystemRole": "WebServer", "WebServerType": "nginx"}`)

5.  **Ansible Inventory JSON Output Structure**
    The script will generate JSON in the standard Ansible dynamic inventory format:
    ```json
    {
      "_meta": {
        "hostvars": {
          // Example for one host:
          // "ubuntu-test-1-prod.lab.local": {
          //   "ansible_host": "192.168.1.10",
          //   "ansible_user": "bootstrap_user",
          //   "instance_name": "ubuntu-test-1-prod",
          //   "Environment": "prod",
          //   "PhpVersion": "8.2",
          //   "Project": "Monorepo-AI-Powered",
          //   "Provisioner": "opentofu",
          //   "SystemRole": "WebServer",
          //   "WebServerType": "nginx"
          //   // ... any other relevant extracted fields or tags as host variables
          // }
          // ... other hosts
        }
      },
      "all": {
        "hosts": [/* list of all fqdns */],
        "vars": {} // Global variables for all hosts, if any
      },
      "nginx_hosts": { // Group for hosts intended for Nginx
        "hosts": [/* list of fqdns where tags.WebServerType is 'nginx' */],
        "vars": {}
      },
      "webservers": { // Group based on SystemRole: WebServer
        "hosts": [/* list of fqdns where tags.SystemRole is 'WebServer' */],
        "vars": {}
      }
      // Other groups can be dynamically created based on other unique tag key-value pairs
      // (excluding 'Environment' as per previous discussion).
    }
    ```

**Phase 2: Ansible Configuration for Nginx Installation**

1.  **Goal:** Configure Ansible to install Nginx on servers identified by the dynamic inventory, specifically those in the `nginx_hosts` group.

2.  **Process Flow (Ansible Nginx Installation)**
    ```mermaid
    graph TD
        C{Ansible Inventory JSON Output} --> D[Ansible Engine];
        D -- Uses groups/vars --> E[Nginx Playbook (e.g., setup_nginx.yml)];
        E -- Leverages --> H[Nginx Role (infrastructure/ansible/roles/nginx)];
        H -- Executes tasks on --> F[Targeted Ubuntu Servers (nginx_hosts group)];
        F -- Nginx installed --> G[Nginx Service Running];
    ```

3.  **Ansible Playbook (`setup_nginx.yml`)**
    *   **Location:** `infrastructure/ansible/playbooks/setup_nginx.yml` (Create if not exists).
    *   **Content:**
        ```yaml
        ---
        - name: Setup Nginx on Web Servers
          hosts: nginx_hosts # Targets hosts from the dynamic inventory group
          become: yes        # Ensures tasks run with sudo
          roles:
            - nginx          # Uses the nginx role
        ```

4.  **Ansible Role: `nginx` (`infrastructure/ansible/roles/nginx/`)**
    *   **Tasks (`tasks/main.yml`):** (Existing file, content is mostly suitable)
        *   Ensure Nginx package is installed using `ansible.builtin.apt`.
        *   Apply Nginx configuration using `ansible.builtin.template` from `templates/nginx.conf.j2`.
        *   Ensure Nginx service is enabled and running using `ansible.builtin.service`.
    *   **Handlers (`handlers/main.yml`):** (Update/Create)
        *   Define a handler named `reload nginx`.
            ```yaml
            ---
            # Handlers for nginx role
            - name: reload nginx
              ansible.builtin.service:
                name: nginx
                state: reloaded
            ```
    *   **Templates (`templates/`):**
        *   Create `nginx.conf.j2` in `infrastructure/ansible/roles/nginx/templates/nginx.conf.j2`.
        *   **Initial Content for `nginx.conf.j2`:**
            ```nginx
            user www-data;
            worker_processes auto;
            pid /run/nginx.pid;
            include /etc/nginx/modules-enabled/*.conf;

            events {
                worker_connections 768;
                # multi_accept on;
            }

            http {
                sendfile on;
                tcp_nopush on;
                types_hash_max_size 2048;

                include /etc/nginx/mime.types;
                default_type application/octet-stream;

                ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3; # Dropping SSLv3, ref: POODLE
                ssl_prefer_server_ciphers on;

                access_log /var/log/nginx/access.log;
                error_log /var/log/nginx/error.log;

                gzip on;

                include /etc/nginx/conf.d/*.conf;
                include /etc/nginx/sites-enabled/*;

                # Basic default server block
                server {
                    listen 80 default_server;
                    listen [::]:80 default_server;

                    server_name _; # Catch-all

                    root /var/www/html;
                    index index.html index.htm;

                    location / {
                        try_files $uri $uri/ =404;
                    }
                }
            }
            ```

5.  **Ansible Configuration (`ansible.cfg`)**
    *   Ensure `infrastructure/ansible/ansible.cfg` is configured to use the dynamic inventory script from the `inventories/` directory.
    *   Example relevant line: `inventory = ./inventories`

**Execution Flow**

1.  OpenTofu applies infrastructure changes and outputs `tofuShow.json`.
2.  User runs `ansible-playbook -i infrastructure/ansible/inventories/ playbooks/setup_nginx.yml`.
    *   Ansible executes `dynamic_inventory.py --list` (if executable and in the inventory path) to get all hosts and groups.
    *   The playbook targets the `nginx_hosts` group.
    *   For each host in `nginx_hosts`, Ansible may call `dynamic_inventory.py --host <hostname>` to get its variables (though often `--list` is sufficient if `_meta` is well-formed).
    *   The `nginx` role tasks are executed on each targeted host.

This plan provides a comprehensive approach to automating your Nginx setup using dynamic inventories.