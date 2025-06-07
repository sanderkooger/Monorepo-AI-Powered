#!/usr/bin/env node

import getConfig from '@helpers/getConfig/index.js'
import getSystemInfo from '@helpers/getSystemInfo/index.js'
import logger, { LogLevel } from '@src/logger/index.js'
import addBinToPath from '@helpers/addBinToPath/index.js'
import runInstaller from '@src/installer/index.js'


const run = async () => {
  const args = process.argv.slice(2)
  const isUninstall = args.includes('--uninstall')
  const isVerbose = args.includes('--verbose')
  const isDebug = args.includes('--debug')
  const targetBinPath = '~/.local/bin'
  if (isDebug) {
    logger.setLogLevel(LogLevel.DEBUG)
  } else if (isVerbose) {
    logger.setLogLevel(LogLevel.VERBOSE)
  } else {
    logger.setLogLevel(LogLevel.INFO) // Default to INFO if no flags are set
  }

  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const githubToken = process.env.GITHUB_TOKEN; // Retrieve token from environment variable

  if (githubToken) {
    logger.info('GitHub token found in environment variables.');
  } else {
    logger.warn('No GitHub token found in environment variables. Proceeding with unauthenticated requests.');
  }

  try {
    const config = getConfig()

    logger.info(config?.message)

    logger.info('\nDetecting system information...')
    const systemInfo = getSystemInfo()

    // Ensure ~/.local/bin is in PATH for Linux/macOS
    if (systemInfo.os === 'linux' || systemInfo.os === 'macos') {
      const pathEnsured = await addBinToPath(targetBinPath, systemInfo)
      if (!pathEnsured) {
        logger.error(
          `Failed to ensure '${targetBinPath}' is in PATH. Installation may not function correctly. Please add it manually.`
        )
        // Decide whether to exit or continue with a warning
        // For now, we'll continue but log an error.
      }
    } else {
      logger.error(
        `Operating System '${systemInfo.os}' is not currently supported. This script is only compatible with Linux and macOS.`
      )
      process.exit(1)
    }

    if (config?.gitBinaries) {
      const binaryNames = Object.keys(config.gitBinaries)
      if (binaryNames.length > 0) {
        for (const binaryName of binaryNames) {
          const binary = config.gitBinaries[binaryName]
          logger.info(`Attempting to install: ${binaryName}`)
          await runInstaller({
            systemInfo,
            version: binary.version,
            githubUrl: binary.githubRepo,
            targetBinPath,
          })
        }
      } else {
        logger.warn('No gitBinaries found in configuration to install.')
      }
    } else {
      logger.warn('No gitBinaries section found in configuration.')
    }

    if (isUninstall) {
      logger.info('Uninstalling epic-postinstall...')
      logger.info('to be implemented...')
      // to be implemented
    }
  } catch (err) {
    logger.error(`Error: ${(err as Error).message}`)
    process.exit(1)
  }
}

run()
