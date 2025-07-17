# 20250525-centralized-dependency-management-via-pnpm-postinstall-scripts

## Status
Proposed

## Context
Currently, the monorepo relies on a `dev-init` script and an Ansible playbook for setting up project-specific dependencies, including non-npm ones. This approach has proven to be less scalable and maintainable as the number of projects and their diverse dependency requirements grow. Managing dependencies outside of the primary package manager (pnpm) leads to inconsistencies, manual overhead, and potential environment-specific issues across different Linux distributions.

## Decision
We will centralize all dependency management, including non-npm dependencies, through the pnpm install process. This will be achieved by implementing `postinstall` scripts within each project's `package.json` file.

Each project will be responsible for defining and managing its own dependencies. For non-npm dependencies (e.g., Python packages, binaries), a script named `install.sh` will be created within the respective project directory. This `install.sh` script will be invoked as a `postinstall` hook in the project's `package.json`.

When installing binaries, the preferred location will be `~/.local/bin` to ensure compatibility across various Linux distributions. The `install.sh` script will include logic to check for existing binary installations and their versions. If the version intended for installation is newer than the existing one, it will overwrite; otherwise, it will skip the installation. The script should provide clear `echo` feedback on installation status, similar to Ansible's verbose output. For projects written in other languages (e.g., Python), the `install.sh` script will also handle the setup of language-specific environments, such as virtual environment creation and package installation.

This decision deprecates the existing `dev-init` script and the Ansible playbook for dependency setup, moving towards a more decentralized and scalable model where each project self-manages its environment.

## Consequences
### Positive
*   **Increased Scalability:** Each project manages its own dependencies, reducing the burden on a centralized setup script.
*   **Improved Maintainability:** Changes to project dependencies are localized within the project, simplifying updates and reducing the risk of breaking other projects.
*   **Cross-Distribution Compatibility:** Preferring `~/.local/bin` for binaries enhances compatibility across different Linux distributions.
*   **Project Autonomy:** Projects gain more control over their specific environment setup.
*   **Streamlined Onboarding:** New developers can rely on a single `pnpm install` command to set up the entire monorepo, including non-npm dependencies.

### Negative
*   **Initial Migration Effort:** Existing projects will need to be updated to incorporate the `install.sh` script and `postinstall` hooks.
*   **Increased Project-Level Responsibility:** Each project team must ensure their `install.sh` scripts are robust and correctly handle all dependencies.
*   **Potential for Inconsistent `install.sh` Quality:** Without strict guidelines, the quality and robustness of `install.sh` scripts might vary across projects. (This can be mitigated by providing templates and best practices).