#!/usr/bin/env node

import * as os from 'node:os'
import * as path from 'node:path'
import getConfig, { EpicPostinstallConfig } from '@helpers/getConfig/index.js'
import getSystemInfo from '@helpers/getSystemInfo/index.js'
import logger, { LogLevel } from '@src/logger/index.js'
import argumentParser from '@helpers/argumentParser/index.js';
import displaySplashScreen from '@helpers/splashscreen.js';

import { uninstall } from '@src/uninstaller/index.js'
import { installBinaries } from '@src/installer/index.js'
import { installPythonEnvironment } from '@src/env-installer/python.js';

const run = async () => {
  const args = process.argv.slice(2);
  const { isUninstall, isVerbose, isDebug, isSplash } = argumentParser(args);

  if (isSplash) {
    displaySplashScreen();
  }

  const targetBinPath = path.join(os.homedir(), '.local', 'bin');
  if (isDebug) {
    logger.setLogLevel(LogLevel.DEBUG);
  } else if (isVerbose) {
    logger.setLogLevel(LogLevel.VERBOSE);
  } else {
    logger.setLogLevel(LogLevel.INFO); // Default to INFO if no flags are set
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
    

    // If uninstall flag is provided, run uninstaller and exit
    if (isUninstall) {
      logger.info('Uninstall flag detected. Proceeding with uninstallation.')
      await uninstall(process.cwd(), targetBinPath, systemInfo);
      return // Exit the script after uninstallation
    } else {
      // Installation logic
      await installBinaries({ config, systemInfo, targetBinPath });

      if (config && config.python) {
        logger.info('\nStarting Python environment setup...');
        await installPythonEnvironment(config, process.cwd()); // Pass the full config
      }
    }
  } catch (err) {
    logger.error(`Error: ${(err as Error).message}`)
    process.exit(1)
  }
}

run()

export type { EpicPostinstallConfig };
