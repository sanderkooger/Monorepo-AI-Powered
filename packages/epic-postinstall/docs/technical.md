# `epic-postinstall` Technical Deep Dive

## Introduction

The `epic-postinstall` package is a robust solution for automating the setup of development environments within a monorepo. It streamlines the process of installing and managing various binaries and toolchains, ensuring consistency across different developer machines and CI/CD environments. By leveraging GitHub releases and intelligent shell integration, it simplifies dependency management and reduces manual setup overhead.

## Core Components

### `index.ts` - The Orchestrator

`index.ts` serves as the main entry point for the `epic-postinstall` script. It is responsible for:

*   **Argument Parsing**: It processes command-line arguments such as `--uninstall`, `--verbose`, and `--debug` to control the script's behavior and logging level.
*   **Environment Setup**: Retrieves the `GITHUB_TOKEN` from environment variables for authenticated GitHub API requests.
*   **System Information Detection**: Utilizes the `getSystemInfo` helper to identify the operating system (Linux, macOS supported; Windows with limited compatibility), architecture, and user's home directory.
*   **Configuration Loading**: Loads the `epicpostinstall.config.ts` (or other supported formats) using `getConfig` to determine which binaries and tools to manage.
*   **Execution Flow**: Based on the presence of the `--uninstall` flag, it orchestrates either the uninstallation process via `uninstaller` or the installation process via `installer`.

### Configuration (`getConfig/index.ts`)

The `getConfig` module is responsible for loading the `epic-postinstall` configuration. It uses `cosmiconfig` to search for configuration files (e.g., `epicpostinstall.config.ts`, `.epicpostinstallrc.json`) in the current working directory and its parent directories.

The primary configuration interface is `EpicPostinstallConfig`:

```typescript
export interface EpicPostinstallConfig {
  message?: string;
  gitBinaries?: {
    [name: string]: GitBinary;
  };
  python?: PythonConfig; // Currently a placeholder, not fully implemented
  scripts?: ScriptConfig[]; // Currently a placeholder, not fully implemented
  asdf?: AsdfConfig;
  direnv?: DirenvConfig; // Added direnv configuration
}

export interface GitBinary {
  cmd: string; // The command name (e.g., 'gh', 'terraform')
  version: string; // The desired version (e.g., '2.39.1')
  githubRepo: string; // The GitHub repository URL (e.g., 'https://github.com/cli/cli')
  homebrew?: HomebrewPackage; // Optional Homebrew package details for macOS
  shellUpdate?: ShellUpdaterData; // Optional shell update configuration
  postInstallScript?: PostInstallScript; // Optional post-installation script
}

export interface HomebrewPackage {
  name: string; // Homebrew package name (e.g., 'gh')
  tap?: string; // Optional Homebrew tap (e.g., 'hashicorp/tap')
}

export interface PostInstallScript {
  inline?: string; // Inline script content
  path?: string; // Path to an external script file
}

export interface PythonVirtualEnv {
  name: string; // Name of the virtual environment
  path?: string; // Optional path for the virtual environment
  requirementsFile?: string; // Path to a requirements.txt file
  packages?: string[]; // List of Python packages to install
}

export interface ScriptConfig {
  name: string; // Name of the script
  path: string; // Path to the script file
  args?: string[]; // Optional arguments for the script
}

export interface PythonConfig {
  version?: string; // Desired Python version
  virtualEnv: PythonVirtualEnv;
  scripts?: ScriptConfig[];
}

export interface AsdfTool {
  version: string; // Desired version for the ASDF tool
}

export interface AsdfConfig {
  version?: string; // Optional: Desired ASDF version. Defaults to '0.18.0'.
  tools?: {
    [toolName: string]: AsdfTool; // Map of ASDF tools and their versions
  };
}

export interface DirenvConfig {
  version?: string; // Optional: Desired direnv version. Defaults to '2.36.0'.
  // Future: Add other direnv specific options here if needed
}
```

**Note on `python` and `scripts` sections:** While these interfaces are defined in `EpicPostinstallConfig`, their full implementation for automated installation and management is a planned feature and not yet fully active in the current `installer` logic.

### System Information (`helpers/getSystemInfo/index.ts`)

This module gathers crucial system-specific details:

*   **Operating System**: Detects `linux`, `macos`, or `windows` (with a warning for limited Windows compatibility).
*   **Architecture**: Identifies the CPU architecture (e.g., `x64`, `arm64`).
*   **Home Directory**: Provides the user's home directory path.
*   **Homebrew Availability**: Checks for the presence of Homebrew on macOS, which can be used for certain installations.

### Logging (`logger/index.ts`)

The `logger` module provides a centralized and configurable logging utility. It supports various log levels:

*   `LogLevel.DEBUG`: Most verbose, for detailed internal process information.
*   `LogLevel.VERBOSE`: More detailed than INFO, less than DEBUG.
*   `LogLevel.INFO`: General information (default level).
*   `LogLevel.WARN`: Warnings (displayed in yellow).
*   `LogLevel.ERROR`: Critical errors (displayed in red).
*   `LogLevel.SUCCESS`: Success messages (always displayed, in green).

The log level can be set via command-line flags (`--debug`, `--verbose`) or defaults to `INFO`.

### Installation Flow (`installer/index.ts`)

The `installer` module orchestrates the installation of binaries and tools defined in the configuration.

1.  **Project Root Detection**: Uses `findProjectRoot` to locate the monorepo's root directory, essential for state management.
2.  **`.gitignore` Entry**: Ensures that the `.epic-postinstall-state.json` file is added to the project's `.gitignore` to prevent it from being committed.
3.  **PATH Environment Variable**: Adds `~/.local/bin` to the system's PATH environment variable for various shells (`bash`, `zsh`, `sh`, `fish`, `nushell`, `elvish`) using `shellUpdater`. This ensures that installed binaries are discoverable.
4.  **ASDF Installation**:
    *   Ensures `asdf` is installed. If `asdf` is not explicitly configured in `epicpostinstall.config.ts`, it defaults to version `0.18.0`.
    *   Verifies if ASDF is already installed and at the correct version.
    *   If not installed or version mismatch, it triggers the installation or update of ASDF itself using `handleGitBinaryInstallation`.
    *   Applies necessary ASDF shell initializations (shims, completions) via `shellUpdater`.
5.  **Direnv Installation**:
    *   Ensures `direnv` is installed. If `direnv` is not explicitly configured in `epicpostinstall.config.ts`, it defaults to version `2.36.0`.
    *   Verifies if `direnv` is already installed and at the correct version.
    *   If not installed or version mismatch, it triggers the installation or update of `direnv` itself using `handleGitBinaryInstallation`.
    *   Applies necessary `direnv` shell initializations (hooks) via `shellUpdater`.
5.  **Git Binary Installation**:
    *   Iterates through each `gitBinary` defined in the configuration.
    *   For each binary, it calls `handleGitBinaryInstallation` to manage its lifecycle.

#### `handleGitBinaryInstallation`

This internal function within `installer` manages the installation of a single Git binary:

*   **Version Check**: Uses `getBinaryVersion` and `isVersionCompatible` to determine if the required version is already installed. If compatible, it skips installation.
*   **Binary Download & Placement**: Calls `gitBinInstaller` to download the appropriate release from GitHub and place it in `targetBinPath` (`~/.local/bin`).
*   **State Recording**: Records the installation details (command, version, binary path, timestamp) in the state file using `stateManager.addInstallation`.
*   **Shell Update**: If `shellUpdate` data is provided in the `GitBinary` configuration, it applies the necessary shell modifications using `shellUpdater.add`.

### Uninstallation Flow (`uninstaller/index.ts`)

The `uninstaller` module handles the removal of previously installed binaries and configurations. It is triggered when the `--uninstall` flag is used.

1.  **Load State**: Loads the `EpicPostinstallState` from `.epic-postinstall-state.json` to get a list of installed items.
2.  **Iterate and Remove**: For each `InstallationRecord` in the state:
    *   **Shell Configuration Removal**: If `shellUpdate` data was recorded, it attempts to remove the corresponding shell configuration using `shellUpdater.remove`.
    *   **Binary File Removal**: If a `binaryPath` was recorded, it attempts to delete the binary file from the file system.
    *   **ASDF Home Directory Removal**: If the record is for `asdf` and an `asdfHome` path was recorded, it recursively removes the ASDF home directory.
3.  **State File Removal**: After attempting to uninstall all recorded items, it deletes the `.epic-postinstall-state.json` file itself.

### Binary Installation Details (`gitBinInstaller/index.ts`)

This module is responsible for the low-level details of fetching and installing binaries from GitHub.

*   **`getReleases/index.ts`**: Fetches release information (tags, assets) from the specified GitHub repository using the GitHub API.
*   **`selectReleaseUrl/selectReleaseUrl.ts`**: Analyzes the fetched releases and selects the most appropriate binary download URL based on the target operating system, architecture, and the desired version specified in the configuration. It prioritizes exact version matches and common archive formats.
*   **`binInstaller/binInstaller.ts`**: Downloads the selected binary archive, extracts its contents, and places the executable in the `targetBinPath` (`~/.local/bin`). It handles various archive types (e.g., `.tar.gz`, `.zip`).

### Shell Updates (`shellUpdater/index.ts` and `shellUpdater/types.ts`)

The `shellUpdater` module provides a standardized way to modify common shell configuration files.

*   **`ShellUpdaterData`**: Defines snippets to be added or removed for different shells (Bash, Zsh, Fish, Nushell, Elvish, PowerShell).
    *   `Posix` interface for Bash/Zsh/Sh allows specifying `loginShell` (for `~/.profile`, `~/.bash_profile`, `~/.zprofile`) or non-login shell files (`~/.bashrc`, `~/.zshrc`).
*   **`add` function**: Appends snippets to the relevant shell configuration files, ensuring idempotency (snippets are only added if not already present).
*   **`remove` function**: Removes previously added snippets from shell configuration files.

### State Management (`stateManager/index.ts` and `stateManager/types.ts`)

The `EpicPostinstallStateManager` class is central to tracking installations.

*   **State File**: Stores installation records in a JSON file named `.epic-postinstall-state.json` at the project root. This file is crucial for the uninstallation process.
*   **`InstallationRecord`**: Each record contains details about an installed binary, including:
    *   `cmd`: The command name.
    *   `version`: The installed version.
    *   `timestamp`: When it was installed.
    *   `binaryPath`: The full path to the installed executable.
    *   `asdfHome`: (If applicable) The ASDF home directory.
    *   `shellUpdateProgramName`: The identifier used for shell updates.
*   **`.gitignore` Integration**: Automatically adds `.epic-postinstall-state.json` to the project's `.gitignore` to prevent accidental commits.
*   **Methods**:
    *   `loadState()`: Reads the state file, or returns an empty state if not found.
    *   `saveState()`: Writes the current state to the file.
    *   `addInstallation()`: Adds or updates an installation record.
    *   `removeInstallation()`: Removes an installation record.
    *   `ensureGitignoreEntry()`: Manages the `.gitignore` entry.

### Helper Functions

*   **`helpers/isCommandAvailable/index.ts`**: Checks if a command exists in the system's PATH and attempts to retrieve its version using `--version` or `-v`.
*   **`helpers/typeGuards.ts`**: Provides a type guard (`isNodeJS_ErrnoException`) to safely handle Node.js system errors (e.g., file not found).
*   **`helpers/findProjectRoot/index.ts`**: Recursively searches parent directories for a `package.json` file to identify the project's root.
*   **`helpers/getBinaryVersion/index.ts`**: (Imported by `gitBinInstaller/index.ts`) Extracts a clean version string from command output.
*   **`helpers/versionUtils/index.ts`**: (Imported by `gitBinInstaller/index.ts`) Provides utility functions for comparing and checking compatibility between version strings.
*   **`clients/githubApiClient.ts`**: (Imported by `gitBinInstaller/getReleases/index.ts`) Handles authenticated and unauthenticated requests to the GitHub API for fetching release data.
*   **`scripts/direnv_hook_setup.sh`**: (Not directly part of the core TS logic, but related to shell integration) A shell script that might be used for setting up `direnv` hooks, potentially as part of a `postInstallScript` or similar custom script execution.

## Error Handling

The package incorporates robust error handling using `try-catch` blocks and the `logger` module to provide informative messages. Critical errors lead to `process.exit(1)`, while warnings allow the script to continue with potential manual intervention required.

## Future Enhancements

Based on the `EpicPostinstallConfig` interface, future enhancements could include:

*   Full implementation of `python` virtual environment management, including Python version installation, virtual environment creation, and package installation from `requirements.txt` or a list of packages.
*   Execution of custom `scripts` defined in the configuration, allowing for more flexible post-installation tasks.

---
For user-facing information, usage examples, and installation instructions, please refer to the main [`README.md`](../../packages/epic-postinstall/README.md) file.