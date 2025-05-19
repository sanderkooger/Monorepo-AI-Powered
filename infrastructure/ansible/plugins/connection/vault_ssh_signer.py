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
from ansible import constants as C # For color output

display = Display()

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
    author: "Your Name (Vault SSH signer)"
    extends_documentation_fragment:
        - connection_pipelining 
    version_added: "2.10"
    notes:
        - This plugin inherits most of its SSH behavior from the standard 'ssh' connection plugin.
        - The Vault SSH signing logic is prepended to the connection process and performed once per connection instance.
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
              - This will also be used as a source for 'valid_principals' if 'vault_ssh_valid_principals' is not set.
          type: string
          ini:
            - {section: defaults, key: remote_user}
          env:
            - name: ANSIBLE_REMOTE_USER
          vars:
            - name: ansible_user 
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
      vault_ssh_sign_path:
          description: "The Vault SSH signing path (e.g., 'ssh-engine/sign/my-role'). This is the preferred variable."
          env: [{name: ANSIBLE_VAULT_SSH_SIGN_PATH}]
          vars: [{name: vault_ssh_sign_path}] 

      vault_ssh_ca_signing_role: 
          description: "The Vault SSH CA signing role path (e.g., 'ssh-engine/roles/my-role'). If 'vault_ssh_sign_path' is not set, this will be used and '/roles/' will be transformed to '/sign/'."
          env: [{name: ANSIBLE_VAULT_SSH_CA_SIGNING_ROLE}]
          vars: [{name: vault_ssh_ca_signing_role}]

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

      vault_ssh_valid_principals:
          description: "Specific valid principals for the SSH certificate. If not set, the connection 'user' (ansible_user) will be used, then the 'valid_principals' option default."
          env: [{name: ANSIBLE_VAULT_SSH_VALID_PRINCIPALS}]
          vars: [{name: vault_ssh_valid_principals}]

      valid_principals: 
          description: "Default valid principals if not overridden by 'vault_ssh_valid_principals' or connection 'user'."
          default: "ansible" 

      key_min_ttl_seconds:
          description: "Minimum seconds the certificate should be valid for. If TTL is less, a new one is requested."
          type: int
          default: 3600 
          env: [{name: ANSIBLE_VAULT_SSH_MIN_TTL_SECONDS}]
          vars: [{name: vault_ssh_key_min_ttl_seconds}]

      force_key_refresh:
          description: "Force refresh the SSH certificate even if it's still valid."
          type: bool
          default: False
          env: [{name: ANSIBLE_VAULT_SSH_FORCE_KEY_REFRESH}]
          vars: [{name: vault_ssh_force_key_refresh}]
      
      _hardcoded_sign_path_fallback: 
          description: "DO NOT SET EXTERNALLY. Internal hardcoded default for Vault sign path if no other configuration is found."
          default: "Monorepo-AI-Powered-prod/ssh/sign/default-role" 
'''

PLUGIN_NAME = "Vault SSH Signer"

class Connection(SSHConnection):
    ''' SSH connection wrapper to handle Vault-signed certificates '''

    transport = 'vault_ssh_signer'

    def __init__(self, *args, **kwargs):
        super(Connection, self).__init__(*args, **kwargs)
        self._resolved_public_key_path = None
        self._resolved_signed_key_path = None
        self._resolved_vault_sign_path = None
        self._resolved_valid_principals = None
        self._resolved_key_min_ttl_seconds = None
        self._resolved_force_key_refresh = None
        self._config_loaded = False
        self._vault_cert_checked_this_connection = False # New flag

    def _load_config(self):
        if self._config_loaded:
            return

        pkp_opt = self.get_option('public_key_path')
        self._resolved_public_key_path = os.path.expanduser(pkp_opt) if pkp_opt else None
        skp_opt = self.get_option('signed_key_path')
        self._resolved_signed_key_path = os.path.expanduser(skp_opt) if skp_opt else None
        self._resolved_key_min_ttl_seconds = self.get_option('key_min_ttl_seconds')
        self._resolved_force_key_refresh = self.get_option('force_key_refresh')

        sign_path_direct = self.get_option('vault_ssh_sign_path')
        if sign_path_direct is not None: 
            self._resolved_vault_sign_path = sign_path_direct
            display.vv(f"{PLUGIN_NAME}: Using Vault sign path: {self._resolved_vault_sign_path} (from 'vault_ssh_sign_path') for host {self.get_option('host')}")
        else:
            ca_signing_role = self.get_option('vault_ssh_ca_signing_role')
            if ca_signing_role is not None:
                if "/roles/" in ca_signing_role:
                    self._resolved_vault_sign_path = ca_signing_role.replace("/roles/", "/sign/", 1)
                    display.vv(f"{PLUGIN_NAME}: Transformed 'vault_ssh_ca_signing_role' ({ca_signing_role}) to sign path: {self._resolved_vault_sign_path} for host {self.get_option('host')}")
                else:
                    self._resolved_vault_sign_path = ca_signing_role
                    display.warning(f"{PLUGIN_NAME}: Using 'vault_ssh_ca_signing_role' ({ca_signing_role}) directly as sign path for host {self.get_option('host')} as it doesn't contain '/roles/'.")
            else:
                self._resolved_vault_sign_path = self.get_option('_hardcoded_sign_path_fallback')
                display.warning(f"{PLUGIN_NAME}: Using hardcoded fallback Vault sign path: {self._resolved_vault_sign_path} for host {self.get_option('host')}. "
                                f"Consider setting 'vault_ssh_sign_path' or 'vault_ssh_ca_signing_role'.")

        if not self._resolved_vault_sign_path: 
            raise AnsibleError(f"{PLUGIN_NAME}: Vault SSH sign path could not be determined for host {self.get_option('host')}. Critical configuration missing.")

        principals_explicit = self.get_option('vault_ssh_valid_principals')
        if principals_explicit is not None:
            self._resolved_valid_principals = principals_explicit
            display.vv(f"{PLUGIN_NAME}: Using valid_principals from 'vault_ssh_valid_principals': {self._resolved_valid_principals} for host {self.get_option('host')}")
        else:
            connection_user = self.get_option('remote_user') 
            if connection_user:
                self._resolved_valid_principals = connection_user
                display.vv(f"{PLUGIN_NAME}: Using valid_principals from connection user ('{connection_user}' via 'remote_user' option) for host {self.get_option('host')}.")
            else:
                self._resolved_valid_principals = self.get_option('valid_principals')
                display.vv(f"{PLUGIN_NAME}: Using valid_principals from plugin option 'valid_principals' default: {self._resolved_valid_principals} for host {self.get_option('host')}")
        
        if not self._resolved_valid_principals:
             display.warning(f"{PLUGIN_NAME}: Valid principals for host {self.get_option('host')} could not be determined, Vault signing might fail or use Vault's role default.")

        self._config_loaded = True
        
        display.vv(f"{PLUGIN_NAME} Config for host '{self.get_option('host')}':")
        display.vv(f"  Public Key Path: {self._resolved_public_key_path}")
        display.vv(f"  Signed Key Path: {self._resolved_signed_key_path}")
        display.vv(f"  Vault Sign Path: {self._resolved_vault_sign_path}")
        display.vv(f"  Valid Principals: {self._resolved_valid_principals}")
        display.vv(f"  Key Min TTL (s): {self._resolved_key_min_ttl_seconds}")
        display.vv(f"  Force Key Refresh: {self._resolved_force_key_refresh}")

    def _is_cert_fresh(self):
        host_for_msg = self.get_option('host') # Get host for context in messages
        cert_path_for_msg = f"'{self._resolved_signed_key_path}'" if self._resolved_signed_key_path else "configured path"

        if not self._resolved_signed_key_path or not os.path.exists(self._resolved_signed_key_path):
            display.display(f"{PLUGIN_NAME} ({host_for_msg}): Certificate for {cert_path_for_msg} not found.", color=C.COLOR_VERBOSE)
            return False

        try:
            cmd_check = ['ssh-keygen', '-L', '-f', self._resolved_signed_key_path]
            process = subprocess.run(cmd_check, capture_output=True, text=True, check=False, errors='ignore')

            if process.returncode != 0:
                if "No such file or directory" in process.stderr:
                    display.display(f"{PLUGIN_NAME} ({host_for_msg}): Certificate for {cert_path_for_msg} disappeared. Assuming renewal needed.", color=C.COLOR_VERBOSE)
                else:
                    display.warning(f"{PLUGIN_NAME} ({host_for_msg}): 'ssh-keygen -L' failed for {cert_path_for_msg}. Assuming key is invalid. Stderr: {process.stderr.strip()}")
                return False

            cert_valid_until = None
            output_lines = process.stdout.splitlines()
            if not output_lines: 
                display.warning(f"{PLUGIN_NAME} ({host_for_msg}): 'ssh-keygen -L' produced no output for {cert_path_for_msg}. Assuming key is invalid.")
                return False
            
            valid_to_regex = re.compile(r"Valid:\s+.*?to\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)")
            not_after_regex = re.compile(r"Not\s+after:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?)")

            timestamp_str = None
            for line in output_lines:
                line = line.strip()
                match_valid_to = valid_to_regex.search(line)
                if match_valid_to:
                    timestamp_str = match_valid_to.group(1)
                    break
                match_not_after = not_after_regex.search(line)
                if match_not_after:
                    timestamp_str = match_not_after.group(1)
                    break
            
            if timestamp_str:
                try:
                    cert_valid_until = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    if cert_valid_until.tzinfo is None: 
                         cert_valid_until = cert_valid_until.replace(tzinfo=timezone.utc)
                    else:
                         cert_valid_until = cert_valid_until.astimezone(timezone.utc)
                except ValueError as e:
                    display.warning(f"{PLUGIN_NAME} ({host_for_msg}): Could not parse timestamp '{timestamp_str}' from 'ssh-keygen -L' for {cert_path_for_msg}. Error: {e}. Assuming key is invalid.")
                    return False
            else: 
                display.warning(f"{PLUGIN_NAME} ({host_for_msg}): Could not find valid expiry timestamp in 'ssh-keygen -L' output for {cert_path_for_msg}. Output:\n{process.stdout}\nAssuming key is invalid.")
                return False
           
            if not cert_valid_until:
                 display.warning(f"{PLUGIN_NAME} ({host_for_msg}): cert_valid_until is None after parsing for {cert_path_for_msg}. Assuming key is invalid.")
                 return False

            now_utc = datetime.now(timezone.utc)
            remaining_ttl = (cert_valid_until - now_utc).total_seconds()

            if remaining_ttl < self._resolved_key_min_ttl_seconds:
                display.display(f"{PLUGIN_NAME} ({host_for_msg}): Certificate for {cert_path_for_msg} expires too soon (TTL {remaining_ttl:.0f}s < {self._resolved_key_min_ttl_seconds}s). Attempting renewal.", color=C.COLOR_VERBOSE)
                return False
            
            # This is the "key is fresh" message, only show it once per connection due to the new flag.
            # It's handled in _connect now.
            return True

        except Exception as e:
            display.warning(f"{PLUGIN_NAME} ({host_for_msg}): Error checking existing key validity for {cert_path_for_msg}: {type(e).__name__} - {e}. Assuming key is invalid.")
            return False

    def _obtain_new_certificate(self):
        host_for_msg = self.get_option('host')
        cert_path_for_msg = f"'{self._resolved_signed_key_path}'" if self._resolved_signed_key_path else "configured path"

        if not self._resolved_public_key_path or not os.path.exists(self._resolved_public_key_path):
            raise AnsibleError(f"{PLUGIN_NAME} ({host_for_msg}): Public key file not found at '{self._resolved_public_key_path}' or path not configured. Cannot request certificate.")

        lock_file_path = self._resolved_signed_key_path + ".lock"
        attempts = 0
        max_attempts = 10 
        
        display.v(f"{PLUGIN_NAME} ({host_for_msg}): Attempting to acquire lock for certificate renewal: {lock_file_path}")
        while attempts < max_attempts:
            try:
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
            # Re-check freshness *after* attempting to acquire lock
            # _is_cert_fresh calls display.display() for its outcomes.
            is_fresh_after_lock_attempt = self._is_cert_fresh() # Will print its own status
            if is_fresh_after_lock_attempt and not self._resolved_force_key_refresh:
                 display.v(f"{PLUGIN_NAME} ({host_for_msg}): Certificate for {cert_path_for_msg} now fresh. Skipping renewal.")
                 return

            if self._resolved_signed_key_path and os.path.exists(self._resolved_signed_key_path):
                try:
                    os.remove(self._resolved_signed_key_path)
                    display.vv(f"{PLUGIN_NAME} ({host_for_msg}): Removed old/stale signed key {cert_path_for_msg}.")
                except OSError as e:
                    display.warning(f"{PLUGIN_NAME} ({host_for_msg}): Failed to remove existing signed key {cert_path_for_msg}, possibly due to race: {e}")

            display.display(f"{PLUGIN_NAME} ({host_for_msg}): Requesting new signed SSH key from Vault for {cert_path_for_msg}.", color=C.COLOR_VERBOSE)
            
            vault_command = [
                'vault', 'write', '-field=signed_key',
                self._resolved_vault_sign_path,
                f'public_key=@{self._resolved_public_key_path}'
            ]
            if self._resolved_valid_principals:
                vault_command.append(f'valid_principals={self._resolved_valid_principals}')
            else:
                display.warning(f"{PLUGIN_NAME} ({host_for_msg}): 'valid_principals' is not set for {cert_path_for_msg}. The Vault role's default principals will be used.")

            if not os.getenv('VAULT_ADDR'):
                display.warning(f"{PLUGIN_NAME} ({host_for_msg}): VAULT_ADDR environment variable is not set. Vault command may fail.")

            display.vv(f"{PLUGIN_NAME} ({host_for_msg}): Executing: {' '.join(vault_command)}")
            
            env = os.environ.copy()
            process = subprocess.run(vault_command, capture_output=True, text=True, check=True, env=env, errors='ignore')
            signed_key_content = process.stdout.strip()

            if not signed_key_content:
                raise AnsibleError(f"{PLUGIN_NAME} ({host_for_msg}): Vault returned an empty signed key for path '{self._resolved_vault_sign_path}'. Check Vault logs and role configuration.")

            if not self._resolved_signed_key_path:
                raise AnsibleError(f"{PLUGIN_NAME} ({host_for_msg}): Signed key path ('signed_key_path') is not configured. Cannot save certificate.")

            signed_key_dir = os.path.dirname(self._resolved_signed_key_path)
            if signed_key_dir and not os.path.exists(signed_key_dir):
                try:
                    os.makedirs(signed_key_dir, mode=0o700) 
                    display.vv(f"{PLUGIN_NAME} ({host_for_msg}): Created directory for signed key: {signed_key_dir}")
                except Exception as e:
                    raise AnsibleError(f"{PLUGIN_NAME} ({host_for_msg}): Failed to create directory '{signed_key_dir}': {e}")

            with open(self._resolved_signed_key_path, 'w') as f:
                f.write(signed_key_content)
            os.chmod(self._resolved_signed_key_path, 0o600) 
            display.display(f"{PLUGIN_NAME} ({host_for_msg}): Successfully renewed certificate {cert_path_for_msg}.", color=C.COLOR_OK)

        except subprocess.CalledProcessError as e:
            stderr = e.stderr.strip() if e.stderr else "(no stderr)"
            stdout = e.stdout.strip() if e.stdout else "(no stdout)"
            errmsg = (f"{PLUGIN_NAME} ({host_for_msg}): Vault command failed for path '{self._resolved_vault_sign_path}'.\n"
                      f"  Command: {' '.join(e.cmd)}\n"
                      f"  Return Code: {e.returncode}\n"
                      f"  Stdout: {stdout}\n"
                      f"  Stderr: {stderr}")
            if "permission denied" in stderr.lower(): errmsg += "\n  Hint: Check Vault ACL policies for the token/role being used."
            if "client token" in stderr.lower() or "missing client token" in stderr.lower(): errmsg += "\n  Hint: Check VAULT_TOKEN or other Vault authentication method."
            if "unknown field \"public_key\"" in stderr.lower() or "unknown field \"valid_principals\"" in stderr.lower():
                errmsg += f"\n  Hint: The Vault SSH signing path '{self._resolved_vault_sign_path}' might be incorrect or the role not configured for these parameters."
            display.error(errmsg) 
            raise AnsibleConnectionFailure(errmsg) 
        except FileNotFoundError:
            msg = f"{PLUGIN_NAME} ({host_for_msg}): 'vault' command not found. Ensure HashiCorp Vault CLI is installed and in PATH on the Ansible controller."
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
        # Load config only once per instance if not already loaded
        if not self._config_loaded:
            self._load_config()
        
        host_for_msg = self.get_option('host') # Get host for context in messages

        # Perform Vault certificate check only ONCE per connection instance
        if not self._vault_cert_checked_this_connection:
            display.v(f"{PLUGIN_NAME} ({host_for_msg}): Performing initial Vault certificate check for this connection instance.")
            needs_new_key = True 
            if self._resolved_force_key_refresh:
                display.display(f"{PLUGIN_NAME} ({host_for_msg}): Force refresh enabled. Will attempt to obtain a new certificate.", color=C.COLOR_VERBOSE)
            elif self._is_cert_fresh(): # _is_cert_fresh() will print its status
                needs_new_key = False
            # else: _is_cert_fresh() already printed "not found" or "expires too soon"
            
            if needs_new_key:
                if not self._resolved_public_key_path or not self._resolved_signed_key_path or not self._resolved_vault_sign_path:
                    missing_paths = []
                    if not self._resolved_public_key_path: missing_paths.append("public_key_path")
                    if not self._resolved_signed_key_path: missing_paths.append("signed_key_path")
                    if not self._resolved_vault_sign_path: missing_paths.append("vault_ssh_sign_path/vault_ssh_ca_signing_role")
                    msg = f"{PLUGIN_NAME} ({host_for_msg}): Cannot obtain new certificate. Required path(s) not configured: {', '.join(missing_paths)}"
                    display.error(msg)
                    raise AnsibleConnectionFailure(msg)
                
                self._obtain_new_certificate() # This will print success or failure
                
                # After obtaining, if it wasn't forced, re-verify freshness
                if not self._resolved_force_key_refresh:
                    if not self._is_cert_fresh(): # This will print status again
                        msg = f"{PLUGIN_NAME} ({host_for_msg}): Certificate is still not fresh after attempting renewal. Check logs for errors."
                        display.error(msg)
                        raise AnsibleConnectionFailure(msg)
                    # else: _is_cert_fresh already printed the "Valid certificate found..." message

            self._vault_cert_checked_this_connection = True # Set flag after the first check cycle
        else:
            display.vvv(f"{PLUGIN_NAME} ({host_for_msg}): Vault certificate already checked for this connection instance. Skipping.")


        display.v(f"{PLUGIN_NAME} ({host_for_msg}): Proceeding with SSH connection to {host_for_msg}.")
        try:
            return super(Connection, self)._connect()
        except AnsibleConnectionFailure as e:
            display.error(f"{PLUGIN_NAME} ({host_for_msg}): SSH connection failed (parent plugin error). Original error: {e}")
            raise 
        except Exception as e: 
            display.error(f"{PLUGIN_NAME} ({host_for_msg}): An unexpected error occurred during SSH connection: {type(e).__name__} - {e}")
            if isinstance(e, KeyError):
                 display.error(f"{PLUGIN_NAME} ({host_for_msg}): This KeyError might indicate a standard SSH option (like '{str(e)}') is not defined in plugin's DOCUMENTATION.")
            raise AnsibleConnectionFailure(f"Unexpected connection error to {host_for_msg}: {e}")