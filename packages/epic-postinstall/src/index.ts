#!/usr/bin/env node

import * as os from 'node:os'
import * as path from 'node:path'
import getConfig from '@helpers/getConfig/index.js'
import getSystemInfo from '@helpers/getSystemInfo/index.js'
import logger, { LogLevel } from '@src/logger/index.js'
import shellUpdater, { ShellUpdaterOptions } from '@src/shellUpdater/index.js'
import runInstaller from '@src/gitBinInstaller/index.js'
import { uninstallBinaries } from '@src/uninstaller/index.js'
import isCommandAvailable from '@helpers/isCommandAvailable/index.js'

const run = async () => {
  const args = process.argv.slice(2)
  const isUninstall = args.includes('--uninstall')

  const isVerbose = args.includes('--verbose')
  const isDebug = args.includes('--debug')
  const targetBinPath = path.join(os.homedir(), '.local', 'bin')
  if (isDebug) {
    logger.setLogLevel(LogLevel.DEBUG)
  } else if (isVerbose) {
    logger.setLogLevel(LogLevel.VERBOSE)
  } else {
    logger.setLogLevel(LogLevel.INFO) // Default to INFO if no flags are set
  }


  const githubToken = process.env.GITHUB_TOKEN // Retrieve token from environment variable

  if (githubToken) {
    logger.info('GitHub token found in environment variables.')
  } else {
    logger.warn(
      'No GitHub token found in environment variables. Proceeding with unauthenticated requests.'
    )
  }

  try {
    
    logger.info('\nDetecting system information...')
    const systemInfo = getSystemInfo()

    if (systemInfo.os !== 'linux' && systemInfo.os !== 'macos') {
      logger.error(
        `Operating System '${systemInfo.os}' is not currently supported. This script is only compatible with Linux and macOS.`
      )
      process.exit(1)
    }

    const config = getConfig()
    logger.info(config?.message)
    


    

    // Ensure ~/.local/bin is in PATH for Linux/macOS
   const pathExportLine = `export PATH="${targetBinPath}:$PATH"`;
   const shellUpdateOptions: ShellUpdaterOptions = {
     programName: 'epic-postinstall-path', // A unique identifier for this specific PATH update
     systemInfo: systemInfo,
     shellUpdaterData: {
       bash: { loginShell: false, snippet: pathExportLine }, // Target .bashrc
       zsh: { loginShell: false, snippet: pathExportLine },  // Target .zshrc
       fish: `set -gx PATH "${targetBinPath}" $PATH`, // Fish-specific PATH update
     },
   };
   const pathEnsured = await shellUpdater.add(shellUpdateOptions);
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
     logger.info('\nChecking ASDF installation...');
     const asdfConfig = config.asdf;
     const asdfCommand = 'asdf';
     const { available: asdfAvailable, version: installedAsdfVersion } = isCommandAvailable(asdfCommand);

     if (asdfAvailable) {
       const cleanedInstalledVersion = installedAsdfVersion?.match(/(\d+\.\d+\.\d+)/)?.[1];
       if (cleanedInstalledVersion && cleanedInstalledVersion === asdfConfig.version) {
         logger.success(`ASDF is installed and at the correct version: ${installedAsdfVersion}`);
       } else {
         logger.warn(`ASDF is installed but version mismatch detected. Installed: ${installedAsdfVersion || 'N/A'}, Configured: ${asdfConfig.version}. Attempting to update...`);
         await runInstaller({
           systemInfo,
           gitBinary: {
             cmd: asdfCommand,
             version: asdfConfig.version,
             githubRepo: 'https://github.com/asdf-vm/asdf',
           },
           targetBinPath,
         });
       }
     } else {
       logger.info('ASDF is not installed. Attempting to install...');
       await runInstaller({
         systemInfo,
         gitBinary: {
           cmd: asdfCommand,
           version: asdfConfig.version,
           githubRepo: 'https://github.com/asdf-vm/asdf',
         },
         targetBinPath,
       });
     }
    } else {
      logger.warn('No ASDF section found in configuration. Skipping ASDF installation.')
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
          const gitBinary = config.gitBinaries[binaryName];
          logger.info(`Attempting to install: ${binaryName}`);
          // install binary
          await runInstaller({
            systemInfo,
            gitBinary,
            targetBinPath
          });
          // If gitBinary has shellUpdate config
          if (gitBinary.shellUpdate) {
            const binaryShellUpdateOptions: ShellUpdaterOptions = {
              programName: gitBinary.cmd, // Pass gitBinary.cmd as programName
              systemInfo: systemInfo,
              shellUpdaterData: gitBinary.shellUpdate,
            };
            await shellUpdater.add(binaryShellUpdateOptions);
          }
        }
      } else {
        logger.warn('No gitBinaries found in configuration to install.')
      }
    } else {
      logger.warn('No gitBinaries section found in configuration.')
    }

    // If uninstall flag is provided, run uninstaller and exit
    if (isUninstall) {
      logger.info('Uninstall flag detected. Proceeding with uninstallation.')
      if (config?.gitBinaries) {
        await uninstallBinaries(config.gitBinaries, targetBinPath, systemInfo)
      } else {
        logger.warn('No gitBinaries found in configuration to uninstall.')
      }
      return // Exit the script after uninstallation
    }
    

  } catch (err) {
    logger.error(`Error: ${(err as Error).message}`)
    process.exit(1)
  }
}

run()
