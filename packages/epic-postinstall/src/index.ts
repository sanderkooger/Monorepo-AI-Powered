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

    // Temporarily implement installer for the first binary only
    if (config?.binaries) {
      const binaryNames = Object.keys(config.binaries)
      if (binaryNames.length > 0) {
        const firstBinaryName = binaryNames[0]
        const firstBinary = config.binaries[firstBinaryName]
        logger.info(`Attempting to install: ${firstBinaryName}`)
        await runInstaller({
          systemInfo,
          version: firstBinary.version,
          githubUrl: firstBinary.githubRepo,
          targetBinPath
        })
      } else {
        logger.warn('No binaries found in configuration to install.')
      }
    } else {
      logger.warn('No binaries section found in configuration.')
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
