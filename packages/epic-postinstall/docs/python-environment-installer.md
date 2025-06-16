# Python Environment Installer

This document provides a technical overview of the Python environment installer integrated into `epic-postinstall`. This installer automates the setup of Python development environments, leveraging `asdf` for version management and `direnv` for virtual environment activation.

## Architecture and Workflow

The Python installer (`packages/epic-postinstall/src/env-installer/python.ts`) orchestrates the following steps:

1.  **Configuration Retrieval:** Reads Python-specific configuration from `epicpostinstall.config.ts`, including the desired Python version, virtual environment name, requirements file path, and a list of extra packages.

2.  **ASDF Python Plugin Management:**
    *   Checks if the `asdf-python` plugin is installed. If not, it automatically installs it using `asdf plugin add python`.

3.  **ASDF Python Version Management:**
    *   Verifies if the specified Python version (e.g., `3.12.4`) is installed via `asdf`. If not, it proceeds with the installation using `asdf install python <version>`.
    *   Sets the local Python version for the current project directory using `asdf set python <version>`. This action creates or updates a `.tool-versions` file in the project root, ensuring that `asdf` automatically selects the correct Python interpreter when working within this directory.

4.  **Virtual Environment Creation:**
    *   Creates a Python virtual environment (e.g., `.venv`) within the project root using the `asdf`-managed Python interpreter. The command `python -m venv <venv_name>` is executed, where `python` resolves to the version specified in `.tool-versions` due to `asdf`'s shims.

5.  **Requirements Installation:**
    *   If a `requirements.txt` file is specified in the configuration, the installer uses `pip` to install all listed dependencies into the newly created virtual environment.

6.  **Extra Packages Installation:**
    *   Installs any additional Python packages specified in the `packages` array within the configuration into the virtual environment.

7.  **Direnv Integration:**
    *   Utilizes a modular helper function (`packages/epic-postinstall/src/helpers/direnv/index.ts`) to manage the `.envrc` file in the project root.
    *   If the `.envrc` file does not exist, it creates it with the content `#!/bin/bash\nlayout python "<venv_name>"`.
    *   Crucially, it then automatically runs `direnv allow <path_to_.envrc>` to approve the `.envrc` file, preventing the "direnv is blocked" error and enabling automatic virtual environment activation upon directory entry. If the file already exists, it ensures it is allowed.

## Configuration Example

To configure the Python environment installer, add a `python` section to your `epicpostinstall.config.ts` file:

```typescript
// packages/epic-postinstall/epicpostinstall.config.ts
import { EpicPostinstallConfig } from './src/index.js'

const config: EpicPostinstallConfig = {
  python: {
    version: '3.12.4', // The desired Python version to install via asdf
    virtualEnv: {
      name: '.venv', // The name of the virtual environment directory
      requirementsFile: 'requirements.txt', // Path to your requirements file relative to project root
      packages: ['black', 'flake8'] // Additional packages to install
    },
    // scripts: [] // Optional: Python-specific scripts
  },
  // other configurations would go here
}

export default config
```

## Modular Components

*   **`packages/epic-postinstall/src/env-installer/python.ts`**: Contains the main logic for the Python environment installation process.
*   **`packages/epic-postinstall/src/helpers/direnv/index.ts`**: Provides a reusable function (`createDirenvFile`) for creating and managing `.envrc` files, including the `direnv allow` command.
*   **`packages/epic-postinstall/src/helpers/executeCommand/index.ts`**: A utility for executing shell commands and logging their output.