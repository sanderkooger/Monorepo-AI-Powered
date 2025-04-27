# HashiCorp Vault Repository Tools

This directory contains scripts and configuration for deploying and integrating HashiCorp Vault into your environment. Vault deployment is optional; you can bring your own Vault.

## Optional Vault Deployment

### Add the HashiCorp Helm Repository

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update
```

### Install Vault with Helm

```bash
helm install vault hashicorp/vault \
  -f repository-tools/hashicorpVault/values.yaml \
  --namespace vault \
  --create-namespace
```

#### Key `values.yaml` Configuration

- `global.externalVaultAddr`: If set, the chart skips server deployment and uses an existing Vault.
- `global.tlsDisable`: Disable TLS for development.
- `server.enabled`: Enable (`true`) or disable (`false`) the Vault server component.
- `ingress.enabled`: Configure ingress for external access.
- Update image tags, resources, and ingress hosts as needed.

## Bring Your Own Vault

If you already have a Vault server, follow these steps to configure it for your repository.

### Prerequisites

- Vault CLI installed and configured with `VAULT_ADDR`.
- Appropriate authentication method (token, AppRole, etc.).

### Enable KV Secrets Engine

Enable a KV v2 secrets engine at a path named after your repository:

```bash
export REPO_NAME=<your-repo-name>
vault secrets enable -path="kv/$REPO_NAME" kv-v2
```

### KV Store Structure

We store secrets under a KV store keyed by repository and environment:

```
kv/<REPO_NAME>/dev/<secret-key>
kv/<REPO_NAME>/test/<secret-key>
kv/<REPO_NAME>/accept/<secret-key>
kv/<REPO_NAME>/prod/<secret-key>
```

### Storing Secrets

```bash
vault kv put "kv/$REPO_NAME/dev/db-credentials" \
  username="user" password="pass"
```

### Retrieving Secrets

```bash
vault kv get "kv/$REPO_NAME/prod/db-credentials"
```

### Next Steps

- Create and apply policies to control access to each environment path.
- Integrate Vault into your CI/CD pipeline.