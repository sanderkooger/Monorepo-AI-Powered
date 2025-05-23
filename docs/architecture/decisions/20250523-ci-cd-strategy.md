---
**ADR-2025-05-23-CI-CD-Strategy: Turborepo Monorepo Deployment with GitHub Actions**
*   **Status:** Proposed
*   **Deciders:** Architecture Team, DevOps Team
*   **Date:** 2025-05-23

**Context and Problem Statement:**
Our monorepo, managed with Turborepo, contains diverse applications (e.g., Next.js web app, documentation site) and infrastructure code (OpenTofu, Ansible). We need a robust, scalable, and secure Continuous Integration/Continuous Deployment (CI/CD) strategy using GitHub Actions that addresses:
1.  Efficiently building, testing, and deploying multiple applications and infrastructure components.
2.  Handling different deployment targets and mechanisms (e.g., Vercel for web apps, Kubernetes for other services).
3.  Ensuring secure secret management, leveraging existing Vault integration.
4.  Maintaining clear separation of concerns while optimizing for monorepo benefits (caching, shared tasks).
5.  Managing dependencies between infrastructure and application deployments.

**Decision Drivers:**
*   **Efficiency:** Maximize build/deploy speed through caching and parallelization.
*   **Security:** Implement secure secret handling and least-privilege access.
*   **Modularity:** Allow independent deployment of components while maintaining overall consistency.
*   **Maintainability:** Keep CI/CD configurations clear, readable, and easy to update.
*   **Leverage Existing Tools:** Integrate seamlessly with Turborepo, GitHub Actions, and HashiCorp Vault.

**Decision:**
We will implement a CI/CD strategy that combines GitHub Actions for top-level orchestration and environment management, with Turborepo for efficient task execution and dependency management within the monorepo. This involves:

1.  **Separate GitHub Actions Workflows:** Create distinct `.github/workflows/*.yml` files for different phases and deployment targets (e.g., `ci.yml`, `infra-deploy.yml`, `app-docs-deploy.yml`).
2.  **Reusable Workflows for Shared Steps:** Utilize GitHub Actions' `workflow_call` to define common CI steps (linting, shared builds) in a single reusable workflow (`ci.yml`) that other deployment workflows can invoke.
3.  **Turborepo for Internal Task Orchestration:** Define deployment scripts (e.g., `deploy-infra`, `deploy-docs`, `deploy-web`) within each workspace's `package.json`. GitHub Actions workflows will invoke these scripts using `npx turbo run <task> --filter=<workspace>`. Turborepo's `pipeline` configuration in `turbo.json` will manage inter-workspace task dependencies (e.g., `deploy-docs` depends on `deploy-infra`).
4.  **Target-Specific Deployment Mechanisms:**
    *   **Vercel-hosted applications (e.g., `apps/web`):** Leverage Vercel's native GitHub integration for automated builds and deployments. A dedicated GitHub Actions workflow for deployment might not be necessary, focusing instead on linting/testing.
    *   **Kubernetes-hosted applications (e.g., `apps/docs`):** A dedicated GitHub Actions workflow will handle authentication to the Kubernetes cluster and execute `kubectl` or Helm commands via a Turborepo script.
    *   **Infrastructure (OpenTofu/Ansible):** A dedicated GitHub Actions workflow will manage OpenTofu `plan`/`apply` and Ansible playbook execution, triggered by changes in the `infrastructure/` directory or after the shared CI workflow.
5.  **Secure Secret Management:** GitHub Actions secrets will be used for initial authentication to HashiCorp Vault. Vault will then provide dynamic, short-lived credentials (e.g., cloud provider API keys, SSH certificates) to the CI/CD pipeline for actual deployment operations, adhering to ADR-2025-05-09-Secret-Management and ADR-2025-05-11-vault-ssh-secrets-engine.
6.  **GitHub Environments:** Utilize GitHub Environments to manage environment-specific secrets, approval gates, and concurrency for sensitive deployments (e.g., `production`).

**Rationale:**
*   **Modularity and Separation of Concerns:** Separate workflows allow each component's CI/CD to be managed independently, reducing complexity and improving focus.
*   **Efficiency:** Turborepo's caching and parallelization significantly speed up monorepo operations. Reusable workflows prevent duplication of common CI steps.
*   **Scalability:** The modular approach scales well with an increasing number of applications and infrastructure components.
*   **Security:** Leveraging GitHub Actions secrets and Vault's dynamic secrets ensures sensitive information is handled securely, minimizing exposure of long-lived credentials.
*   **Clear Dependency Management:** Turborepo's `dependsOn` explicitly defines the order of operations within the monorepo, while `workflow_run` in GitHub Actions can chain high-level workflows.
*   **Flexibility:** Accommodates diverse deployment targets (Vercel, Kubernetes) with tailored configurations.

**Consequences:**
*   **Positive:**
    *   Streamlined and automated deployment processes for both code and infrastructure.
    *   Improved security posture through centralized secret management and short-lived credentials.
    *   Faster CI/CD cycles due to Turborepo's optimizations.
    *   Clearer separation of responsibilities within the CI/CD pipeline.
    *   Enhanced maintainability of CI/CD configurations.
*   **Negative:**
    *   Initial setup requires careful configuration of multiple GitHub Actions workflows and Turborepo pipelines.
    *   Requires understanding of both GitHub Actions and Turborepo concepts for effective management.
    *   Increased number of `.yml` files in `.github/workflows/` directory.

**Diagram of CI/CD Flow:**

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
---