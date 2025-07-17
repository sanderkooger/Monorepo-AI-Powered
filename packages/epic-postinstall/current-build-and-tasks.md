# Current Build and Open Tasks

## Current Build Overview

This document outlines the current state of the `epic-postinstall` package and its functionalities, along with the planned open tasks for future development.

### `epic-postinstall` Package

The `epic-postinstall` package is designed to automate post-installation configuration and gather system information. Its primary functions include:

*   **Configuration Loading:** It loads configuration settings from `epicpostinstall.config.ts`.
*   **System Information Detection:** It detects and displays relevant system information.
*   **Uninstall Capability:** It supports an `--uninstall` flag to handle uninstallation procedures.

### New Features: Logging Flags

Recently, the following logging flags have been added to enhance debugging and verbosity:

*   `--verbose`: When this flag is present, the script will output more detailed information to the console, including the full system information and configuration details.
*   `--debug`: When this flag is present, the script will output debug-level messages to the console, providing insights into the execution flow. This flag also enables verbose output.

## Open Tasks

The following tasks are planned for future development:

1.  **Build function to generate download URL from GitHub link and system information:**
    *   Develop a module that can construct a direct download URL for binaries based on a given GitHub repository link and detected system architecture (OS, CPU type). This will enable the `epic-postinstall` script to fetch the correct binary for the user's environment.

2.  **Create installer that installs the binaries:**
    *   Implement an installer mechanism within the `epic-postinstall` package. This installer will be responsible for downloading the appropriate binaries (using the function from task 1) and placing them in the correct system paths, ensuring they are executable. This task will involve platform-specific considerations for installation.

3.  **Print outputs etc.:**
    *   Refine and expand the output mechanisms of the script. This includes:
        *   Standardizing log messages.
        *   Providing clear success/failure indicators.
        *   Implementing progress reporting for long-running operations (e.g., downloads, installations).
        *   Ensuring user-friendly messages for all interactions.