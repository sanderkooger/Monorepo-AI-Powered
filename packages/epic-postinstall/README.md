# epic-postinstall

A utility package designed to automate post-installation and cleanup tasks within your development environment. It provides a flexible and configurable way to manage external binaries, set up Python environments, and execute custom scripts across various operating systems.

## Features

*   **Binary Management:** Define and manage external command-line tools, including version checks and installation hints.
*   **Python Environment Setup:** Configure Python versions, create virtual environments, and install necessary Python packages.
*   **Custom Script Execution:** Run shell scripts at different lifecycle events (preinstall, postinstall, always) and target specific operating systems.
*   **System Information Detection:** Automatically detects OS, architecture, and available package managers to tailor execution.
*   **Configurable:** Easily define all tasks and dependencies via a simple configuration file.

## Installation

**Note on Windows Compatibility:** The `binInstaller` is currently **incompatible** with Windows. It is recommended to use `epic-postinstall` exclusively on macOS or Linux for binary installations.

To install `epic-postinstall` and trigger its post-installation scripts (if configured), use `pnpm install` in your project's root directory:

```bash
pnpm install
```

Alternatively, you can run the `epic-postinstall` binary directly:

```bash
node node_modules/.bin/epic-postinstall
```

## Configuration

`epic-postinstall` is configured via a file named `.epicpostinstallrc.json` or `epicpostinstall.config.ts` (and other supported formats like `.js`, `.yaml`, etc.) located in your project's root or any parent directory. The configuration is loaded using `cosmiconfig`, allowing for flexible placement.

### Configuration Structure (`EpicPostinstallConfig`)

The configuration object supports the following top-level properties:

*   `message` (optional): A simple string message that can be displayed when the tool runs.
*   `gitBinaries` (optional): An object defining external command-line tools to manage, specifically those hosted on GitHub Releases.
    *   `[name: string]`: The unique name for the binary (e.g., `direnv`, `shellcheck`).
        *   `cmd` (string): The command name that the binary will be installed as (e.g., `direnv` for `direnv.exe`).
        *   `version` (string): The exact version of the binary to install (e.g., `2.36.0`).
        *   `githubRepo` (string): The full URL to the GitHub repository (e.g., `https://github.com/direnv/direnv`).
        *   `homebrew` (object, optional): Configuration for Homebrew installation (macOS/Linux).
            *   `name` (string): The Homebrew formula name (e.g., `direnv`).
            *   `tap` (string, optional): The Homebrew tap if it's not in the core repository (e.g., `rhysd/actionlint`).
        *   `postInstallScript` (object, optional): A script to run after the binary has been successfully installed.
            *   `inline` (string, optional): An inline shell command to execute.
            *   `path` (string, optional): A path to a shell script file to execute.
            *   **IMPORTANT SECURITY NOTE:** Executing post-install scripts can pose significant security risks if the script source is untrusted. Always ensure that any inline scripts or script files are from trusted sources and have been thoroughly reviewed.
*   `python` (optional): An object for configuring Python environments.
    *   `version` (string, optional): The desired Python version.
    *   `virtualEnv` (object, optional): Configuration for a Python virtual environment.
        *   `name` (string): The name of the virtual environment.
        *   `path` (string, optional): The path where the virtual environment should be created (defaults to `./.venv`).
        *   `requirementsFile` (string, optional): Path to a `requirements.txt` file to install packages from.
        *   `packages` (string[], optional): An array of Python packages to install directly.
    *   `scripts` (object[], optional): An array of Python scripts to execute within the configured Python environment.
        *   `name` (string): A descriptive name for the script.
        *   `path` (string): The path to the Python script.
        *   `args` (string[], optional): An array of command-line arguments to pass to the script.
*   `scripts` (object[], optional): An array of custom shell scripts to execute.
    *   `name` (string): A descriptive name for the script.
    *   `path` (string): The path to the shell script.
    *   `args` (string[], optional): An array of command-line arguments to pass to the script.
    *   `runOn` (string[], optional): An array specifying when the script should run. Possible values: `preinstall`, `postinstall`, `always`.
    *   `platforms` (string[], optional): An array specifying which operating systems the script should run on. Possible values: `linux`, `windows`, `macos`.

### Example `.epicpostinstallrc.json`

```json
{
  "message": "Hello from epic-postinstall!",
  "gitBinaries": {
    "shellcheck": {
      "cmd": "shellcheck",
      "version": "0.10.0",
      "githubRepo": "https://github.com/koalaman/shellcheck",
      "homebrew": {
        "name": "shellcheck"
      }
    },
    "direnv": {
      "cmd": "direnv",
      "version": "2.36.0",
      "githubRepo": "https://github.com/direnv/direnv",
      "homebrew": {
        "name": "direnv"
      },
      "postInstallScript": {
        "path": "./scripts/direnv_hook_setup.sh"
      }
    }
  },
  "python": {
    "version": "3.9",
    "virtualEnv": {
      "name": "epic-env",
      "requirementsFile": "requirements.txt",
      "packages": ["black", "flake8"]
    },
    "scripts": [
      {
        "name": "run_tests",
        "path": "./scripts/run_python_tests.py",
        "args": ["--verbose"]
      }
    ]
  },
  "scripts": [
    {
      "name": "setup_project",
      "path": "./scripts/setup.sh",
      "runOn": ["postinstall"],
      "platforms": ["linux", "macos"]
    },
    {
      "name": "cleanup_cache",
      "path": "./scripts/cleanup.sh",
      "runOn": ["always"]
    }
  ]
}
```

## Usage

### Running `epic-postinstall`

You can run `epic-postinstall` directly from your project's root where your `epicpostinstall.config.ts` (or other supported config file) is located.

```bash
# Using npx (recommended for direct execution)
npx @sanderkooger/epic-postinstall

# Or, if installed as a dependency
node node_modules/.bin/epic-postinstall
```

When run, `epic-postinstall` will:
1.  Load its configuration.
2.  Detect your system's OS and architecture.
3.  For each `gitBinary` defined:
    *   Check if the binary is already installed at the specified version.
    *   If not, it will download the appropriate release asset from GitHub (prioritizing compressed archives, then non-archived binaries).
    *   Unpack the archive (if applicable) and place the executable in `~/.local/bin/` (or equivalent for Windows).
    *   Make the binary executable.
    *   Execute any configured `postInstallScript`.
4.  (Future implementations will handle Python environments and general scripts as defined in the config.)

### Command Line Arguments

You can control the behavior of `epic-postinstall` using the following command-line arguments:

*   `--uninstall`: Triggers the uninstall-specific logic (e.g., running scripts marked for uninstallation).
*   `--verbose`: Increases the logging verbosity to include more detailed information.
*   `--debug`: Enables the most detailed debug logging, useful for troubleshooting.

### Logging

`epic-postinstall` uses a flexible logging system with the following levels (from least to most verbose): `ERROR`, `WARN`, `INFO` (default), `VERBOSE`, `DEBUG`. You can control the output using the `--verbose` and `--debug` flags.

## How it Works (Deep Dive)

`epic-postinstall` orchestrates various tasks based on a central configuration file. Here's a breakdown of its inner workings:

### Configuration Loading (`src/helpers/getConfig/index.ts`)

The tool uses `cosmiconfig` to load its configuration. This allows for flexible configuration file placement and formats. It searches for files like `.epicpostinstallrc.json`, `epicpostinstall.config.ts`, `package.json` (under the `epicpostinstall` key), and others, traversing up the directory tree from the current working directory.

The loaded configuration adheres to the `EpicPostinstallConfig` interface:

```typescript
export interface HomebrewPackage {
  name: string;
  tap?: string;
}

export interface PostInstallScript {
  inline?: string; // An inline shell command string
  path?: string;   // A path to a shell script file
}

export interface GitBinary {
  cmd: string;          // The command name (e.g., 'direnv')
  version: string;      // The target version (e.g., '2.36.0')
  githubRepo: string;   // The GitHub repository URL
  homebrew?: HomebrewPackage; // Homebrew details
  postInstallScript?: PostInstallScript; // Script to run after installation
}

export interface PythonVirtualEnv { /* ... */ }
export interface ScriptConfig { /* ... */ }
export interface PythonConfig { /* ... */ }

export interface EpicPostinstallConfig {
  message?: string;
  gitBinaries?: {
    [name: string]: GitBinary; // Map of binary names to their configurations
  };
  python?: PythonConfig;
  scripts?: ScriptConfig[];
}
```

### GitHub Binary Installer (`src/installer/binInstaller.ts`)

This module is responsible for downloading, unpacking, and installing binaries from GitHub Releases.

```mermaid
graph TD
    A[Start binInstaller] --> B{Check if asset is archive or direct executable};
    B -- Archive (.zip, .tar.gz, etc.) --> C[Download archive to temp file];
    B -- Direct Executable --> D[Stream executable directly to ~/.local/bin];
    C --> E[Unpack archive to temp directory];
    E --> F[Find executable within unpacked directory];
    F --> G[Copy executable to ~/.local/bin];
    G --> H[Set executable permissions (chmod 755)];
    D --> H;
    H --> I{Is postInstallScript configured?};
    I -- Yes --> J{Script Type?};
    J -- Inline --> K[Execute inline script];
    J -- Path --> L[Read script file content];
    L --> M[Execute script file];
    K --> N[Log script execution result];
    M --> N;
    N --> O[Clean up temporary files/directories];
    I -- No --> O;
    O --> P[End binInstaller];
    A --> Error[Error Handling];
    C --> Error; E --> Error; F --> Error; G --> Error; D --> Error; K --> Error; M --> Error;
```

**Key Steps:**
1.  **Asset Selection (`src/installer/selectReleaseUrl/selectReleaseUrl.ts`):**
    *   Filters GitHub release assets by the detected operating system (macOS, Linux, Windows) and architecture (x64, arm64, arm, riscv64).
    *   Prioritizes assets based on `ARCHIVE_PRIORITY_ORDER` (`.zip`, `.tar.gz`, `.tgz`, `.tar.xz`).
    *   If no preferred archived asset is found, it then looks for non-archived binaries (e.g., `.exe` for Windows, or other direct executables).
2.  **Download & Unpack:** Downloads the selected asset. If it's an archive, it's unpacked to a temporary directory.
3.  **Installation:** The executable is moved/copied to `~/.local/bin/` (or `C:\Users\<User>\.local\bin` on Windows) and made executable.
4.  **Post-Install Script Execution:** If `postInstallScript` is defined in the `GitBinary` configuration, the specified inline command or script file is executed. This allows for custom setup steps like adding shell hooks.

### GitHub Binary Uninstaller (`src/uninstaller/index.ts`)

The uninstaller module is responsible for removing previously installed binaries.

**How it Works:**
1.  Iterates through the `gitBinaries` defined in the configuration.
2.  For each binary, it constructs the expected installation path (`~/.local/bin/<cmd>`).
3.  Checks if the binary exists at that path.
4.  If found, it attempts to delete the binary file.
5.  Logs success or informs if the binary was not found.

## Development

To build the `epic-postinstall` package:

```bash
pnpm build
```

To run linting checks:

```bash
pnpm lint
```

## TODOs

The following features and improvements are planned for `epic-postinstall`:

*   **Python Environment Automation:**
    *   Implement the creation and activation of Python virtual environments.
    *   Add logic for installing Python packages from `requirements.txt` or directly from the `packages` list.
    *   Implement the execution of Python scripts defined in the configuration.
*   **Custom Script Execution Engine:**
    *   Develop the robust execution engine for custom shell scripts, respecting `runOn` events and `platforms` filters.
*   **Enhanced Error Handling:**
    *   Provide more granular and user-friendly error messages for failed operations.
    *   Implement graceful degradation or clear instructions for unsupported environments/missing dependencies.
*   **Windows Compatibility:**
    *   Implement full compatibility and robust testing for Windows environments.
*   **Comprehensive Testing:**
    *   Add extensive unit and integration tests to ensure reliability and correctness of all features.
*   **Expanded Examples:**
    *   Include more detailed and varied examples in the README for different use cases.