# `epic-postinstall`

`epic-postinstall` is a powerful and flexible post-installation script designed to automate the setup of development environments within monorepos. It simplifies the process of installing and managing various binaries and toolchains by fetching them directly from their GitHub releases, ensuring consistency and reducing manual setup overhead for developers and CI/CD pipelines.

## Features

*   **Automated Binary Installation**: Installs command-line tools and applications directly from their official GitHub releases, supporting various operating systems (Linux, macOS) and architectures.
*   **ASDF Version Manager Integration**: Seamlessly installs and configures `asdf`, allowing for easy management of multiple language runtimes and tools.
*   **Shell Environment Updates**: Automatically updates common shell configuration files (e.g., `.bashrc`, `.zshrc`, `.profile`, `config.fish`, `init.nu`, `rc.elv`) to ensure installed binaries are in your PATH and shell completions are available.
*   **Installation State Management**: Tracks installed binaries and their versions in a local state file (`.epic-postinstall-state.json`) for reliable uninstallation and idempotency.
*   **Uninstallation Capabilities**: Provides a clean way to remove all binaries and configurations managed by `epic-postinstall`.
*   **Configurable**: All installations are driven by a simple, declarative configuration file (`epicpostinstall.config.ts`).

## Installation

To use `epic-postinstall` in your monorepo, you typically add it as a `postinstall` script in your root `package.json` or within a specific package.

1.  **Install `epic-postinstall` as a dependency**:
    ```bash
    pnpm add -w epic-postinstall
    # or yarn add epic-postinstall
    # or npm install epic-postinstall
    ```
    (Note: `-w` is for pnpm workspaces, adjust for your package manager if not using workspaces or do not need epic postinstall in the root of the workspace )

2.  **Add to your `package.json` scripts**:
    In your root `package.json` (or the relevant package's `package.json`), add a script to execute `epic-postinstall` after dependencies are installed:

    ```json
    {
      "scripts": {
        "postinstall": "epoc-postinstall]"
      }
    }
    ```
    

## Usage

Once configured, `epic-postinstall` will run automatically after your package manager's `install` command (e.g., `pnpm install`, `npm install`, `yarn install`).

You can also run it manually:

```bash
node epic-postinstall
```

### Command-Line Flags

*   `--uninstall`: Runs the uninstallation process, removing all binaries and configurations managed by `epic-postinstall`.
    ```bash
    node .epic-postinstall --uninstall
    ```
*   `--verbose`: Increases the logging verbosity to show more detailed information during execution.
*   `--debug`: Sets the logging level to debug, providing the most granular output for troubleshooting.

## Configuration (`epicpostinstall.config.ts`)

`epic-postinstall` is configured via an `epicpostinstall.config.ts` (or `.js`, `.json`, `.epicpostinstallrc`) file located at the root of your project. This file defines which binaries to install and how they should be configured.

Below is a comprehensive example of an `epicpostinstall.config.ts` file, demonstrating various configuration options:

```typescript
import { EpicPostinstallConfig } from 'epic-postinstall';

const config: EpicPostinstallConfig = {
  message: 'Setting up your monorepo development environment...',
  gitBinaries: {
    gh: {
      cmd: 'gh',
      version: '2.39.1', // Specify the exact version
      githubRepo: 'https://github.com/cli/cli',
      homebrew: {
        name: 'gh',
      },
      shellUpdate: {
        bash: {
          loginShell: false,
          snippets: ['eval "$(gh completion -s bash)"'],
        },
        zsh: {
          loginShell: false,
          snippets: ['eval "$(gh completion -s zsh)"'],
        },
        fish: ['gh completion fish | source'],
      },
    },
    terraform: {
      cmd: 'terraform',
      version: '1.7.5',
      githubRepo: 'https://github.com/hashicorp/terraform',
      homebrew: {
        name: 'terraform',
        tap: 'hashicorp/tap',
      },
    },
    opentofu: {
      cmd: 'tofu', // The command name might differ from the repo name
      version: '1.6.0',
      githubRepo: 'https://github.com/opentofu/opentofu',
    },
  },
  asdf: {
    version: '0.14.0', // Version of ASDF itself
    tools: {
      nodejs: {
        version: '20.11.0', // Node.js version to install via ASDF
      },
      python: {
        version: '3.10.12', // Python version to install via ASDF
      },
    },
  },
  // python: { // Planned feature: Python virtual environment management
  //   virtualEnv: {
  //     name: 'my-venv',
  //     path: './.venv',
  //     requirementsFile: './requirements.txt',
  //   },
  // },
  // scripts: [ // Planned feature: Custom script execution
  //   {
  //     name: 'setup-direnv-hook',
  //     path: './scripts/direnv_hook_setup.sh',
  //     args: ['--force'],
  //   },
  // ],
};

export default config;
```

### Configuration Properties Explained:


*   `gitBinaries` (optional, object): An object where keys are arbitrary names for your binaries (e.g., `gh`, `terraform`) and values are `GitBinary` objects.
    *   `cmd` (string, required): The actual command name of the binary (e.g., `gh`, `terraform`, `tofu`).
    *   `version` (string, required): The exact version string of the binary to install (e.g., `2.39.1`).
    *   `githubRepo` (string, required): The full URL to the GitHub repository where the binary releases are hosted (e.g., `https://github.com/cli/cli`).
    *   `homebrew` (optional, object): For macOS users, specifies Homebrew details. If provided, `epic-postinstall` will attempt to use Homebrew for installation if available.
        *   `name` (string, required): The Homebrew package name (e.g., `gh`).
        *   `tap` (optional, string): The Homebrew tap if the package is not in the core repository (e.g., `hashicorp/tap`).
    *   `shellUpdate` (optional, object): Defines shell snippets to add for PATH updates or shell completions. See `ShellUpdaterData` in the [Technical Deep Dive](docs/technical.md) for details.
    *   `postInstallScript` (optional, object): Defines a script to run after the binary is installed. Can be `inline` content or a `path` to a file.
*   `asdf` (optional, object): Configures the installation and management of `asdf`.
    *   `version` (string, required): The desired version of the `asdf` tool itself.
    *   `tools` (optional, object): An object mapping ASDF tool names (e.g., `nodejs`, `python`) to `AsdfTool` objects.
        *   `version` (string, required): The desired version of the specific tool to install via ASDF.
*   `python` (optional, object): **(Planned Feature)** Configuration for Python virtual environments and package management.
*   `scripts` (optional, array): **(Planned Feature)** An array of `ScriptConfig` objects to define and execute custom scripts.

## Contributing

Please refer to the main [Monorepo Contribution Guidelines](../../CONTRIBUTING.md) for information on how to contribute to this project.

## License

This project is licensed under the [MIT License](../../LICENSE).

---
For a detailed technical explanation of `epic-postinstall`'s architecture, components, and internal workings, please refer to the [Technical Deep Dive](docs/technical.md).