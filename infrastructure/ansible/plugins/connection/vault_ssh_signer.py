from __future__ import (absolute_import, division, print_function)
__metaclass__ = type

import os
import re
import subprocess
import time
from datetime import datetime, timezone, timedelta

from ansible.errors import AnsibleError, AnsibleConnectionFailure
from ansible.plugins.connection.ssh import Connection as SSHConnection
from ansible.utils.display import Display
from ansible import constants as C

display = Display()

# Class-level cache to track if this *process* has already performed
# the primary logging for a specific host's certificate status.
# This was moved into the class in the previous correction.

DOCUMENTATION = '''
    connection: vault_ssh_signer
    short_description: SSH connection that ensures a fresh Vault-signed SSH certificate.
    description:
        - This plugin wraps the standard SSH connection. Before connecting, it checks for a valid
          SSH certificate signed by HashiCorp Vault. If the certificate is missing, expired, or
          nearing expiry (based on key_min_ttl_seconds), it requests a new one from Vault
          using the 'vault' CLI.
        - The Ansible controller must have the 'vault' and 'ssh-keygen' CLIs installed and configured
          for non-interactive authentication to Vault.
        - The Vault signing path is derived by transforming the 'vault_ssh_ca_signing_role' variable
          (e.g., 'ssh-engine/roles/my-role' becomes 'ssh-engine/sign/my-role').
        - The principal for the certificate is sourced directly from the 'vault_ssh_ca_principal'
          inventory variable.
    author: "Your Name (Vault SSH signer)"
    extends_documentation_fragment:
        - connection_pipelining
    version_added: "2.10" # Or your actual version
    notes:
        - This plugin inherits most of its SSH behavior from the standard 'ssh' connection plugin.
        - The Vault SSH signing logic is prepended to the connection process.
        - The principal for the certificate is sourced directly from the 'vault_ssh_ca_principal' inventory variable, which is required.
        - At default verbosity (no -v), it primarily logs if a certificate needs renewal and the outcome of that renewal.
        - If a certificate is already fresh and requires no action, it logs nothing by default. Use -vvv (triple verbosity) for confirmation of a fresh certificate's status.
        - Other verbose messages related to the process (e.g., reasons for renewal if not forced) may appear with -v.
    options:
      # --- Standard SSH options (mirrored from ssh.py for compatibility) ---
      host:
          description: Hostname/IP to connect to.
          default: inventory_hostname
          type: string
          vars:
               - name: inventory_hostname
               - name: ansible_host
               - name: ansible_ssh_host
      port:
          description: Remote port to connect to.
          type: int
          ini:
            - {section: defaults, key: remote_port}
          env:
            - name: ANSIBLE_REMOTE_PORT
          vars:
            - name: ansible_port
            - name: ansible_ssh_port
          default: 22
      remote_user:
          description:
              - User name with which to login to the remote server, normally set by the remote_user keyword.
          type: string
          ini:
            - {section: defaults, key: remote_user}
          env:
            - name: ANSIBLE_REMOTE_USER
          vars:
            - name: ansible_user # This is the key for inventory "ansible_user"
            - name: ansible_ssh_user
            - name: remote_user
      password:
          description: Authentication password for the O(remote_user). Can be supplied as CLI option.
          type: string
          vars:
              - name: ansible_password
              - name: ansible_ssh_pass
              - name: ansible_ssh_password
      sshpass_prompt:
          description:
              - Password prompt that sshpass should search for. Supported by sshpass 1.06 and up.
              - Defaults to C(Enter PIN for) when pkcs11_provider is set.
          default: ''
          type: string
          ini:
              - {section: 'ssh_connection', key: 'sshpass_prompt'}
          env:
              - name: ANSIBLE_SSHPASS_PROMPT
          vars:
              - name: ansible_sshpass_prompt
      private_key_file:
          description: Path to private key file to use for authentication.
          type: path
          ini:
            - {section: defaults, key: private_key_file}
          env:
            - name: ANSIBLE_PRIVATE_KEY_FILE
          vars:
            - name: ansible_private_key_file
            - name: ansible_ssh_private_key_file
      ssh_executable:
          default: ssh
          description:
            - This defines the location of the SSH binary. It defaults to V(ssh) which will use the first SSH binary available in $PATH.
          type: string
          env: [{name: ANSIBLE_SSH_EXECUTABLE}]
          ini:
          - {key: ssh_executable, section: ssh_connection}
          vars:
              - name: ansible_ssh_executable
      sftp_executable:
          default: sftp
          description:
            - This defines the location of the sftp binary. It defaults to V(sftp) which will use the first binary available in $PATH.
          type: string
          env: [{name: ANSIBLE_SFTP_EXECUTABLE}]
          ini:
          - {key: sftp_executable, section: ssh_connection}
          vars:
              - name: ansible_sftp_executable
      scp_executable:
          default: scp
          description:
            - This defines the location of the scp binary. It defaults to V(scp) which will use the first binary available in $PATH.
          type: string
          env: [{name: ANSIBLE_SCP_EXECUTABLE}]
          ini:
          - {key: scp_executable, section: ssh_connection}
          vars:
              - name: ansible_scp_executable
      ssh_args:
          description: Arguments to pass to all SSH CLI tools.
          default: '-C -o ControlMaster=auto -o ControlPersist=60s'
          type: string
          ini:
              - {section: 'ssh_connection', key: 'ssh_args'}
          env:
              - name: ANSIBLE_SSH_ARGS
          vars:
              - name: ansible_ssh_args
      ssh_common_args:
          description: Common extra args for all SSH CLI tools.
          type: string
          ini:
              - {section: 'ssh_connection', key: 'ssh_common_args'}
          env:
              - name: ANSIBLE_SSH_COMMON_ARGS
          vars:
              - name: ansible_ssh_common_args
          default: ''
      scp_extra_args:
          description: Extra exclusive to the C(scp) CLI
          type: string
          vars:
              - name: ansible_scp_extra_args
          env:
            - name: ANSIBLE_SCP_EXTRA_ARGS
          ini:
            - {key: scp_extra_args, section: ssh_connection}
          default: ''
      sftp_extra_args:
          description: Extra exclusive to the C(sftp) CLI
          type: string
          vars:
              - name: ansible_sftp_extra_args
          env:
            - name: ANSIBLE_SFTP_EXTRA_ARGS
          ini:
            - {key: sftp_extra_args, section: ssh_connection}
          default: ''
      ssh_extra_args:
          description: Extra exclusive to the SSH CLI.
          type: string
          vars:
              - name: ansible_ssh_extra_args
          env:
            - name: ANSIBLE_SSH_EXTRA_ARGS
          ini:
            - {key: ssh_extra_args, section: ssh_connection}
          default: ''
      reconnection_retries:
          description: Number of attempts to connect.
          default: 0
          type: integer
          env:
            - name: ANSIBLE_SSH_RETRIES
          ini:
            - {section: ssh_connection, key: retries}
          vars:
            - name: ansible_ssh_retries
      control_path:
        description:
          - This is the location to save SSH's ControlPath sockets, it uses SSH's variable substitution.
        type: string
        env:
          - name: ANSIBLE_SSH_CONTROL_PATH
        ini:
          - {key: control_path, section: ssh_connection}
        vars:
          - name: ansible_control_path
          - name: ansible_ssh_control_path
      control_path_dir:
        default: "~/.ansible/cp"
        description:
          - This sets the directory to use for ssh control path if the control path setting is null.
        type: path
        env:
          - name: ANSIBLE_SSH_CONTROL_PATH_DIR
        ini:
          - {section: ssh_connection, key: control_path_dir}
        vars:
          - name: ansible_control_path_dir
          - name: ansible_ssh_control_path_dir
      sftp_batch_mode:
        default: true
        description: 'If set to true, sftp will operate in batch mode, which disables interactive prompts.'
        env: [{name: ANSIBLE_SFTP_BATCH_MODE}]
        ini:
        - {key: sftp_batch_mode, section: ssh_connection}
        type: boolean
        vars:
          - name: ansible_sftp_batch_mode
      ssh_transfer_method:
        description: Preferred method to use when transferring files over ssh
        choices: ["sftp", "scp", "piped", "smart"]
        default: smart
        type: string
        env: [{name: ANSIBLE_SSH_TRANSFER_METHOD}]
        ini:
            - {key: transfer_method, section: ssh_connection}
        vars:
            - name: ansible_ssh_transfer_method
      use_tty:
        default: true
        description: add -tt to ssh commands to force tty allocation.
        env: [{name: ANSIBLE_SSH_USETTY}]
        ini:
        - {key: usetty, section: ssh_connection}
        type: boolean
        vars:
          - name: ansible_ssh_use_tty
      timeout:
        default: 10
        description:
            - This is the default amount of time we will wait while establishing an SSH connection.
        env:
            - name: ANSIBLE_TIMEOUT
            - name: ANSIBLE_SSH_TIMEOUT
        ini:
            - {key: timeout, section: defaults}
            - {key: timeout, section: ssh_connection}
        vars:
          - name: ansible_ssh_timeout
          - name: ansible_timeout
        type: integer
      host_key_checking:
          description: Determines if SSH should reject or not a connection after checking host keys.
          default: True
          type: boolean
          ini:
              - {section: defaults, key: 'host_key_checking'}
              - {section: ssh_connection, key: 'host_key_checking'}
          env:
              - name: ANSIBLE_HOST_KEY_CHECKING
              - name: ANSIBLE_SSH_HOST_KEY_CHECKING
          vars:
              - name: ansible_host_key_checking
              - name: ansible_ssh_host_key_checking
      host_key_auto_add:
        description: If host_key_checking is enabled and this is True, automatically add new host keys.
        type: boolean
        default: False
        env: [{name: ANSIBLE_SSH_HOST_KEY_AUTO_ADD}]
        ini:
          - {section: ssh_connection, key: host_key_auto_add}
        vars:
          - name: ansible_ssh_host_key_auto_add
      pipelining:
          description: Controls if SSH pipelining is used.
          env:
            - name: ANSIBLE_PIPELINING
            - name: ANSIBLE_SSH_PIPELINING
          ini:
            - {section: ssh_connection, key: pipelining}
          vars:
            - name: ansible_pipelining
            - name: ansible_ssh_pipelining
          type: boolean
          default: False
      pkcs11_provider:
        default: ""
        type: string
        description:
          - "PKCS11 SmartCard provider such as opensc, example: /usr/local/lib/opensc-pkcs11.so"
        env: [{name: ANSIBLE_PKCS11_PROVIDER}]
        ini:
          - {key: pkcs11_provider, section: ssh_connection}
        vars:
          - name: ansible_ssh_pkcs11_provider
      pkcs11_pass:
        description: Password for the PKCS#11 token.
        type: string
        env: [{name: ANSIBLE_PKCS11_PASS}]
        ini:
          - {section: ssh_connection, key: pkcs11_pass}
        vars:
          - name: ansible_ssh_pkcs11_pass

      # --- Plugin-specific options (Vault SSH Signer) ---
      vault_ssh_ca_signing_role:
          description: "The Vault SSH CA signing role (e.g., 'Monorepo-AI-Powered-prod/ssh/roles/default-role'). This variable is REQUIRED. The plugin will transform this by replacing '/roles/' with '/sign/' to determine the actual Vault signing endpoint."
          type: string
          env: [{name: ANSIBLE_VAULT_SSH_CA_SIGNING_ROLE}]
          vars: [{name: vault_ssh_ca_signing_role}]

      vault_ssh_ca_principal:
          description: "The principal name to request for the SSH certificate (e.g., 'ansible'). This variable is REQUIRED and sourced from inventory."
          type: string
          env: [{name: ANSIBLE_VAULT_SSH_CA_PRINCIPAL}]
          vars: [{name: vault_ssh_ca_principal}]

      public_key_path:
          description: "Path to the SSH public key to be signed (e.g., '~/.ssh/id_rsa.pub')."
          default: "~/.ssh/id_rsa.pub"
          type: path
          env: [{name: ANSIBLE_VAULT_SSH_PUBLIC_KEY_PATH}]
          vars: [{name: vault_ssh_public_key_path}]

      signed_key_path:
          description: "Path to store the signed SSH certificate (e.g., '~/.ssh/id_rsa-cert.pub')."
          default: "~/.ssh/id_rsa-cert.pub"
          type: path
          env: [{name: ANSIBLE_VAULT_SSH_SIGNED_KEY_PATH}]
          vars: [{name: vault_ssh_signed_key_path}]

      key_min_ttl_seconds:
          description: "Minimum seconds the certificate should be valid for. If TTL is less, a new one is requested."
          type: int
          default: 3600
          env: [{name: ANSIBLE_VAULT_SSH_MIN_TTL_SECONDS}]
          vars: [{name: vault_ssh_key_min_ttl_seconds}]

      force_key_refresh:
          description: "Force refresh the SSH certificate even if it's still valid."
          type: bool
          default: false
          env: [{name: ANSIBLE_VAULT_SSH_FORCE_KEY_REFRESH}]
          vars: [{name: vault_ssh_force_key_refresh}]
'''

PLUGIN_NAME = "Vault SSH Signer"

class Connection(SSHConnection):
    transport = 'vault_ssh_signer'
    _host_logged_initial_cert_status_this_process = {}

    def __init__(self, *args, **kwargs):
        super(Connection, self).__init__(*args, **kwargs)
        self._resolved_public_key_path = None
        self._resolved_signed_key_path = None
        self._resolved_vault_sign_path = None
        self._resolved_vault_ssh_ca_principal = None
        self._resolved_key_min_ttl_seconds = None
        self._resolved_force_key_refresh = None
        # self._resolved_hello_world = None # Removed
        self._config_loaded = False
        self._vault_cert_operations_done_this_instance = False

    def _load_config(self):
        if self._config_loaded:
            return

        current_host = self.get_option('host')

        ca_signing_role = self.get_option('vault_ssh_ca_signing_role')
        if ca_signing_role is None:
            msg = (f"{PLUGIN_NAME} ({current_host}): Critical configuration missing. "
                   f"'vault_ssh_ca_signing_role' must be set in inventory or vars.")
            display.error(msg)
            raise AnsibleError(msg)

        if "/roles/" in ca_signing_role:
            self._resolved_vault_sign_path = ca_signing_role.replace("/roles/", "/sign/", 1)
            display.vv(f"{PLUGIN_NAME} ({current_host}): Using Vault sign path: {self._resolved_vault_sign_path} "
                       f"(transformed from 'vault_ssh_ca_signing_role': {ca_signing_role})")
        else:
            msg = (f"{PLUGIN_NAME} ({current_host}): Invalid 'vault_ssh_ca_signing_role' ('{ca_signing_role}'). "
                   f"It must contain '/roles/' to be transformed into a sign path. "
                   f"Example: 'your-ssh-engine/roles/your-role'.")
            display.error(msg)
            raise AnsibleError(msg)

        ca_principal = self.get_option('vault_ssh_ca_principal')
        if ca_principal is None:
            msg = (f"{PLUGIN_NAME} ({current_host}): Critical configuration missing. "
                   f"'vault_ssh_ca_principal' must be set in inventory or vars.")
            display.error(msg)
            raise AnsibleError(msg)
        self._resolved_vault_ssh_ca_principal = ca_principal
        display.vv(f"{PLUGIN_NAME} ({current_host}): Using principal from 'vault_ssh_ca_principal': {self._resolved_vault_ssh_ca_principal}")

        pkp_opt = self.get_option('public_key_path')
        self._resolved_public_key_path = os.path.expanduser(pkp_opt) if pkp_opt is not None else None

        skp_opt = self.get_option('signed_key_path')
        self._resolved_signed_key_path = os.path.expanduser(skp_opt) if skp_opt is not None else None

        self._resolved_key_min_ttl_seconds = self.get_option('key_min_ttl_seconds')
        self._resolved_force_key_refresh = self.get_option('force_key_refresh')
        # self._resolved_hello_world = self.get_option('hello_world') # Removed

        self._config_loaded = True

        display.vv(f"{PLUGIN_NAME} Config for host '{current_host}':")
        display.vv(f"  Vault Sign Path: {self._resolved_vault_sign_path}")
        display.vv(f"  Principal: {self._resolved_vault_ssh_ca_principal}")
        display.vv(f"  Public Key Path: {self._resolved_public_key_path}")
        display.vv(f"  Signed Key Path: {self._resolved_signed_key_path}")
        display.vv(f"  Key Min TTL (s): {self._resolved_key_min_ttl_seconds}")
        display.vv(f"  Force Key Refresh: {self._resolved_force_key_refresh}")
        # display.vv(f"  Hello World Var: {self._resolved_hello_world}") # Removed


    # def _say_hello_world(self): # Removed
    #     host_for_msg = self.get_option('host')
    #     display.display(f"{PLUGIN_NAME} ({host_for_msg}): Hello, {self._resolved_hello_world}!", color=C.COLOR_OK)


    def _get_cert_expiry_for_display(self):
        if not self._resolved_signed_key_path or not os.path.exists(self._resolved_signed_key_path):
            return "unknown (cert not found)"
        try:
            process = subprocess.run(['ssh-keygen', '-L', '-f', self._resolved_signed_key_path], capture_output=True, text=True, check=False, errors='ignore')
            if process.returncode == 0:
                valid_to_regex = re.compile(r"Valid:\s+.*?to\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)")
                not_after_regex = re.compile(r"Not\s+after:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)")
                timestamp_str = None
                for line in process.stdout.splitlines():
                    line = line.strip()
                    match_valid_to = valid_to_regex.search(line)
                    if match_valid_to: timestamp_str = match_valid_to.group(1); break
                    match_not_after = not_after_regex.search(line)
                    if match_not_after: timestamp_str = match_not_after.group(1); break
                if timestamp_str:
                    dt_obj = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    return dt_obj.isoformat()
        except Exception: pass
        return "unknown (parse error)"


    def _get_cert_ttl_for_display(self):
        if not self._resolved_signed_key_path or not os.path.exists(self._resolved_signed_key_path):
            return "unknown"
        try:
            process = subprocess.run(['ssh-keygen', '-L', '-f', self._resolved_signed_key_path], capture_output=True, text=True, check=False, errors='ignore')
            if process.returncode == 0:
                valid_to_regex = re.compile(r"Valid:\s+.*?to\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)")
                not_after_regex = re.compile(r"Not\s+after:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)")
                timestamp_str = None
                for line in process.stdout.splitlines():
                    line = line.strip()
                    match_valid_to = valid_to_regex.search(line)
                    if match_valid_to: timestamp_str = match_valid_to.group(1); break
                    match_not_after = not_after_regex.search(line)
                    if match_not_after: timestamp_str = match_not_after.group(1); break
                if timestamp_str:
                    cert_valid_until = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    if cert_valid_until.tzinfo is None: cert_valid_until = cert_valid_until.replace(tzinfo=timezone.utc)
                    else: cert_valid_until = cert_valid_until.astimezone(timezone.utc)
                    return f"{(cert_valid_until - datetime.now(timezone.utc)).total_seconds():.0f}"
        except Exception: pass
        return "unknown"


    def _is_cert_fresh(self):
        host_for_msg = self.get_option('host')
        cert_path_for_msg = f"'{self._resolved_signed_key_path}'" if self._resolved_signed_key_path else "configured path"

        if not self._resolved_signed_key_path or not os.path.exists(self._resolved_signed_key_path):
            return False, "not found"

        try:
            cmd_check = ['ssh-keygen', '-L', '-f', self._resolved_signed_key_path]
            process = subprocess.run(cmd_check, capture_output=True, text=True, check=False, errors='ignore')

            if process.returncode != 0:
                if "No such file or directory" in process.stderr:
                    return False, "disappeared"
                else:
                    display.warning(f"{PLUGIN_NAME} ({host_for_msg}): 'ssh-keygen -L' failed for {cert_path_for_msg}. Stderr: {process.stderr.strip()}")
                return False, "ssh-keygen failed"

            cert_valid_until = None
            output_lines = process.stdout.splitlines()
            if not output_lines:
                display.warning(f"{PLUGIN_NAME} ({host_for_msg}): 'ssh-keygen -L' produced no output for {cert_path_for_msg}.")
                return False, "ssh-keygen no output"

            valid_to_regex = re.compile(r"Valid:\s+.*?to\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)")
            not_after_regex = re.compile(r"Not\s+after:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)")
            timestamp_str = None
            for line_content in output_lines:
                line_content = line_content.strip()
                match_valid_to = valid_to_regex.search(line_content)
                if match_valid_to: timestamp_str = match_valid_to.group(1); break
                match_not_after = not_after_regex.search(line_content)
                if match_not_after: timestamp_str = match_not_after.group(1); break

            if timestamp_str:
                try:
                    cert_valid_until = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    if cert_valid_until.tzinfo is None: cert_valid_until = cert_valid_until.replace(tzinfo=timezone.utc)
                    else: cert_valid_until = cert_valid_until.astimezone(timezone.utc)
                except ValueError as e:
                    display.warning(f"{PLUGIN_NAME} ({host_for_msg}): Could not parse timestamp '{timestamp_str}' for {cert_path_for_msg}. Error: {e}.")
                    return False, "timestamp parse error"
            else:
                display.warning(f"{PLUGIN_NAME} ({host_for_msg}): Could not find valid expiry timestamp in 'ssh-keygen -L' for {cert_path_for_msg}. Output:\n{process.stdout}")
                return False, "no expiry timestamp found"

            if not cert_valid_until:
                 display.warning(f"{PLUGIN_NAME} ({host_for_msg}): cert_valid_until is None after parsing for {cert_path_for_msg}.")
                 return False, "cert_valid_until is None"

            now_utc = datetime.now(timezone.utc)
            remaining_ttl = (cert_valid_until - now_utc).total_seconds()

            if remaining_ttl < self._resolved_key_min_ttl_seconds:
                return False, f"expires too soon (TTL {remaining_ttl:.0f}s < {self._resolved_key_min_ttl_seconds}s)"

            display.vvv(f"{PLUGIN_NAME} ({host_for_msg}): Certificate {cert_path_for_msg} confirmed fresh internally. Expires: {cert_valid_until.isoformat()}, TTL: {remaining_ttl:.0f}s.")
            return True, "fresh"

        except Exception as e:
            display.warning(f"{PLUGIN_NAME} ({host_for_msg}): Error checking existing key validity for {cert_path_for_msg}: {type(e).__name__} - {e}.")
            return False, "exception during check"


    def _obtain_new_certificate(self):
        host_for_msg = self.get_option('host')
        cert_path_for_msg = f"'{self._resolved_signed_key_path}'" if self._resolved_signed_key_path else "configured path"

        if not self._resolved_public_key_path or not os.path.exists(self._resolved_public_key_path):
            msg = f"{PLUGIN_NAME} ({host_for_msg}): Public key file not found or not configured at '{self._resolved_public_key_path}'. Cannot request certificate."
            display.error(msg)
            raise AnsibleError(msg)

        if not self._resolved_signed_key_path:
            msg = f"{PLUGIN_NAME} ({host_for_msg}): Signed key path ('signed_key_path') is not configured (e.g. set to null/empty). Cannot save certificate."
            display.error(msg)
            raise AnsibleError(msg)


        lock_file_path = self._resolved_signed_key_path + ".lock"
        attempts = 0
        max_attempts = 10
        display.v(f"{PLUGIN_NAME} ({host_for_msg}): Attempting to acquire lock for certificate renewal: {lock_file_path}")
        while attempts < max_attempts:
            try:
                lock_dir = os.path.dirname(lock_file_path)
                if lock_dir and not os.path.exists(lock_dir):
                    os.makedirs(lock_dir, mode=0o700)

                fd = os.open(lock_file_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.close(fd)
                display.v(f"{PLUGIN_NAME} ({host_for_msg}): Acquired lock: {lock_file_path}")
                break
            except FileExistsError:
                attempts += 1
                display.vvv(f"{PLUGIN_NAME} ({host_for_msg}): Lock file {lock_file_path} exists, attempt {attempts}/{max_attempts}, waiting...")
                time.sleep(0.5)
            except Exception as e:
                display.warning(f"{PLUGIN_NAME} ({host_for_msg}): Error trying to acquire lock {lock_file_path}: {e}. Proceeding without lock.")
                break
        else:
            display.warning(f"{PLUGIN_NAME} ({host_for_msg}): Could not acquire lock {lock_file_path} after {max_attempts} attempts. Proceeding without lock (risk of race condition).")


        try:
            is_fresh_after_lock, _ = self._is_cert_fresh()
            if is_fresh_after_lock and not self._resolved_force_key_refresh:
                 display.v(f"{PLUGIN_NAME} ({host_for_msg}): Certificate for {cert_path_for_msg} became fresh while waiting for lock. Skipping renewal.")
                 return True

            if os.path.exists(self._resolved_signed_key_path):
                try:
                    os.remove(self._resolved_signed_key_path)
                    display.vv(f"{PLUGIN_NAME} ({host_for_msg}): Removed old/stale signed key {cert_path_for_msg}.")
                except OSError as e:
                    display.warning(f"{PLUGIN_NAME} ({host_for_msg}): Failed to remove existing signed key {cert_path_for_msg}, possibly due to race or permissions: {e}")

            display.vv(f"{PLUGIN_NAME} ({host_for_msg}): Proceeding with Vault SSH key request for {cert_path_for_msg}.")

            vault_command = [
                'vault', 'write', '-field=signed_key',
                self._resolved_vault_sign_path,
                f'public_key=@{self._resolved_public_key_path}',
                f'valid_principals={self._resolved_vault_ssh_ca_principal}'
            ]

            if not os.getenv('VAULT_ADDR'):
                display.warning(f"{PLUGIN_NAME} ({host_for_msg}): VAULT_ADDR environment variable is not set. Vault command may fail.")

            display.vv(f"{PLUGIN_NAME} ({host_for_msg}): Executing: {' '.join(vault_command)}")

            env = os.environ.copy()
            process = subprocess.run(vault_command, capture_output=True, text=True, check=True, env=env, errors='ignore')
            signed_key_content = process.stdout.strip()

            if not signed_key_content:
                display.error(f"{PLUGIN_NAME} ({host_for_msg}): Vault returned an empty signed key for path '{self._resolved_vault_sign_path}'.")
                raise AnsibleError(f"Vault returned an empty signed key for {self._resolved_vault_sign_path}")

            signed_key_dir = os.path.dirname(self._resolved_signed_key_path)
            if signed_key_dir and not os.path.exists(signed_key_dir):
                try:
                    os.makedirs(signed_key_dir, mode=0o700)
                    display.vv(f"{PLUGIN_NAME} ({host_for_msg}): Created directory for signed key: {signed_key_dir}")
                except Exception as e:
                    raise AnsibleError(f"{PLUGIN_NAME} ({host_for_msg}): Failed to create directory '{signed_key_dir}': {e}")

            with open(self._resolved_signed_key_path, 'w') as f:
                f.write(signed_key_content)
            os.chmod(self._resolved_signed_key_path, 0o644)
            display.vv(f"{PLUGIN_NAME} ({host_for_msg}): Set permissions to 0644 for {cert_path_for_msg}.")

            return True

        except subprocess.CalledProcessError as e:
            stderr = e.stderr.strip() if e.stderr else "(no stderr)"
            stdout = e.stdout.strip() if e.stdout else "(no stdout)"
            errmsg = (f"{PLUGIN_NAME} ({host_for_msg}): Vault command failed for path '{self._resolved_vault_sign_path}'.\n"
                      f"  Command: {' '.join(e.cmd)}\n"
                      f"  Return Code: {e.returncode}\n"
                      f"  Stdout: {stdout}\n"
                      f"  Stderr: {stderr}")
            display.error(errmsg)
            raise AnsibleConnectionFailure(errmsg)
        except FileNotFoundError:
            msg = f"{PLUGIN_NAME} ({host_for_msg}): 'vault' command not found."
            display.error(msg)
            raise AnsibleError(msg)
        except Exception as e:
            msg = f"{PLUGIN_NAME} ({host_for_msg}): An unexpected error occurred while obtaining signed key: {type(e).__name__} - {e}"
            display.error(msg)
            raise AnsibleError(msg)
        finally:
            if os.path.exists(lock_file_path):
                try:
                    os.remove(lock_file_path)
                    display.v(f"{PLUGIN_NAME} ({host_for_msg}): Released lock: {lock_file_path}")
                except OSError as e:
                    display.warning(f"{PLUGIN_NAME} ({host_for_msg}): Failed to remove lock file {lock_file_path}: {e}")


    def _connect(self):
        if not self._config_loaded:
            self._load_config()

        # self._say_hello_world() # Removed

        host_for_msg = self.get_option('host')
        cert_path_for_msg = f"'{self._resolved_signed_key_path}'" if self._resolved_signed_key_path else "configured path"

        if not self._vault_cert_operations_done_this_instance:
            display.v(f"{PLUGIN_NAME} ({host_for_msg}): Evaluating Vault certificate status for this connection instance.")

            log_primary_status_for_this_host_by_this_process = not Connection._host_logged_initial_cert_status_this_process.get(host_for_msg)

            needs_renewal = False

            if self._resolved_force_key_refresh:
                needs_renewal = True
                if log_primary_status_for_this_host_by_this_process:
                    display.display(f"{PLUGIN_NAME} ({host_for_msg}): Force refresh enabled. Attempting certificate renewal.", color=C.COLOR_VERBOSE)
            else:
                is_fresh, reason = self._is_cert_fresh()
                if not is_fresh:
                    needs_renewal = True
                    if log_primary_status_for_this_host_by_this_process:
                        if reason == "not found":
                            display.display(f"{PLUGIN_NAME} ({host_for_msg}): Certificate for {cert_path_for_msg} not found. Attempting renewal.", color=C.COLOR_VERBOSE)
                        elif reason == "disappeared":
                             display.display(f"{PLUGIN_NAME} ({host_for_msg}): Certificate for {cert_path_for_msg} seems to have disappeared. Attempting renewal.", color=C.COLOR_VERBOSE)
                        elif reason.startswith("expires too soon"):
                            display.display(f"{PLUGIN_NAME} ({host_for_msg}): Certificate for {cert_path_for_msg} {reason}. Attempting renewal.", color=C.COLOR_VERBOSE)
                        elif display.verbosity < 1 :
                            display.display(f"{PLUGIN_NAME} ({host_for_msg}): Certificate for {cert_path_for_msg} requires renewal (reason: {reason}). Attempting renewal.", color=C.COLOR_VERBOSE)
                else:
                    display.vvv(f"{PLUGIN_NAME} ({host_for_msg}): Valid certificate found for {cert_path_for_msg}. Expires: {self._get_cert_expiry_for_display()} (TTL: {self._get_cert_ttl_for_display()}s).")
                    if log_primary_status_for_this_host_by_this_process:
                        Connection._host_logged_initial_cert_status_this_process[host_for_msg] = True


            if needs_renewal:
                renewal_succeeded = self._obtain_new_certificate()

                if renewal_succeeded:
                    is_now_fresh, _ = self._is_cert_fresh()
                    if is_now_fresh:
                        if log_primary_status_for_this_host_by_this_process:
                            display.display(f"{PLUGIN_NAME} ({host_for_msg}): Successfully renewed certificate {cert_path_for_msg}. Expires: {self._get_cert_expiry_for_display()} (TTL: {self._get_cert_ttl_for_display()}s).", color=C.COLOR_OK)
                            Connection._host_logged_initial_cert_status_this_process[host_for_msg] = True
                    else:
                        msg = f"{PLUGIN_NAME} ({host_for_msg}): Certificate renewal process seemed to succeed for {cert_path_for_msg}, but the certificate is still not fresh or valid. Check Vault configuration and logs."
                        display.error(msg)
                        raise AnsibleConnectionFailure(msg)

            self._vault_cert_operations_done_this_instance = True

        else:
            display.vvv(f"{PLUGIN_NAME} ({host_for_msg}): Vault certificate operations previously run for this connection instance. Skipping.")

        display.v(f"{PLUGIN_NAME} ({host_for_msg}): Proceeding with SSH connection to {host_for_msg}.")
        try:
            return super(Connection, self)._connect()
        except AnsibleConnectionFailure as e:
            display.error(f"{PLUGIN_NAME} ({host_for_msg}): SSH connection failed (parent plugin error). Original error: {e}")
            raise
        except Exception as e:
            display.error(f"{PLUGIN_NAME} ({host_for_msg}): An unexpected error occurred during SSH connection: {type(e).__name__} - {e}")
            if isinstance(e, KeyError):
                 display.error(f"{PLUGIN_NAME} ({host_for_msg}): This KeyError might indicate that a standard SSH option (like '{str(e)}') is not defined in plugin's DOCUMENTATION or is misconfigured.")
            raise AnsibleConnectionFailure(f"Unexpected connection error to {host_for_msg}: {e}")