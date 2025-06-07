import path from 'path'
import { promises as fs } from 'fs'
import logger from '../logger/index.js'
import { GitBinary } from '../helpers/getConfig/index.js'

export async function uninstallBinaries(
  gitBinaries: Record<string, GitBinary>,
  targetBinPath: string
): Promise<void> {
  logger.info('Starting uninstallation of git binaries...')

  for (const binaryKey in gitBinaries) {
    const binary = gitBinaries[binaryKey]
    const binaryPath = path.join(targetBinPath, binary.cmd)

    try {
      await fs.access(binaryPath, fs.constants.F_OK)
      logger.info(`Found ${binary.cmd} at ${binaryPath}. Attempting to remove...`)
      await fs.unlink(binaryPath)
      logger.info(`Successfully removed ${binary.cmd}.`)
    } catch (error: unknown) {
      if (isNodeJS_ErrnoException(error) && error.code === 'ENOENT') {
        logger.info(`${binary.cmd} not found at ${binaryPath}. Skipping removal.`)
      } else if (isNodeJS_ErrnoException(error)) {
        logger.error(`Failed to remove ${binary.cmd} at ${binaryPath}: ${error.message}`)
      } else {
        logger.error(`An unknown error occurred while removing ${binary.cmd}: ${error}`)
      }
    }
  }
  logger.info('Uninstallation process completed.')
}

function isNodeJS_ErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as NodeJS.ErrnoException).code === 'string'
  )
}