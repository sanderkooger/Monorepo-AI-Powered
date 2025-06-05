#!/usr/bin/env node

import { getConfig } from './getConfig/index.js'
import { getSystemInfo } from './getSystemInfo/index.js';
import logger, { LogLevel } from './logger/index.js';
import { addBinToPath } from './helpers/addBinToPath.js';

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
    logger.info('System Information:')
    logger.info(JSON.stringify(systemInfo, null, 2))

    // Ensure ~/.local/bin is in PATH for Linux/macOS
    if (systemInfo.os === 'linux' || systemInfo.os === 'macos') {
    
      const pathEnsured = await addBinToPath(targetBinPath)
      if (!pathEnsured) {
        logger.error(
          `Failed to ensure '${targetBinPath}' is in PATH. Installation may not function correctly. Please add it manually.`
        )
        // Decide whether to exit or continue with a warning
        // For now, we'll continue but log an error.
      }
    }

    if (isUninstall) {
      logger.info('Uninstalling epic-postinstall...')
    } else {
      logger.info('\nConfiguration loaded successfully:')
      
    }
  } catch (err) {
    logger.error(`Error: ${(err as Error).message}`)
    process.exit(1)
  }
}

run()
