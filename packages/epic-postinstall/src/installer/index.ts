import { EpicPostinstallConfig, GitBinary } from '@helpers/getConfig/index.js'
import { SystemInfo } from '@helpers/getSystemInfo/index.js'
import logger from '@src/logger/index.js'
import shellUpdater, { ShellUpdaterOptions } from '@src/shellUpdater/index.js'
import runInstaller from '@src/gitBinInstaller/index.js'
import isCommandAvailable from '@helpers/isCommandAvailable/index.js'
import { findProjectRoot } from '@helpers/findProjectRoot/index.js';
import { EpicPostinstallStateManager } from '@src/stateManager/index.js';

/**
 * Handles the installation of a single Git binary, including running the installer,
 * recording the installation, and applying any necessary shell updates.
 */
async function handleGitBinaryInstallation(
  gitBinary: GitBinary,
  systemInfo: SystemInfo,
  targetBinPath: string,
  stateManager: EpicPostinstallStateManager
): Promise<void> {
  logger.info(`Attempting to install: ${gitBinary.cmd}`);
  await runInstaller({
    systemInfo,
    gitBinary,
    targetBinPath
  });
  await stateManager.addInstallation({ ...gitBinary, timestamp: new Date().toISOString() });

  if (gitBinary.shellUpdate) {
    const binaryShellUpdateOptions: ShellUpdaterOptions = {
      programName: `${gitBinary.cmd}-shell-update`, // Unique identifier for this binary's shell update
      systemInfo: systemInfo,
      shellUpdaterData: gitBinary.shellUpdate
    };
    const shellUpdateApplied = await shellUpdater.add(binaryShellUpdateOptions);
    if (!shellUpdateApplied) {
      logger.warn(`Failed to apply shell updates for ${gitBinary.cmd}. Please configure your shell manually.`);
    } else {
      logger.debug(`Shell updates applied for ${gitBinary.cmd}.`);
    }
  }
}

interface InstallerOptions {
  config: EpicPostinstallConfig | null
  systemInfo: SystemInfo
  targetBinPath: string
}

export const installBinaries = async ({
  config,
  systemInfo,
  targetBinPath
}: InstallerOptions) => {
  const projectRoot = await findProjectRoot(process.cwd());
  if (!projectRoot) {
    logger.error('Could not determine project root. Aborting installation.');
    return;
  }

  const stateManager = new EpicPostinstallStateManager(projectRoot);
  await stateManager.ensureGitignoreEntry();

  // Ensure ~/.local/bin is in PATH for Linux/macOS
  const pathExportLine = `export PATH="${targetBinPath}:$PATH"`
  const shellUpdateOptions: ShellUpdaterOptions = {
    programName: 'epic-postinstall-path-installation', // A unique identifier for this specific PATH update
    systemInfo: systemInfo,
    shellUpdaterData: {
      bash: { loginShell: false, snippet: pathExportLine }, // Target .bashrc
      zsh: { loginShell: false, snippet: pathExportLine }, // Target .zshrc
      sh: { loginShell: true, snippet: pathExportLine }, // Target .profile
      fish: `set -gx PATH "${targetBinPath}" $PATH`, // Fish-specific PATH update
      nushell: `let target_bin_path = "${targetBinPath}"\\n$env.PATH = ( $env.PATH | split row (char esep) | where { |p| $p != $target_bin_path } | prepend $target_bin_path )`,
      elvish: `var target_bin_path = "${targetBinPath}"\\nif (not (has-value $paths $target_bin_path)) {\\n  set paths = [$target_bin_path $@paths]\\n}`
    }
  }
  const pathEnsured = await shellUpdater.add(shellUpdateOptions)
  if (!pathEnsured) {
    logger.error(
      `Failed to ensure '${targetBinPath}' is in PATH. Installation may not function correctly. Please add it manually.`
    )
    // Decide whether to exit or continue with a warning
    // For now, we'll continue but log an error.
  }

  /*
   * =========================================
   *           ASDF INSTALLATION LOGIC
   * =========================================
   */

  if (config?.asdf) {
    logger.info('\nChecking ASDF installation...')
    const asdfConfig = config.asdf
    const asdfCommand = 'asdf'
    const { available: asdfAvailable, version: installedAsdfVersion } =
      isCommandAvailable(asdfCommand)

    const adfGitBinary: GitBinary = {
      cmd: asdfCommand,
      version: asdfConfig.version,
      githubRepo: 'https://github.com/asdf-vm/asdf',
      shellUpdate: {
        bash: {
          loginShell: true, // Targeting ~/.bash_profile for shims and completions
          snippet: ["export PATH=\"${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH\"",
                    ". <(asdf completion bash)"]
                    
        },
        zsh: {
          loginShell: false, // Targeting ~/.zshrc for shims and completions
          snippet: ["export PATH=\"${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH\"",
                    ". <(asdf completion bash)"]
        },
        sh: {
          loginShell: true, // Targeting ~/.profile for shims
          snippet: ["export PATH=\"${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH\"",
                    ". <(asdf completion bash)"]
        },
        nushell: "let shims_dir = (\\n  if ( $env | get --ignore-errors ASDF_DATA_DIR | is-empty ) {\\n    $env.HOME | path join '.asdf'\\n  } else {\\n    $env.ASDF_DATA_DIR\\n  } | path join 'shims'\\n)\\n$env.PATH = ( $env.PATH | split row (char esep) | where { |p| $p != $shims_dir } | prepend $shims_dir )\\n\\n# ASDF completions for nushell (requires manual generation of ~/.asdf/completions/nushell.nu)\\nlet asdf_data_dir = (\\n  if ( $env | get --ignore-errors ASDF_DATA_DIR | is-empty ) {\\n    $env.HOME | path join '.asdf'\\n  } else {\\n    $env.ASDF_DATA_DIR\\n  }\\n)\\n. \"$asdf_data_dir/completions/nushell.nu\"",
        elvish: "var asdf_data_dir = ~'/.asdf'\\nif (and (has-env ASDF_DATA_DIR) (!=s $E:ASDF_DATA_DIR '')) {\\n  set asdf_data_dir = $E:ASDF_DATA_DIR\\n}\\n\\nif (not (has-value $paths $asdf_data_dir'/shims')) {\\n  set paths = [$path $@paths]\\n}\\n\\n# ASDF completions for elvish (requires manual generation and appending to rc.elv)\\n# The guide suggests: asdf completion elvish >> ~/.config/elvish/rc.elv\\n# and then: echo \"\\n\"'set edit:completion:arg-completer[asdf] = $_asdf:arg-completer~' >> ~/.config/elvish/rc.elv\\n# For now, we'll assume the user handles the generation and direct sourcing is not needed here.\\n# If a snippet is needed to source a generated file, it would be similar to fish/nushell.\\n# For now, leaving it as just the shims and a comment about completions.",
        fish: '# ASDF configuration code\\nif test -z $ASDF_DATA_DIR\\n    set _asdf_shims "$HOME/.asdf/shims"\\nelse\\n    set _asdf_shims "$ASDF_DATA_DIR/shims"\\nend\\n\\n# Do not use fish_add_path (added in Fish 3.2) because it\\n# potentially changes the order of items in PATH\\nif not contains $_asdf_shims $PATH\\n    set -gx --prepend PATH $_asdf_shims\\nend\\nset --erase _asdf_shims\\n\\n# ASDF completions for fish (requires manual generation of ~/.config/fish/completions/asdf.fish)\\nif status is-interactive\\n    if test -f "$ASDF_DATA_DIR/completions/asdf.fish"\\n        source "$ASDF_DATA_DIR/completions/asdf.fish"\\n    else if test -f "$HOME/.asdf/completions/asdf.fish"\\n        source "$HOME/.asdf/completions/asdf.fish"\\n    end\\nend'
      }
    }

    if (asdfAvailable) {
      const cleanedInstalledVersion =
        installedAsdfVersion?.match(/(\d+\.\d+\.\d+)/)?.[1]
      if (
        cleanedInstalledVersion &&
        cleanedInstalledVersion === asdfConfig.version
      ) {
        logger.success(
          `ASDF is installed and at the correct version: ${installedAsdfVersion}`
        )
      } else {
        logger.warn(
          `ASDF is installed but version mismatch detected. Installed: ${installedAsdfVersion || 'N/A'}, Configured: ${asdfConfig.version}. Attempting to update...`
        )
        await handleGitBinaryInstallation(adfGitBinary, systemInfo, targetBinPath, stateManager);
      }
    } else {
      logger.info('ASDF is not installed. Attempting to install...')
      await handleGitBinaryInstallation(
        {
          cmd: asdfCommand,
          version: asdfConfig.version,
          githubRepo: 'https://github.com/asdf-vm/asdf',
          shellUpdate: adfGitBinary.shellUpdate // Ensure shellUpdate is passed for initial install
        },
        systemInfo,
        targetBinPath,
        stateManager
      );
    }
  } else {
    logger.warn(
      'No ASDF section found in configuration. Skipping ASDF installation.'
    )
  }

  /*
   * =========================================
   *         INSTALL SEPERATE GIT BINARIES
   * =========================================
   */

  if (config?.gitBinaries) {
    const binaryNames = Object.keys(config.gitBinaries)
    if (binaryNames.length > 0) {
      for (const binaryName of binaryNames) {
        const gitBinary = config.gitBinaries[binaryName]
        await handleGitBinaryInstallation(gitBinary, systemInfo, targetBinPath, stateManager);
      }
    } else {
      logger.warn('No gitBinaries found in configuration to install.')
    }
  } else {
    logger.warn('No gitBinaries section found in configuration.')
  }
}
