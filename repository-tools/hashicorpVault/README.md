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

**Note:** Avoid bootstrapping secrets in production via local scripts. Instead, manage secret injection through a centralized CI/CD pipeline.

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
### Automated Vault Bootstrap Script

Below is the detailed plan for a `vault-bootstrap.sh` script that handles initialization, unsealing, authentication, KV provisioning, and policy setup.

```mermaid
flowchart TD
  A[Start script] --> B[Check VAULT_ADDR]
  B --> C[vault status -format=json]
  C -->|initialized: false| D[Init Vault with 5 shares, threshold 3]
  D --> E[Parse init JSON → root_token & keys]
  E --> F[Unseal with first 3 keys]
  E --> G[Set VAULT_TOKEN = root_token]
  C -->|initialized: true| H[Check sealed status]
  H -->|sealed| I[Require user to supply key shares file]
  H -->|unsealed| J[Proceed to auth]
  G & J --> K{Auth method?}
  K -->|--token| L[export VAULT_TOKEN]
  K -->|--user/pass| M[vault login -method=userpass]
  K -->|--role-id/secret-id| N[vault login -method=approle]
  L & M & N --> O[Determine REPO_NAME]
  O --> P[vault secrets list | grep kv/REPO_NAME]
  P -->|exists| Q[Skip enable]
  P -->|missing| R[vault secrets enable -path=kv/REPO_NAME kv-v2]
  Q & R --> S[Write policy HCL → policies/REPO_NAME.hcl]
  S --> T[vault policy write REPO_NAME policies/REPO_NAME.hcl]
  T --> U[Done]
```

**Detailed Steps:**

1. **Validate Environment**  
   - Ensure `VAULT_ADDR` is defined.

2. **Check Initialization**  
   - `vault status -format=json`  
   - If `initialized: false`:  
     - Run `vault operator init -key-shares=5 -key-threshold=3 -format=json > init.json`.  
     - Parse `root_token` and the array of `unseal_keys`.  
     - Unseal with the first 3 keys:  
       ```bash
       for key in $(jq -r '.keys_base64[:3][]' init.json); do
         vault operator unseal "$key"
       done
       ```
     - Export `VAULT_TOKEN=$(jq -r '.root_token' init.json)`.

   - If `initialized: true` but sealed:  
     - Require a pre-existing keys file to unseal or exit with error.

3. **Authenticate**  
   Priority order:
   - `--token <root_token>` flag  
   - `--user <username> --pass <password>` → `vault login -method=userpass`  
   - `--role-id <role_id> --secret-id <secret_id>` → `vault login -method=approle`  
   - `VAULT_TOKEN` environment variable  
   - Otherwise: exit with usage error.

4. **Determine Repository Name**  
   ```bash
   REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
   ```

5. **Provision KV Engine**  
   ```bash
   if ! vault secrets list -format=json | jq -e ".[]|select(.path==\"kv/$REPO_NAME/\")"; then
     vault secrets enable -path="kv/$REPO_NAME" kv-v2
   fi
   ```

6. **Generate and Apply Policy**  
   - Create `policies/$REPO_NAME-policy.hcl` granting CRUD on `kv/$REPO_NAME/*`.  
   - Apply with:  
     ```bash
     vault policy write "$REPO_NAME" policies/"$REPO_NAME"-policy.hcl
     ```

7. **Exit**  
   - Return meaningful exit codes and verbose logs for CI integration.

Above plan ensures idempotent provisioning of KV and policies, supports fresh Vault initialization, and multiple auth methods.