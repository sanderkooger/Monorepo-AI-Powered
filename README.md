# Full-Stack DevOps Monorepo Platform 🚀

<div align="center">
  [![CI - Lint, Build and Test All Workspaces](https://github.com/sanderkooger/Monorepo-AI-Powered/actions/workflows/ci.yml/badge.svg)](https://github.com/sanderkooger/Monorepo-AI-Powered/actions/workflows/ci.yml)
  <br><br>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white" alt="TurboRepo">
  <br>
  <img src="https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white" alt="pnpm">
  <img src="https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white" alt="ESLint">
  <img src="https://img.shields.io/badge/Prettier-F7B93E?logo=prettier&logoColor=black" alt="Prettier">
  <img src="https://img.shields.io/badge/Ansible-EE0000?logo=ansible&logoColor=white" alt="Ansible">
  <img src="https://img.shields.io/badge/OpenTofu-7B42BC?logo=opentofu&logoColor=white" alt="OpenTofu">
  <img src="https://img.shields.io/badge/HashiCorp%20Vault-FFEC6E?logo=hashicorpvault&logoColor=black" alt="HashiCorp Vault">
</div>

## Vision Statement

A production-ready monorepo platform for multi-language/technology systems with integrated DevOps capabilities, featuring:

- Full-stack application development (Next.js + TypeScript)
- Infrastructure-as-Code (OpenTofu/Ansible)
- Cross-platform component libraries
- End-to-end CI/CD pipelines
- Multi-environment deployment strategies
- Integrated testing frameworks
- Secret management Vault

## Current Capabilities ✅

```mermaid
graph LR
    A[Core Features] --> B[Next.js Applications]
    A --> C[Shared UI Components]
    A --> D[TypeScript Configs]
    A --> E[ESLint Configs]
    A --> F[Infrastructure Blueprints]
    F --> G[Ansible Playbooks]
    F --> H[OpenTofu Modules]
```

**Implemented Features:**

- 🛡️ Secure SSH relaying via a manually installed Jump Host for accessing private network machines from public runners (see [infrastructure/docker/jumphost/README.md](infrastructure/docker/jumphost/README.md) for installation)
- �️ Two Next.js demo apps (web & docs)
- 🧩 Shared UI component library
- 🔧 Unified TypeScript/ESLint configurations
- 🏗 Basic Infrastructure-as-Code patterns
- ⚡ TurboRepo-optimized build pipelines
- 🐘 PostgreSQL backend for OpenTofu state storage (hosted on Supabase)
- 🚀 **CI/CD Strategy:** Automated build, test, and deployment pipelines for both infrastructure and applications using GitHub Actions and Turborepo. See the [CI/CD Overview](docs/ci-cd-overview.md) for details.

## Roadmap 🛣️

```mermaid
gantt
    title Development Timeline
    dateFormat  YYYY-MM-DD
    section Core
    Local Dev Setup Scripts       :active, 2025-03-01, 14d
    Deployment Strategies         :2025-03-15, 14d
    section Infrastructure
    Cloud Provisioning Templates  :2025-04-01, 21d
    Monitoring Integration        :2025-04-22, 14d
```

**Immediate Priorities:**

1. 🛠 **One-Click Local Setup**

   - Automated environment provisioning
   - Dependency management
   - Local service orchestration

2. 🚀 **Deployment Strategies**

   - Multi-cloud deployment guides
   - Blue/Green deployment patterns
   - Canary release configurations

3. 🔒 **Security Foundations**
   - Bring Your Own HashiCorp Vault implementation ([ADR](./docs/architecture/decisions/2025-04-20-bring-your-own-vault.md))
   - Infrastructure hardening scripts
   - Compliance as Code templates
   - Example Helm configuration for development:
     ```yaml
     # infrastructure/ansible/examples/vault-helm-values.yaml
     server:
       enabled: true
       ha:
         enabled: true
         replicas: 3
     global:
       tlsDisable: true # Enable TLS in production
     storage:
       file:
         path: "/vault/data"
     ```

## Project Structure

```bash
.
├── .roo/                   # Directory for AI-driven development standards
│   ├── rules/
│   │   └── .roorules.md    # Repository-wide development standards
│   └── rules-architect/
│       └── .roorules.md    # Architecture-specific rules
├── apps/                   # Application-specific code
│   ├── web                 # Next.js production application
│   └── docs                # Documentation & system overview
├── packages/               # Shared libraries and configurations
│   ├── ui                  # Shared React components
│   ├── eslint-config       # Standardized lint rules
│   └── typescript-config   # TS base configurations
├── infrastructure/         # Infrastructure as Code (IaC)
│   ├── ansible             # Configuration management
│   │   └── playbooks/
│   │       └── setup-local-dev.yml # Playbook for dev tool installation
│   ├── opentofu            # Cloud provisioning (see .roorules for standards)
│   └── packer              # VM Image building (e.g., Proxmox Ubuntu) -> [See Details](./infrastructure/packer/)
├── scripts/                # Utility and setup scripts
│   └── setup-dev-env.sh    # Script to bootstrap dev environment
└── turbo.json              # Build pipeline config
```

### Preferred Way of Working

- **Branching:** For new features, create a branch from the main branch. Use atomic commits within these branches to document changes effectively.
- **Commits:** Ensure commits are small, focused, and descriptive to enhance the project's documentation through git history.

## Development Standards & AI Guidance

This repository employs a hierarchical system of `.roorules.md` files to define development standards, best practices, and operational guidelines. These rules are utilized by AI development assistants (like Roo) to ensure consistency, quality, and adherence to architectural decisions across the monorepo.

### `.roorules.md` Hierarchy

The rules are organized as follows:

```mermaid
graph TD
    A[Monorepo Root] --> B[<code>.roo/</code> Directory]
    B --> C[<code>rules/.roorules.md</code><br>(Global Repository Standards)]
    B --> D[<code>rules-architect/.roorules.md</code><br>(Global Architect Role Standards)]
    B --> E[<code>rules-<other-role>/.roorules.md</code><br>(Future Role-Specific Standards)]
    A --> F[Specific Directory<br>(e.g., <code>infrastructure/opentofu/</code>)]
    F --> G[<code>.roorules</code> or <code>.roorules.md</code><br>(Directory-Specific Standards)]
```

*   **Global Repository Standards (`.roo/rules/.roorules.md`):**
    *   **Purpose:** Defines overarching standards applicable to the entire repository.
    *   **Current Scope:** Covers general code style (TypeScript, indentation, React, JSDoc), commit strategies, documentation practices (READMEs, ADRs, JSDocs), and recommended MCP (Model Context Protocol) tool usage.
*   **Role-Specific Global Standards (`.roo/rules-<role>/.roorules.md`):**
    *   **Purpose:** Provides specialized guidelines for different development roles.
    *   **Example (`.roo/rules-architect/.roorules.md`):** Defines architectural design principles (e.g., hexagonal architecture), documentation standards for architectural decisions (ADRs, secret management), and decision record formats.
*   **Directory-Specific Standards (`<directory>/.roorules.md` or `.roorules`):**
    *   **Purpose:** Allows for context-specific rules tailored to particular technologies, modules, or sub-projects. These rules complement or can override global rules for that specific context.
    *   **Example (`infrastructure/opentofu/.roorules`):** Details standards for OpenTofu structure, environment management, coding practices, change validation, and documentation.
    *   **Example (`infrastructure/packer/ubuntu/22.04/.roorules.md`):** Currently a placeholder, indicating Packer rules are for future reference.

**Usage:**

AI tools will reference these `.roorules.md` files to:
- Understand project standards and constraints.
- Generate code and configurations aligned with established practices.
- Assist in reviews and suggest improvements based on defined rules.
- Provide contextually relevant advice and solutions.

## Getting Started

```bash
# Clone & install
git clone  https://github.com/sanderkooger/Monorepo-AI-Powered.git
cd devops-monorepo
pnpm install

# Start development servers
pnpm dev
```

### Dependency Management

This monorepo employs a decentralized dependency management strategy. All dependencies, including non-npm ones (e.g., system binaries, Python packages), are managed through the `pnpm install` process.

Each project is responsible for its own dependencies. This is achieved by including a `postinstall` script in the project's `package.json` that executes a project-specific `install.sh` script. This `install.sh` script handles the setup of all necessary tools and environments for that particular project.

**Key Principles:**
*   **`pnpm install` is King:** Running `pnpm install` at the monorepo root (or within a project) will trigger all necessary setup.
*   **Project-Specific `install.sh`:** Each project will have an `install.sh` script (hooked via `postinstall` in `package.json`) responsible for its unique dependencies.
*   **Binary Installation Preference:** When installing binaries, prefer `~/.local/bin` to ensure broad compatibility across Linux distributions.
*   **Language Agnostic Setup:** `install.sh` scripts will manage language-specific setups (e.g., Python virtual environments, package installations).

This approach deprecates the use of `dev-init` scripts and centralized Ansible playbooks for dependency setup, promoting a more scalable and autonomous project structure.
