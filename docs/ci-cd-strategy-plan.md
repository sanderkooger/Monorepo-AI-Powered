# Plan for Modular CI/CD Strategy

The goal is to implement a modular CI/CD strategy for the Turborepo monorepo by creating reusable GitHub Actions workflows and updating existing ones. This will improve maintainability, reduce duplication, and enable more focused deployments.

## Phase 1: Create Reusable Setup Workflow

1.  **Create `reusable-setup.yml`**:
    *   **Path**: `.github/workflows/reusable-setup.yml`
    *   **Purpose**: Encapsulate common setup steps for all CI/CD workflows.
    *   **Content**:
        *   `actions/checkout@v4`
        *   `pnpm/action-setup@v4`
        *   `actions/setup-node@v4` (Node.js 24, pnpm cache)
        *   `actions/cache@v4` for `pnpm` modules.
        *   `pnpm install --frozen-lockfile`

## Phase 2: Update Core CI Workflow

1.  **Modify `ci.yml`**:
    *   **Path**: `.github/workflows/ci.yml`
    *   **Purpose**: Utilize the reusable setup and focus on linting, building, and testing affected workspaces.
    *   **Changes**:
        *   Replace existing setup steps with a call to `reusable-setup.yml`.
        *   Update `lint` and `build` steps to use `npx turbo run <task> --filter="[HEAD^1...HEAD]"`.
        *   Add a `test` step using `npx turbo run test --filter="[HEAD^1...HEAD]"`.
        *   Add steps to install OpenTofu and TFLint, as these are specific to the `build` task (which includes OpenTofu planning).
        *   Add a step to upload application build artifacts.

## Phase 3: Create Infrastructure Deployment Workflow

1.  **Create `infra-deploy.yml`**:
    *   **Path**: `.github/workflows/infra-deploy.yml`
    *   **Purpose**: Automate infrastructure provisioning and configuration.
    *   **Content**:
        *   Triggered by `push` to `main` branch on changes in `infrastructure/opentofu/**`, `infrastructure/ansible/**`, or `turbo.json`.
        *   Allow `workflow_dispatch` for manual runs.
        *   Utilize `reusable-setup.yml`.
        *   Install OpenTofu and TFLint.
        *   Execute `npx turbo run deploy-infra-provision --filter="infrastructure/opentofu..."` (for OpenTofu apply).
        *   Execute `npx turbo run deploy-infra-configure --filter="infrastructure/ansible..."` (for Ansible configuration).
        *   Consider environment variables and secrets required for OpenTofu and Ansible.

## Phase 4: Create Example Application Deployment Workflow

1.  **Create `deploy-web-app.yml`**:
    *   **Path**: `.github/workflows/deploy-web-app.yml`
    *   **Purpose**: Provide a template for deploying web applications.
    *   **Content**:
        *   Triggered by `workflow_run` on successful completion of `ci.yml`.
        *   Triggered by `push` to `main` branch on changes in `apps/web/**`, `packages/ui/**`, or `turbo.json`.
        *   Allow `workflow_dispatch` for manual runs.
        *   Utilize `reusable-setup.yml`.
        *   Download application build artifacts.
        *   Include placeholder steps for web application deployment (e.g., Vercel deployment).

## Environment Variables and Secrets Considerations:

*   **`reusable-setup.yml`**: No specific environment variables or secrets needed here, as it's generic setup.
*   **`ci.yml`**:
    *   `TURBO_TEAM`, `VAULT_ADDR`, `ENV_NAME` (vars)
    *   `VAULT_TOKEN`, `TF_VAR_BACKEND_PG_CONN_STR`, `TURBO_TOKEN`, `TF_VAR_PROXMOX_NODE_NAME` (secrets)
    *   These should be passed to the jobs that use them.
*   **`infra-deploy.yml`**:
    *   Will require `VAULT_ADDR`, `VAULT_TOKEN`, `ENV_NAME`, `TF_VAR_PROXMOX_NODE_NAME`, `TF_VAR_BACKEND_PG_CONN_STR` and any other secrets/variables necessary for OpenTofu apply and Ansible configuration.
*   **`deploy-web-app.yml`**:
    *   Will require secrets for the deployment platform (e.g., `VERCEL_TOKEN`).

## Mermaid Diagram for Workflow Dependencies:

```mermaid
graph TD
    A[Push/PR] --> B{Core CI Workflow};
    B --> C[Reusable Setup Workflow];
    B --> D[Lint Affected];
    B --> E[Build Affected];
    B --> F[Test Affected];
    E --> G[Upload Build Artifacts];

    H[Push to Infra Paths/Manual] --> I{Infra Deploy Workflow};
    I --> C;
    I --> J[OpenTofu Apply];
    I --> K[Ansible Configure];

    L[Core CI Success/Push to App Paths/Manual] --> M{App Deploy Workflow};
    M --> C;
    M --> N[Download Build Artifacts];
    M --> O[Deploy Web App (Placeholder)];