#!/usr/bin/env node

import * as os from 'node:os'
import * as path from 'node:path'
import getConfig from '@helpers/getConfig/index.js'
import getSystemInfo from '@helpers/getSystemInfo/index.js'
import logger, { LogLevel } from '@src/logger/index.js'

import { uninstallBinaries, uninstallAsdf } from '@src/uninstaller/index.js'
import { installBinaries } from '@src/installer/index.js'

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

    // If uninstall flag is provided, run uninstaller and exit
    if (isUninstall) {
      logger.info('Uninstall flag detected. Proceeding with uninstallation.')
      if (config?.gitBinaries) {
        const { asdf, ...otherBinaries } = config.gitBinaries; // Separate asdf from other binaries
        await uninstallBinaries(otherBinaries, targetBinPath, systemInfo); // Uninstall other binaries first
        if (asdf) {
          await uninstallAsdf(asdf, targetBinPath, systemInfo); // Uninstall asdf last
        }
      } else {
        logger.warn('No gitBinaries found in configuration to uninstall.')
      }
      return // Exit the script after uninstallation
    } else {
      // Installation logic
      await installBinaries({ config, systemInfo, targetBinPath });
    }
  } catch (err) {
    logger.error(`Error: ${(err as Error).message}`)
    process.exit(1)
  }
}

run()
