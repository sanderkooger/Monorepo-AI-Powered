# HashiCorp Vault Helm Deployment

This directory contains the configuration for deploying HashiCorp Vault using the official Helm chart.

## Prerequisites

- Helm v3+ installed
- Kubernetes cluster access configured (`kubectl` context set)
- Nginx Ingress Controller installed in the cluster
- Cert-Manager installed in the cluster (for automatic TLS via Let's Encrypt)
- Local Path Provisioner (or similar) configured for persistent storage

## Deployment Steps

1.  **Add HashiCorp Helm Repository:**
    ```bash
    helm repo add hashicorp https://helm.releases.hashicorp.com
    helm repo update
    ```

2.  **Customize `values.yaml`:**
    Review and adjust the `values.yaml` file in this directory to match your specific environment requirements (e.g., storage class, ingress host, cluster issuer). Pay close attention to the placeholder values marked with `IMPORTANT:`.

3.  **Deploy Vault:**
    This command will install Vault into the `vault` namespace, creating the namespace if it doesn't exist.
    ```bash
    helm install vault hashicorp/vault --namespace vault --create-namespace -f values.yaml
    ```

4.  **Initialize and Unseal Vault:**
    Follow the post-installation steps, typically involving exec-ing into the Vault pod to initialize and unseal it. Refer to the official Vault Helm chart documentation for details.

## Configuration Details

- **UI:** Enabled
- **Storage:** Configured to use a PersistentVolumeClaim with local path provisioner
- **HA:** Disabled (single replica)
- **Ingress:** Nginx with TLS via Cert-Manager
- **Auth Methods:**
  - Kubernetes (default)
  - AppRole (CLI access)
- **Namespaces:**
  - dev
  - staging
  - prod

## CLI Authentication via AppRole

1. Create policy for CLI access:
```bash
vault policy write cli-policy - <<EOF
path "dev/secrets/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOF
```

2. Configure AppRole auth method:
```bash
vault auth enable -path=cli approle
vault write auth/cli/role/cli-role \
  token_policies="cli-policy" \
  token_ttl=1h \
  token_max_ttl=24h
```

3. Retrieve credentials:
```bash
ROLE_ID=$(vault read -field=role_id auth/cli/role/cli-role/role-id)
SECRET_ID=$(vault write -f -field=secret_id auth/cli/role/cli-role/secret-id)
```

4. Authenticate with Vault CLI:
```bash
vault write auth/cli/login role_id=$ROLE_ID secret_id=$SECRET_ID
```

## Kubernetes Integration
Pods authenticate using service accounts:
```bash
vault write auth/kubernetes/role/app-role \
  bound_service_account_names=default \
  bound_service_account_namespaces=default \
  policies=default-policy \
  ttl=1h
```