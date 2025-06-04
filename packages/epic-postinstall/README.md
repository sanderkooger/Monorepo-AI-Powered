# epic-postinstall

A utility package designed to automate post-installation and cleanup tasks within your development environment. It provides a flexible and configurable way to manage external binaries, set up Python environments, and execute custom scripts across various operating systems.

## Features

*   **Binary Management:** Define and manage external command-line tools, including version checks and installation hints.
*   **Python Environment Setup:** Configure Python versions, create virtual environments, and install necessary Python packages.
*   **Custom Script Execution:** Run shell scripts at different lifecycle events (preinstall, postinstall, always) and target specific operating systems.
*   **System Information Detection:** Automatically detects OS, architecture, and available package managers to tailor execution.
*   **Configurable:** Easily define all tasks and dependencies via a simple configuration file.

## Installation

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
*   `binaries` (optional): An object defining external command-line tools to manage.
    *   `[name: string]`: The name of the binary.
        *   `cmd` (string): The command to execute to check for the binary's presence or version.
        *   `version` (string, optional): The expected version of the binary.
        *   `githubRepo` (string, optional): A URL to the binary's GitHub repository for installation instructions.
        *   `homebrewPackageName` (string, optional): The package name if available via Homebrew (for macOS).
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
  "binaries": {
    "shellcheck": {
      "cmd": "shellcheck",
      "version": "0.10.0",
      "githubRepo": "https://github.com/koalaman/shellcheck",
      "homebrewPackageName": "shellcheck"
    },
    "shfmt": {
      "cmd": "shfmt",
      "githubRepo": "https://github.com/mvdan/sh",
      "homebrewPackageName": "shfmt"
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

### Command Line Arguments

You can control the behavior of `epic-postinstall` using the following command-line arguments:

*   `--uninstall`: Triggers the uninstall-specific logic (e.g., running scripts marked for uninstallation).
*   `--verbose`: Increases the logging verbosity to include more detailed information.
*   `--debug`: Enables the most detailed debug logging, useful for troubleshooting.

### Logging

`epic-postinstall` uses a flexible logging system with the following levels (from least to most verbose): `ERROR`, `WARN`, `INFO` (default), `VERBOSE`, `DEBUG`. You can control the output using the `--verbose` and `--debug` flags.

## How it Works (High-Level Overview)

1.  **Argument Parsing:** The tool first parses any command-line arguments provided.
2.  **Logging Setup:** Based on the arguments, the logging level is adjusted.
3.  **Configuration Loading:** It searches for and loads the `epic-postinstall` configuration from your project.
4.  **System Information:** It detects the operating system, architecture, and available package managers.
5.  **Task Execution (TODO):** Based on the configuration and detected system information, it will (in future implementations) execute the defined binary checks, Python environment setups, and custom scripts.

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

*   **Binary Management Implementation:**
    *   Implement the core logic for checking binary versions and providing installation guidance or automated installation (e.g., via Homebrew).
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
    *   Further improve compatibility and testing on Windows environments.
*   **Comprehensive Testing:**
    *   Add extensive unit and integration tests to ensure reliability and correctness of all features.
*   **Expanded Examples:**
    *   Include more detailed and varied examples in the README for different use cases.