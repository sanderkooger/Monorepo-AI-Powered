#!/bin/bash
set -euo pipefail # Exit on error, unset variables, and pipeline errors

# This script sets up direnv hooks for various shells.

# Function to add direnv hook if shell is detected
add_direnv_hook() {
  local shell_name="${1}"
  local rc_file="${2}"
  local hook_command="${3}"

  if command -v "${shell_name}" &> /dev/null; then
    if ! grep -qF "${hook_command}" "${rc_file}"; then # Use -F for fixed string search
      echo "" >> "${rc_file}" || { echo "Error: Could not write to ${rc_file}" >&2; return 1; }
      echo "# Added by epic-postinstall for direnv" >> "${rc_file}" || { echo "Error: Could not write to ${rc_file}" >&2; return 1; }
      echo "${hook_command}" >> "${rc_file}" || { echo "Error: Could not write to ${rc_file}" >&2; return 1; }
      echo "direnv hook added to ${rc_file}"
    else
      echo "direnv hook already exists in ${rc_file}"
    fi
  else
    echo "${shell_name} not found. Skipping direnv hook setup for ${shell_name}." # Output to stdout for informational messages
  fi
  return 0
}

echo "Setting up direnv hooks..."

# Bash
BASH_HOOK_COMMAND="eval \"\$(direnv hook bash)\""
add_direnv_hook "bash" "${HOME}/.bashrc" "${BASH_HOOK_COMMAND}"

# Zsh
ZSH_HOOK_COMMAND="eval \"\$(direnv hook zsh)\""
add_direnv_hook "zsh" "${HOME}/.zshrc" "${ZSH_HOOK_COMMAND}"

# Fish
FISH_HOOK_COMMAND="direnv hook fish | source"
add_direnv_hook "fish" "${HOME}/.config/fish/config.fish" "${FISH_HOOK_COMMAND}"

# Tcsh
TCSH_HOOK_COMMAND="eval \`direnv hook tcsh\`"
add_direnv_hook "tcsh" "${HOME}/.cshrc" "${TCSH_HOOK_COMMAND}"

# Elvish (requires manual step for direnv.elv file, this just adds the 'use direnv' line)
# Assuming direnv.elv is already generated or will be manually.
# The direnv documentation suggests:
# ~> mkdir -p ~/.config/elvish/lib
# ~> direnv hook elvish > ~/.config/elvish/lib/direnv.elv
# And then add 'use direnv' to rc.elv
if command -v "elvish" &> /dev/null; then
  ELVISH_RC_FILE="${HOME}/.config/elvish/rc.elv"
  ELVISH_LIB_DIR="${HOME}/.config/elvish/lib"
  ELVISH_DIRENV_FILE="${ELVISH_LIB_DIR}/direnv.elv"

  mkdir -p "${ELVISH_LIB_DIR}" || { echo "Error: Could not create directory ${ELVISH_LIB_DIR}" >&2; exit 1; }
  if ! grep -qF 'use direnv' "${ELVISH_RC_FILE}"; then # Use -F for fixed string search
    echo "" >> "${ELVISH_RC_FILE}" || { echo "Error: Could not write to ${ELVISH_RC_FILE}" >&2; exit 1; }
    echo "# Added by epic-postinstall for direnv" >> "${ELVISH_RC_FILE}" || { echo "Error: Could not write to ${ELVISH_RC_FILE}" >&2; exit 1; }
    echo "use direnv" >> "${ELVISH_RC_FILE}" || { echo "Error: Could not write to ${ELVISH_RC_FILE}" >&2; exit 1; }
    echo "direnv hook 'use direnv' added to ${ELVISH_RC_FILE}"
  else
    echo "direnv hook 'use direnv' already exists in ${ELVISH_RC_FILE}"
  fi

  if [[ ! -f "${ELVISH_DIRENV_FILE}" ]]; then
    echo "Generating direnv.elv for Elvish..."
    direnv hook elvish > "${ELVISH_DIRENV_FILE}" || { echo "Error: Could not generate direnv.elv" >&2; exit 1; }
    echo "direnv.elv generated at ${ELVISH_DIRENV_FILE}"
  else
    echo "direnv.elv already exists at ${ELVISH_DIRENV_FILE}"
  fi
else
  echo "elvish not found. Skipping direnv hook setup for elvish." # Output to stdout for informational messages
fi

# PowerShell (pwsh)
# Note: PowerShell profiles can be in multiple locations depending on OS and setup.
# We attempt common paths.
PWSH_HOOK_COMMAND="Invoke-Expression \"\$(direnv hook pwsh)\""
add_direnv_hook "pwsh" "${HOME}/.config/powershell/profile.ps1" "${PWSH_HOOK_COMMAND}"
add_direnv_hook "pwsh" "${HOME}/Documents/PowerShell/profile.ps1" "${PWSH_HOOK_COMMAND}" # Common Windows path

echo "Direnv hook setup complete. Please restart your shell for changes to take effect."