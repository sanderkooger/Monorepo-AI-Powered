import { EpicPostinstallConfig, GitBinary } from '@helpers/getConfig/index.js'
import { SystemInfo } from '@helpers/getSystemInfo/index.js'
import logger from '@src/logger/index.js'
import shellUpdater, { ShellUpdaterOptions } from '@src/shellUpdater/index.js'
import runInstaller from '@src/gitBinInstaller/index.js'
import isCommandAvailable from '@helpers/isCommandAvailable/index.js'
import { findProjectRoot } from '@helpers/findProjectRoot/index.js';
import { EpicPostinstallStateManager } from '@src/stateManager/index.js';
import { InstallationRecord } from '@src/stateManager/types.js';
import path from 'node:path'


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
  const installedBinaryPath = await runInstaller({
    systemInfo,
    gitBinary,
    targetBinPath
  });

  const installationRecord: InstallationRecord = {
    ...gitBinary,
    timestamp: new Date().toISOString(),
    binaryPath: installedBinaryPath,
  };

  if (gitBinary.cmd === 'asdf') {
    installationRecord.asdfHome = path.join(systemInfo.homeDir, '.asdf');
  }

  await stateManager.addInstallation(installationRecord);
if (gitBinary.shellUpdate) {
  const shellUpdateProgramName = `${gitBinary.cmd}`; // Unique identifier for this binary's shell update
  const binaryShellUpdateOptions: ShellUpdaterOptions = {
    programName: shellUpdateProgramName,
    systemInfo: systemInfo,
    shellUpdaterData: gitBinary.shellUpdate
  };
  const shellUpdateApplied = await shellUpdater.add(binaryShellUpdateOptions);
  if (!shellUpdateApplied) {
    logger.warn(`Failed to apply shell updates for ${gitBinary.cmd}. Please configure your shell manually.`);
  } else {
    logger.debug(`Shell updates applied for ${gitBinary.cmd}.`);
    installationRecord.shellUpdateProgramName = shellUpdateProgramName; // Store the programName
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
    programName: 'epic-postinstall-bin-path', // A unique identifier for this specific PATH update
    systemInfo: systemInfo,
    shellUpdaterData: {
      bash: { loginShell: false, snippets: [pathExportLine] }, // Target .bashrc
      zsh: { loginShell: false, snippets: [pathExportLine] }, // Target .zshrc
      sh: { loginShell: true, snippets: [pathExportLine] }, // Target .profile
      fish: [`set -gx PATH "${targetBinPath}" $PATH`], // Fish-specific PATH update
      nushell: `let target_bin_path = "${targetBinPath}"\n$env.PATH = ( $env.PATH | split row (char esep) | where { |p| $p != $target_bin_path } | prepend $target_bin_path )`.split('\n'),
      elvish: `var target_bin_path = "${targetBinPath}"\nif (not (has-value $paths $target_bin_path)) {\n  set paths = [$target_bin_path $@paths]\n}`.split('\n')
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

  logger.info('\nChecking ASDF installation...')
  const asdfCommand = 'asdf'
  const defaultAsdfVersion = '0.18.0' // Default ASDF version
  const asdfConfig = config?.asdf || { version: defaultAsdfVersion } // Use default if config is absent

  const { available: asdfAvailable, version: installedAsdfVersion } =
    isCommandAvailable(asdfCommand)

  const asdfGitBinary: GitBinary = {
    cmd: asdfCommand,
    version: asdfConfig.version || defaultAsdfVersion, // Use configured version or default
    githubRepo: 'https://github.com/asdf-vm/asdf',
    shellUpdate: {
      bash: {
        loginShell: true, // Targeting ~/.bash_profile for shims and completions
        snippets: ["export PATH=\"${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH\"",
                  ". <(asdf completion bash)"]
      },
      zsh: {
        loginShell: false, // Targeting ~/.zshrc for shims and completions
        snippets: ["export PATH=\"${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH\"",
                  ". <(asdf completion bash)"]
      },
      sh: {
        loginShell: true, // Targeting ~/.profile for shims
        snippets: ["export PATH=\"${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH\"",
                  ". <(asdf completion bash)"]
      },
      nushell: `let shims_dir = (\n  if ( $env | get --ignore-errors ASDF_DATA_DIR | is-empty ) {\n    $env.HOME | path join '.asdf'\n  } else {\n    $env.ASDF_DATA_DIR\n  } | path join 'shims'\n)\n$env.PATH = ( $env.PATH | split row (char esep) | where { |p| $p != $shims_dir } | prepend $shims_dir )\n\n# ASDF completions for nushell (requires manual generation of ~/.asdf/completions/nushell.nu)\nlet asdf_data_dir = (\n  if ( $env | get --ignore-errors ASDF_DATA_DIR | is-empty ) {\n    $env.HOME | path join '.asdf'\n  } else {\n    $env.ASDF_DATA_DIR\n  }\n)\n. "$asdf_data_dir/completions/nushell.nu"`.split('\n'),
      elvish: `var asdf_data_dir = ~'/.asdf'\nif (and (has-env ASDF_DATA_DIR) (!=s $E:ASDF_DATA_DIR '')) {\n  set asdf_data_dir = $E:ASDF_DATA_DIR\n}\n\nif (not (has-value $paths $asdf_data_dir'/shims')) {\n  set paths = [$path $@paths]\n}\n\n# ASDF completions for elvish (requires manual generation and appending to rc.elv)\n# The guide suggests: asdf completion elvish >> ~/.config/elvish/rc.elv\n# and then: echo "\\n"'set edit:completion:arg-completer[asdf] = $_asdf:arg-completer~' >> ~/.config/elvish/rc.elv\n# For now, we'll assume the user handles the generation and direct sourcing is not needed here.\n# If a snippet is needed to source a generated file, it would be similar to fish/nushell.\n# For now, leaving it as just the shims and a comment about completions.`.split('\n'),
      fish: `# ASDF configuration code\nif test -z $ASDF_DATA_DIR\n    set _asdf_shims "$HOME/.asdf/shims"\nelse\n    set _asdf_shims "$ASDF_DATA_DIR/shims"\nend\n\n# Do not use fish_add_path (added in Fish 3.2) because it\n# potentially changes the order of items in PATH\nif not contains $_asdf_shims $PATH\n    set -gx --prepend PATH $_asdf_shims\nend\nset --erase _asdf_shims\n\n# ASDF completions for fish (requires manual generation of ~/.config/fish/completions/asdf.fish)\nif status is-interactive\n    if test -f "$ASDF_DATA_DIR/completions/asdf.fish"\n        source "$ASDF_DATA_DIR/completions/asdf.fish"\n    else if test -f "$HOME/.asdf/completions/asdf.fish"\n        source "$HOME/.asdf/completions/asdf.fish"\n    end\nend`.split('\n')
    }
  }

  // Apply ASDF shell updates unconditionally
  if (asdfGitBinary.shellUpdate) {
    const asdfShellUpdateOptions: ShellUpdaterOptions = {
      programName: `${asdfCommand}`, // Unique identifier for ASDF shell update
      systemInfo: systemInfo,
      shellUpdaterData: asdfGitBinary.shellUpdate
    };
    const asdfShellUpdateApplied = await shellUpdater.add(asdfShellUpdateOptions);
    if (!asdfShellUpdateApplied) {
      logger.warn(`Failed to apply ASDF shell updates. Please configure your shell manually.`);
    } else {
      logger.debug(`ASDF shell updates applied.`);
    }
  }

  if (asdfAvailable) {
    const cleanedInstalledVersion =
      installedAsdfVersion?.match(/(\d+\.\d+\.\d+)/)?.[1]
    if (
      cleanedInstalledVersion &&
      cleanedInstalledVersion === asdfGitBinary.version
    ) {
      logger.success(
        `ASDF is installed and at the correct version: ${installedAsdfVersion}`
      )
    } else {
      logger.warn(
        `ASDF is installed but version mismatch detected. Installed: ${installedAsdfVersion || 'N/A'}, Configured: ${asdfGitBinary.version}. Attempting to update...`
      )
      await handleGitBinaryInstallation(asdfGitBinary, systemInfo, targetBinPath, stateManager);
    }
  } else {
    logger.info('ASDF is not installed. Attempting to install...')
    await handleGitBinaryInstallation(asdfGitBinary, systemInfo, targetBinPath, stateManager);
  }

  /*
   * =========================================
   *           DIRENV INSTALLATION LOGIC
   * =========================================
   */

  logger.info('\nChecking direnv installation...')
  const direnvCommand = 'direnv'
  const defaultDirenvVersion = '2.36.0' // Default direnv version
  const direnvConfig = config?.direnv || { version: defaultDirenvVersion } // Use default if config is absent

  const { available: direnvAvailable, version: installedDirenvVersion } =
    isCommandAvailable(direnvCommand)

  const direnvGitBinary: GitBinary = {
    cmd: direnvCommand,
    version: direnvConfig.version || defaultDirenvVersion, // Use configured version or default
    githubRepo: 'https://github.com/direnv/direnv',
    shellUpdate: {
      bash: {
        
        snippets: ['eval "$(direnv hook bash)"']
      },
      zsh: {
        
        snippets: ['eval "$(direnv hook zsh)"']
      },
      fish: ['direnv hook fish | source'],
      nushell: `mkdir -p ~/.config/nushell/completions\ndirenv hook nu > ~/.config/nushell/completions/direnv.nu\n`.split('\n'),
      elvish: `eval (direnv hook elvish)`.split('\n')
    }
  }

  // Apply direnv shell updates unconditionally
  if (direnvGitBinary.shellUpdate) {
    const direnvShellUpdateOptions: ShellUpdaterOptions = {
      programName: `${direnvCommand}`, // Unique identifier for direnv shell update
      systemInfo: systemInfo,
      shellUpdaterData: direnvGitBinary.shellUpdate
    };
    const direnvShellUpdateApplied = await shellUpdater.add(direnvShellUpdateOptions);
    if (!direnvShellUpdateApplied) {
      logger.warn(`Failed to apply direnv shell updates. Please configure your shell manually.`);
    } else {
      logger.debug(`direnv shell updates applied.`);
    }
  }

  if (direnvAvailable) {
    const cleanedInstalledVersion =
      installedDirenvVersion?.match(/(\d+\.\d+\.\d+)/)?.[1]
    if (
      cleanedInstalledVersion &&
      cleanedInstalledVersion === direnvGitBinary.version
    ) {
      logger.success(
        `direnv is installed and at the correct version: ${installedDirenvVersion}`
      )
    } else {
      logger.warn(
        `direnv is installed but version mismatch detected. Installed: ${installedDirenvVersion || 'N/A'}, Configured: ${direnvGitBinary.version}. Attempting to update...`
      )
      await handleGitBinaryInstallation(direnvGitBinary, systemInfo, targetBinPath, stateManager);
    }
  } else {
    logger.info('direnv is not installed. Attempting to install...')
    await handleGitBinaryInstallation(direnvGitBinary, systemInfo, targetBinPath, stateManager);
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
