#!/bin/bash
set -x # Enable debug tracing

# ASCII Art for script start
cat << "EOF" | while read -r line; do echo -e "$line"; done
\033[34m ______  ______  ______  ______  ______  ______  ______  ______  ______  ______ \033[0m
\033[34m| |__| || |__| || |__| || |__| || |__| || |__| || |__| || |__| || |__| || |__| |\033[0m
\033[34m|  ()  ||  ()  ||  ()  ||  ()  ||  ()  ||  ()  ||  ()  ||  ()  ||  ()  ||  ()  |\033[0m
\033[34m|______||______||______||______||______||______||______||______||______||______|\033[0m
\033[34m ______                                                                  ______ \033[0m
\033[34m| |__| |\033[0m\e[33m           .___________. __    __   __       _______.           \033[34m| |__| |\033[0m
\033[34m|  ()  |\033[0m\e[33m           |           ||  |  |  | |  |     /       |           \033[34m|  ()  |\033[0m
\033[34m|______|\033[0m\e[33m           `---|  |----`|  |__|  | |  |    |   (----`           \033[34m|______| \033[0m
\033[34m ______ \033[0m\e[33m               |  |     |   __   | |  |     \   \               \033[34m ______ \033[0m
\033[34m| |__| |\033[0m\e[33m               |  |     |  |  |  | |  | .----)   |              \033[34m| |__| |\033[0m
\033[34m|  ()  |\033[0m\e[33m               |__|     |__|  |__| |__| |_______/               \033[34m|  ()  |\033[0m
\033[34m|______|\033[0m\e[33m                        __       _______.                       \033[34m|______| \033[0m
\033[34m ______ \033[0m\e[33m                       |  |     /       |                       \033[34m ______ \033[0m
\033[34m| |__| |\033[0m\e[33m                       |  |    |   (----`                       \033[34m| |__| |\033[0m
\033[34m|  ()  |\033[0m\e[33m                       |  |     \   \                           \033[34m|  ()  |\033[0m
\033[34m|______|\033[0m\e[33m                       |  | .----)   |                          \033[34m|______| \033[0m
\033[34m ______ \033[0m\e[33m                       |__| |_______/                           \033[34m ______ \033[0m
\033[34m| |__| |\033[0m\e[33m  _______   _______ ____    ____  ______   .______     _______. \033[34m| |__| |\033[0m
\033[34m|  ()  |\033[0m\e[33m |       \ |   ____|\   \  /   / /  __  \  |   _  \   /       | \033[34m|  ()  |\033[0m
\033[34m|______|\033[0m\e[33m |  .--.  ||  |__    \   \/   / |  |  |  | |  |_)  | |   (----` \033[34m|______| \033[0m
\033[34m ______ \033[0m\e[33m |  |  |  ||   __|    \      /  |  |  |  | |   ___/   \   \     \033[34m ______ \033[0m
\033[34m| |__| |\033[0m\e[33m |  '--'  ||  |____    \    /   |  `--'  | |  |   .----)   |    \033[34m| |__| |\033[0m
\033[34m|  ()  |\033[0m\e[33m |_______/ |_______|    \__/     \______/  | _|   |_______/     \033[34m|  ()  |\033[0m
\033[34m|______|\033[0m\e[33m                                                                \033[34m|______| \033[0m
\033[34m ______  ______  ______  ______  ______  ______  ______  ______  ______  ______ \033[0m
\033[34m| |__| || |__| || |__| || |__| || |__| || |__| || |__| || |__| || |__| || |__| |\033[0m
\033[34m|  ()  ||  ()  ||  ()  ||  ()  ||  ()  ||  ()  ||  ()  ||  ()  ||  ()  ||  ()  |\033[0m
\033[34m|______||______||______||______||______||______||______||______||______||______|\033[0m
EOF
echo ""
echo -e "\e[33m--- postinstall Dependency Management Script ---\e[0m"
echo ""

# This script manages project-specific dependencies, including non-npm ones,
# as part of the pnpm install process. It is designed to be executed as a
# `postinstall` hook in a project's `package.json`.
#
# Dependency Organization:
# - All project-specific dependencies (npm, Python, system binaries, etc.)
#   should be managed by this script.
# - The script should be named `install.sh` and placed in the project's root.
# - It should be invoked via the `postinstall` script in `package.json`.
# - For binaries, mandatory installation to `~/.local/bin`.
# - The script supports an uninstall mode triggered by `-u` or `--uninstall` flag.
# - When installing binaries, check for existing versions and upgrade if newer,
#   or skip if the same or newer version is already present. Provide clear feedback.

# --- Configuration: Define versions and paths here ---
ENABLE_PYTHON=false # Set to 'true' to enable Python virtual environment and dependency setup
PYTHON_VERSION="3.12" 


# Binaries to install

# Global array to store the names of all binary associative arrays
declare -ga ALL_BINARIES=()

# Helper function to define and register a binary
# Usage: define_binary CMD_NAME "brew_name" "version" "linux_x64_url" 
define_binary() {
    local cmd_name="$1"
    local brew_name="$2"
    local version="$3"
    local linux_x64_url="$4"
    

    local array_name="binary_${cmd_name//-/_}" # Create a unique, valid variable name
    declare -gA "$array_name" # Declare as global associative array

    # Populate the associative array
    eval "${array_name}[CMD_NAME]=\"\$cmd_name\""
    eval "${array_name}[brew_name]=\"\$brew_name\""
    eval "${array_name}[version]=\"\$version\""
    eval "${array_name}[linux_x64_url]=\"\$linux_x64_url\""
    

    # Add the name of this new associative array to our global list
    ALL_BINARIES+=("$array_name")
}

# --- Define your binaries using the helper function ---
# define_binary \
#     "actionlint" \ CMD_NAME is the name of the binary to be installed
#     "actionlint" \ brew_name is the name of the binary in brew
#     "1.7.7" \ version is the version of the binary to be installed
#     "https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_linux_amd64.tar.gz" the URL to download the binary for linux x64

define_binary \
    "actionlint" \
    "actionlint" \
    "1.7.7" \
    "https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_linux_amd64.tar.gz" \
    
define_binary \
    "shellcheck" \
    "shellcheck" \
    "0.10.0" \
    "https://github.com/koalaman/shellcheck/releases/download/v0.10.0/shellcheck-v0.10.0.linux.x86_64.tar.xz" \
 





## Reusable function to install binaries.
## for linux downloads and installs the binary to ~/.local/bin
## For mac uses brew got install binary.
## If the binary is already installed and the version is the same or newer, it skips installation. Else upgrade it
## echos in blue before installation in green after installation success and red on failure.
install_binary() {
    local cmd_name="$1" # CMD_NAME
    local version="$2" # version
    local url="$3" # linux_x64_url
    local binary_array_name="$4" # Name of the associative array (e.g., "binary_actionlint")

    echo -e "\033[34m--- Installing $cmd_name (Version: $version, URL: $url) ---\033[0m"

    # Check if the command is already installed
    if command -v "$cmd_name" &> /dev/null; then
        local current_version
        current_version=$("$cmd_name" --version 2>/dev/null || echo "unknown")
        echo -e "\033[33m$current_version is already installed.\033[0m"
# Compare versions (assuming version format is compatible, using a more robust check)
# This simple check assumes version strings are comparable lexicographically or by substring.
# For more complex version comparisons (e.g., 1.7.7 vs 1.7.10), a dedicated version comparison tool might be needed.
if printf '%s\n' "$version" "$current_version" | sort -V -C &>/dev/null; then
    echo -e "\033[32m$cmd_name is up to date (current: $current_version, target: $version).\033[0m"
    return 0
else
    echo -e "\033[33mUpdating $cmd_name from $current_version to $version...\033[0m"
fi
fi # End of 'if command -v' block

# Install the binary

    # Install the binary
    if [[ "$(uname)" == "Linux" ]]; then
        mkdir -p ~/.local/bin
        local tar_flags=""
        if [[ "$url" == *.tar.gz ]]; then
            tar_flags="-xzf"
        elif [[ "$url" == *.tar.xz ]]; then
            tar_flags="-Jxf"
        else
            echo -e "\033[31mError: Unsupported archive format for $cmd_name: $url.\033[0m"
            return 1
        fi
        curl -L "$url" | tar "$tar_flags" - -C ~/.local/bin --strip-components=1 || { echo -e "\033[31mError: Failed to install $cmd_name.\033[0m"; return 1; }
    elif [[ "$(uname)" == "Darwin" ]]; then
        if ! command -v brew &> /dev/null; then
            echo -e "\033[31mError: Homebrew is not installed. Please install Homebrew first.\033[0m"
            return 1
        fi
        local brew_name_val
        eval "brew_name_val=\${${binary_array_name}[brew_name]}" # Access brew_name from the associative array using eval
        if [ -n "$brew_name_val" ]; then
            brew install "$brew_name_val" || { echo -e "\033[31mError: Failed to install $cmd_name via Homebrew.\033[0m"; return 1; }
        else
            brew install "$cmd_name" || { echo -e "\033[31mError: Failed to install $cmd_name via Homebrew.\033[0m"; return 1; }
        fi
    else
        echo -e "\033[31mUnsupported OS for $cmd_name installation.\033[0m"
        return 1
    fi

    echo -e "\033[32m$cmd_name installed successfully.\033[0m"
}



## Uninstall function to remove binaries
uninstall_binary() {
    local cmd_name="$1"

    echo -e "\033[34m--- Uninstalling $cmd_name ---\033[0m"

    # Check if the command is installed
    if command -v "$cmd_name" &> /dev/null; then
        if [[ "$(uname)" == "Linux" ]]; then
            rm -f ~/.local/bin/"$cmd_name"
        elif [[ "$(uname)" == "Darwin" ]]; then
            brew uninstall "$cmd_name" || { echo -e "\033[31mError: Failed to uninstall $cmd_name via Homebrew.\033[0m"; return 1; }
        else
            echo -e "\033[31mUnsupported OS for $cmd_name uninstallation.\033[0m"
            return 1
        fi
        echo -e "\033[32m$cmd_name uninstalled successfully.\033[0m"
    else
        echo -e "\033[33m$cmd_name is not installed, nothing to uninstall.\033[0m"
    fi
}
# --- Main Script Logic ---
# Check for uninstall mode
if [[ "$1" == "-u" || "$1" == "--uninstall" ]]; then
    echo -e "\x1b[1;34m--- Uninstall mode activated. Removing all installed binaries... ---\x1b[0m"
    for binary_name_ref in "${ALL_BINARIES[@]}"; do
        eval "declare -gA $binary_name_ref" # Re-declare to ensure scope
        uninstall_binary "${!binary_name_ref[CMD_NAME]}"
    done
    echo "--- Uninstallation complete ---"
    exit 0
fi
# Normal installation mode
echo -e "\x1b[1;34m--- Installing project dependencies... ---\x1b[0m"

# Loop through all defined binaries and install them
for binary_array_name in "${ALL_BINARIES[@]}"; do
    eval "declare -gA $binary_array_name" # Re-declare to ensure scope
    eval "cmd_name_val=\${${binary_array_name}[CMD_NAME]}"
    eval "version_val=\${${binary_array_name}[version]}"
    eval "url_val=\${${binary_array_name}[linux_x64_url]}"
    install_binary "$cmd_name_val" "$version_val" "$url_val" "$binary_array_name"
done











#Python installation


# Example: Python Virtual Environment and Dependencies
if [ "$ENABLE_PYTHON" = true ]; then
  echo "Setting up Python virtual environment..."
  if [ ! -d ".venv" ]; then
    echo "  - Creating Python virtual environment in ./.venv"
    python${PYTHON_VERSION%.*} -m venv .venv || python3 -m venv .venv || { echo "Error: Python venv creation failed. Ensure Python is installed."; exit 1; }
    echo "  - Virtual environment created."
  else
    echo "  - Virtual environment already exists."
  fi

  echo "  - Activating virtual environment and installing Python dependencies..."
  source .venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt || { echo "Error: Failed to install Python dependencies from requirements.txt"; exit 1; }
  deactivate
  echo "  - Python dependencies installed."
else
  echo "Skipping Python virtual environment setup (ENABLE_PYTHON is false)."
fi

# Final message
echo "--- Installation complete ---"