# CI/CD Overview: Turborepo Monorepo with GitHub Actions

This document provides a high-level overview of our Continuous Integration/Continuous Deployment (CI/CD) strategy for the monorepo, leveraging Turborepo for efficient task orchestration and GitHub Actions for pipeline automation.

## Core Principles

*   **Monorepo Cohesion:** Utilize Turborepo to manage and optimize tasks across all workspaces (applications and infrastructure).
*   **Infrastructure as Code (IaC):** All infrastructure is defined and managed declaratively using OpenTofu and configured with Ansible.
*   **Secure Secrets:** Sensitive data is managed via HashiCorp Vault and securely injected into pipelines using GitHub Actions secrets.
*   **Automated Workflows:** GitHub Actions automate the entire build, test, and deployment lifecycle.
*   **Separation of Concerns:** Clear distinction between application code, infrastructure, and their respective deployment mechanisms.

## CI/CD Flow at a Glance

Our CI/CD process is structured around distinct GitHub Actions workflows that interact with Turborepo:

```mermaid
graph TD
    A[Code Push/PR Merge] --> B[CI Workflow (ci.yml)];

    subgraph Shared CI
        B --> C[Run turbo lint];
        C --> D[Run turbo build];
    end

    D -- Success --> E{Trigger Deployment Workflows};

    subgraph Infra Deployment
        E --> F[Infra Deploy Workflow (infra-deploy.yml)];
        F --> G[Authenticate Vault];
        G --> H[Fetch Infra Secrets];
        H --> I[Run turbo deploy-infra];
        I --> J[OpenTofu Apply & Ansible];
    end

    subgraph Docs App Deployment
        E --> K[Docs App Deploy Workflow (app-docs-deploy.yml)];
        K --> L[Authenticate K8s];
        L --> M[Run turbo deploy-docs];
        M --> N[Deploy to Kubernetes];
    end

    subgraph Web App Deployment (Vercel)
        E --> O[Vercel GitHub Integration];
        O --> P[Vercel Build & Deploy];
    end

    style O fill:#f9f,stroke:#333,stroke-width:2px
    style P fill:#f9f,stroke:#333,stroke-width:2px

    Vault[HashiCorp Vault] --> G;
    Vault --> H;
    GitHubSecrets[GitHub Actions Secrets] --> G;
    GitHubSecrets --> L;
```

### Workflow Breakdown:

1.  **Shared CI Workflow (`.github/workflows/ci.yml`):**
    *   **Purpose:** Acts as the initial gatekeeper for all changes. It performs universal linting and builds across the monorepo.
    *   **Triggers:** On every `push` to `main` and `pull_request` targeting `main`.
    *   **Tasks:** Executes `npx turbo run lint` and `npx turbo run build` to ensure code quality and successful compilation for all workspaces.
    *   **Dependency:** Must pass successfully for any subsequent deployment workflows to be triggered.

2.  **Infrastructure Deployment Workflow (`.github/workflows/infra-deploy.yml`):**
    *   **Purpose:** Manages the provisioning and configuration of our infrastructure.
    *   **Triggers:** Primarily triggered by changes within the `infrastructure/` directory or upon successful completion of the `ci.yml` workflow.
    *   **Tasks:**
        *   Authenticates with HashiCorp Vault using GitHub Actions secrets.
        *   Fetches dynamic infrastructure secrets from Vault.
        *   Executes Turborepo tasks: `npx turbo run deploy-infra-provision` (for OpenTofu `apply`) followed by `npx turbo run deploy-infra-configure` (for Ansible playbooks). Turborepo's `dependsOn` ensures the correct sequence.
    *   **Environments:** Utilizes GitHub Environments for environment-specific secrets and approval gates (e.g., `dev`, `staging`, `production`).

3.  **Application Deployment Workflow - Kubernetes (`.github/workflows/app-docs-deploy.yml`):**
    *   **Purpose:** Deploys applications intended for Kubernetes environments (e.g., `apps/docs`).
    *   **Triggers:** Triggered by changes in the specific application's directory (e.g., `apps/docs/**`) or upon successful completion of the `ci.yml` workflow.
    *   **Tasks:**
        *   Authenticates with the Kubernetes cluster (e.g., via OIDC roles).
        *   Executes the Turborepo task `npx turbo run deploy-docs` which contains the `kubectl` or Helm commands for deployment.
    *   **Environments:** Leverages GitHub Environments for target-specific configurations.

4.  **Application Deployment - Vercel (Native Integration):**
    *   **Purpose:** Deploys applications hosted on Vercel (e.g., `apps/web`).
    *   **Mechanism:** For Next.js applications, we primarily rely on Vercel's native GitHub integration. This integration automatically detects changes in the relevant workspace, builds the application (leveraging Turborepo's caching internally), and deploys it.
    *   **Note:** A dedicated GitHub Actions workflow for *deployment* is typically not required in this scenario, as Vercel handles the end-to-end CI/CD for these applications. GitHub Actions might still be used for pre-deployment checks like linting and testing.

## Secret Management

Our strategy adheres to the principles outlined in ADR-2025-05-09-Secret-Management and ADR-2025-05-11-vault-ssh-secrets-engine.
*   **GitHub Actions Secrets:** Used for initial, minimal credentials (e.g., Vault AppRole ID/Secret ID, OIDC client secrets) to authenticate the GitHub Actions runner.
*   **HashiCorp Vault:** The primary source for all dynamic and sensitive secrets (e.g., cloud provider API keys, database credentials, SSH certificates). Vault provides short-lived, auditable credentials, significantly reducing the attack surface.

## Dependencies and Orchestration

*   **Turborepo `dependsOn`:** Manages task dependencies *within* the monorepo (e.g., `deploy-infra-configure` depends on `deploy-infra-provision`).
*   **GitHub Actions `workflow_run`:** Allows higher-level workflows to be triggered upon the successful completion of prerequisite workflows (e.g., deployment workflows run only after `ci.yml` passes).
*   **GitHub Actions `paths` filtering:** Ensures workflows only trigger when relevant code changes, optimizing resource usage.

This comprehensive CI/CD strategy provides a secure, efficient, and maintainable approach to deploying our monorepo's applications and infrastructure.