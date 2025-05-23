vault write -field=signed_key Monorepo-AI-Powered-prod/ssh/sign/default-role public_key=@$HOME/.ssh/id_rsa.pub valid_principals=ansible > $HOME/.ssh/id_rsa-cert.pub

# Jump Host Docker Image

This directory contains the necessary files to build a Docker image for a secure jump host. This jump host is designed to be deployed within a network accessible from the public internet (via NAT and port forwarding) and capable of reaching your private network. It leverages HashiCorp Vault's SSH secrets engine to manage SSH host keys and trust client certificates, enabling secure SSH access from ephemeral environments like GitHub Actions runners to private network machines.

## Purpose

The primary purpose of this jump host is to act as a secure relay for SSH connections from public CI/CD environments (like GitHub Actions) to private network infrastructure that is not directly accessible from the internet. By using Vault-signed SSH certificates, we avoid distributing long-lived SSH keys to potentially less secure environments.

## Prerequisites

*   A running Docker environment (e.g., on a QNAP NAS or other server).
*   A running HashiCorp Vault server accessible from the machine running the Docker container.
*   A Vault KV secrets engine (v2 recommended) enabled and configured to store the jump host's SSH key pair.
*   A Vault SSH secrets engine enabled and configured as a Certificate Authority (CA) to sign client SSH keys.
*   Network configuration (router/firewall) to forward a public port to the machine running the Docker container on the jump host's SSH port (default 2222).
*   Target private network machines configured to trust the Vault SSH CA for client authentication.

## Installation and Setup

Follow these steps to set up and deploy the jump host:

### 1. Generate SSH Host Key Pair

Generate a new SSH key pair specifically for the jump host. It is recommended to use a strong key type like RSA with at least 2048 bits or ED25519. Do not set a passphrase.

```bash
ssh-keygen -t rsa -b 2048 -C "jumphost@homeserver" -N "" -f jumphost_ssh_key
```

This will create two files: `jumphost_ssh_key` (private key) and `jumphost_ssh_key.pub` (public key).

### 2. Store SSH Host Key Pair in Vault KV

Store the generated private and public keys in your Vault KV secrets engine. The `start.sh` script in this image expects the private key under the key `priv` and the public key under the key `pub` at a specific path.

Assuming your KV engine is mounted at `kv-root` and you want to store the key at `ssh_keys/jumphost_homeserver`, the path would be `kv-root/data/ssh_keys/jumphost_homeserver` for KV v2.

Use the Vault CLI to write the keys:

```bash
vault kv put kv-root/ssh_keys/jumphost_homeserver priv=@jumphost_ssh_key pub=@jumphost_ssh_key.pub
```

Replace `kv-root` with your KV engine mount path if different. Ensure the Vault token used has write access to this path.

### 3. Configure Vault SSH Secrets Engine as a CA

Ensure your Vault SSH secrets engine is configured as a Certificate Authority. If you haven't already, you can generate a signing key pair using the Vault CLI:

```bash
vault write [your_ssh_mount_path]/config/ca generate_signing_key=true
```

Replace `[your_ssh_mount_path]` with the actual mount path of your SSH secrets engine (e.g., `Monorepo-AI-Powered-prod/ssh`). Ensure the Vault token used has write access to this path.

### 4. Configure Target Machines to Trust Vault CA

Retrieve the public key of the Vault SSH CA:

```bash
vault read [your_ssh_mount_path]/config/ca
```

Copy the `public_key` value from the output. Distribute this public key to all target machines in your private network that the jump host will connect to. Add this public key to the `TrustedUserCAKeys` file in the `sshd_config` on each target machine.

Example `sshd_config` snippet on target machines:

```
TrustedUserCAKeys /etc/ssh/vault_ca.pub
```

Place the Vault CA public key content in `/etc/ssh/vault_ca.pub` (or the path specified in `TrustedUserCAKeys`) on each target machine.

### 5. Build the Docker Image

Navigate to the root of your monorepo in your terminal. Build the Docker image using the provided Dockerfile and start.sh script:

```bash
docker build -t jump-host-vault-ssh infrastructure/docker/jumphost/
```

### 6. Run the Docker Container

Run the Docker container on your host machine (e.g., QNAP NAS), providing the necessary Vault environment variables and configuring the network.

First, stop and remove any old container with the same name:

```bash
docker stop jump-host
docker rm jump-host
```

Then, run the new container. Replace the placeholder values for `VAULT_ADDR` and `VAULT_TOKEN` with your actual Vault details. Adjust the port mapping (`-p`) and network mode (`--network`) as needed for your host environment and how it accesses your private network.

```bash
docker run -d \
  -p 2222:2222 \
  --name jump-host \
  --restart=always \
  -e "VAULT_ADDR=YOUR_VAULT_ADDR" \
  -e "VAULT_TOKEN=YOUR_VAULT_TOKEN" \
  -e "VAULT_SSH_CA_PATH=Monorepo-AI-Powered-prod/ssh" \
  --network host
  jump-host-vault-ssh
```

Note: If using `--network host`, the `-p` mapping is redundant but included for clarity. The SSH server inside the container listens on port 2222. Ensure your router forwards the desired public port (e.g., 22) to your host machine's internal IP on port 2222.

Check the container logs (`docker logs jump-host`) to confirm successful startup and key fetching.

### 7. Configure Your Local SSH Client

To connect through the jump host, configure your local SSH client (`~/.ssh/config`) to use your local SSH key pair with a Vault-signed certificate and the jump host as a `ProxyJump`.

First, obtain a signed certificate for your local public key from Vault. Assuming your local public key is at `~/.ssh/id_rsa.pub` and you want the certificate valid for the `ansible` user on target machines:

```bash
VAULT_ADDR=YOUR_VAULT_ADDR VAULT_TOKEN=YOUR_VAULT_TOKEN vault write Monorepo-AI-Powered-prod/ssh/sign/default-role public_key=@~/.ssh/id_rsa.pub valid_principals="ansible"
```

Save the `signed_key` output from this command to a file (e.g., `~/.ssh/id_rsa-vault-cert.pub`).

Then, add entries to your local `~/.ssh/config`:

```sshconfig
Host paris.thisisfashion.tv
    User ansible # User on the jump host
    Port 22 # External port forwarded to the jump host
    IdentityFile ~/.ssh/id_rsa # Your local private key
    CertificateFile ~/.ssh/id_rsa-vault-cert.pub # The signed certificate

Host 192.168.1.* # Or specific private machine IPs/hostnames
    User ansible # User on the private network machines
    ProxyJump paris.thisisfashion.tv # Use the jump host configuration
    IdentityFile ~/.ssh/id_rsa # Your local private key (used for the second hop)
    CertificateFile ~/.ssh/id_rsa-vault-cert.pub # The signed certificate (used for the second hop)
```

Replace `paris.thisisfashion.tv` with your jump host's public hostname or IP, and adjust file paths and ports as necessary.

### 8. Test the Connection

You should now be able to SSH to your private network machines via the jump host:

```bash
ssh ansible@192.168.1.4 # Or any other private machine IP/hostname
```

Your SSH client will automatically use the `ProxyJump` configuration to connect via the jump host.